-- Cumulus Database Schema

-- Properties
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(42) UNIQUE NOT NULL,
    property_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    images JSONB,
    total_value NUMERIC(20, 2),
    total_supply INTEGER,
    maintenance_fee NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255),
    kyc_verified BOOLEAN DEFAULT FALSE,
    nationality VARCHAR(50),
    kyc_documents JSONB,
    kyc_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Listings (off-chain cache for faster queries)
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    token_id INTEGER NOT NULL,
    property_id INTEGER REFERENCES properties(id),
    seller_address VARCHAR(42) NOT NULL,
    price NUMERIC(20, 2),
    listed_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    sold_at TIMESTAMP,
    buyer_address VARCHAR(42),
    tx_hash VARCHAR(66)
);

-- Maintenance Payments (off-chain record)
CREATE TABLE IF NOT EXISTS maintenance_payments (
    id SERIAL PRIMARY KEY,
    token_id INTEGER NOT NULL,
    property_id INTEGER REFERENCES properties(id),
    payer_address VARCHAR(42) NOT NULL,
    amount NUMERIC(10, 2),
    paid_at TIMESTAMP DEFAULT NOW(),
    tx_hash VARCHAR(66) NOT NULL
);

-- Governance Proposals
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    cost_estimate NUMERIC(20, 2),
    created_by VARCHAR(42) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    voting_ends_at TIMESTAMP,
    status VARCHAR(20),
    for_votes INTEGER DEFAULT 0,
    against_votes INTEGER DEFAULT 0
);

-- Votes
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER REFERENCES proposals(id),
    voter_address VARCHAR(42) NOT NULL,
    vote_weight INTEGER,
    vote_choice BOOLEAN,
    voted_at TIMESTAMP DEFAULT NOW(),
    tx_hash VARCHAR(66),
    UNIQUE(proposal_id, voter_address)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(active);
CREATE INDEX IF NOT EXISTS idx_listings_property ON listings(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_token ON maintenance_payments(token_id);
CREATE INDEX IF NOT EXISTS idx_proposals_property ON proposals(property_id);
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_address);
