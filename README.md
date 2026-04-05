# Cumulus - Real Estate Tokenization Platform

Blockchain-based platform for tokenizing Philippine real estate properties. Built for Jagi Properties and Bull Run Consulting.

## 🏗️ Architecture

```
Frontend (Next.js) ←→ Backend (Express) ←→ PostgreSQL
       ↓
Polygon Network (Smart Contracts)
       ↓
IPFS (Property Metadata)
```

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- MetaMask or compatible Web3 wallet
- Alchemy or Infura account (for Polygon RPC)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Root (smart contracts)
cd cumulus-poc
npm install

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Fill in your values:
# - POLYGON_MUMBAI_RPC_URL
# - DEPLOYER_PRIVATE_KEY
# - DATABASE_URL
# - PINATA_API_KEY
```

### 3. Set Up Database

```bash
cd backend
npm run db:migrate
```

### 4. Compile Smart Contracts

```bash
cd ..
npm run compile
```

### 5. Run Tests

```bash
npm test
```

### 6. Deploy to Mumbai Testnet

```bash
npm run deploy:mumbai
```

### 7. Start Backend

```bash
cd backend
npm run dev
# Backend runs on http://localhost:3001
```

### 8. Start Frontend

```bash
cd ../frontend
npm run dev
# Frontend runs on http://localhost:3000
```

Visit http://localhost:3000 to see the application!

## 📁 Project Structure

```
cumulus-poc/
├── contracts/               # Solidity smart contracts
│   ├── CumulusPropertyNFT.sol   # ERC-721 with maintenance fees
│   ├── CumulusMarketplace.sol   # Secondary trading with royalties
│   ├── CumulusRegistry.sol      # KYC & foreign ownership tracking
│   └── test/                    # Contract tests
├── frontend/                # Next.js application
│   ├── app/                 # Pages (App Router)
│   ├── components/          # Reusable UI components
│   └── public/              # Static assets
├── backend/                 # Express API server
│   ├── src/                 # Source code
│   └── db/                  # Database schema & migrations
├── scripts/                 # Deployment scripts
├── docs/                    # Documentation
│   ├── ADR/                # Architecture Decision Records
│   └── architecture/       # System architecture
├── hardhat.config.js        # Hardhat configuration
└── package.json             # Root package.json
```

## 🔑 Key Technologies

- **Blockchain:** Polygon (Mumbai testnet for PoC)
- **Smart Contracts:** Solidity 0.8.20, Hardhat, OpenZeppelin 5.x
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, RainbowKit, Wagmi
- **Backend:** Node.js, Express, PostgreSQL
- **Storage:** IPFS (Pinata)

## 🎯 Features

### ✅ Implemented
- ERC-721 NFTs representing property ownership
- Maintenance fee tracking with transfer restrictions
- Custom marketplace with enforced 2.5% royalties
- KYC verification system
- Foreign ownership cap tracking (40% for condos)
- Frontend for browsing, buying, and managing tokens
- Dashboard for portfolio management
- Governance voting system

### 🚧 Phase 2
- Chainlink Automation for maintenance fee reminders
- Meta-transactions for gasless UX
- Advanced governance (proposal creation, delegation)
- Property valuation updates
- Mobile app (React Native)

## 🧪 Testing

```bash
# Smart contracts
npm test
npm run test:coverage

# Frontend (future)
cd frontend && npm test

# E2E (future)
cd frontend && npm run test:e2e
```

## 📊 Smart Contract Addresses

After deployment, update these in `.env`:

```
REGISTRY_ADDRESS=0x...
PROPERTY_NFT_ADDRESS=0x...
MARKETPLACE_ADDRESS=0x...
JAGI_TREASURY_ADDRESS=0x...
PROPERTY_TREASURY_ADDRESS=0x...
```

## 🔐 Security

- OpenZeppelin battle-tested contracts
- Reentrancy protection (Checks-Effects-Interactions)
- Pausable contracts for emergencies
- Access control on admin functions
- Rate limiting on API endpoints
- KYC data encrypted at rest

## 📈 Scalability

- Off-chain indexing via backend API
- Database read replicas for high traffic
- CDN for static assets (Vercel)
- IPFS gateway caching (Pinata)

## 📚 Documentation

- [System Overview](docs/architecture/system-overview.md)
- [Development Principles](docs/principles.md)
- [ADR-001: Blockchain Selection](docs/ADR/001-blockchain-selection.md)
- [ADR-002: Royalty Enforcement](docs/ADR/002-royalty-enforcement.md)
- [ADR-003: Maintenance Fee Model](docs/ADR/003-maintenance-fee-model.md)
- [ADR-004: Compliance Architecture](docs/ADR/004-compliance-architecture.md)

## 🎬 Demo

See [docs/demo-script.md](docs/demo-script.md) for step-by-step demo instructions.

## 🚢 Deployment

### Smart Contracts
```bash
npm run deploy:mumbai
```

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Railway/Render)
```bash
cd backend
# Push to git and connect to Railway/Render
```

## 📝 License

Proprietary - Bull Run Consulting / Starting Block Ventures / Jagi Properties

## 👥 Team

- **Jagi Properties** - Philippine real estate developer
- **Bull Run Consulting** - Web3 venture builder
- **Starting Block Ventures** - Venture studio

## 🆘 Support

For issues or questions, contact the development team.

---

**Built with ❤️ for the Philippine real estate market**
