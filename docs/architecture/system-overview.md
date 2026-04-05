# Cumulus System Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          USERS                                   │
│  (Investors, Property Buyers, Jagi Properties, Admins)           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ HTTPS / Web3
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 14)                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │   Landing    │ │  Properties  │ │      Dashboard           │ │
│  │    Page      │ │   Browser    │ │   (Portfolio, Fees)      │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │  Marketplace │ │  Governance  │ │   Property Detail        │ │
│  │  (Buy/Sell)  │ │  (Voting)    │ │   (Token Economics)      │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Web3 Integration Layer                        │  │
│  │  RainbowKit │ Wagmi │ Ethers.js v6 │ Network Validation   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
    JSON-RPC Calls          REST API Calls
           │                       │
           ▼                       ▼
┌──────────────────────┐  ┌──────────────────────────────────────┐
│   POLYGON NETWORK    │  │       BACKEND (Express.js)           │
│                      │  │                                      │
│  ┌────────────────┐  │  │  ┌──────────────────────────────┐   │
│  │ CumulusRegistry│  │  │  │   Property API               │   │
│  │ (KYC, Foreign  │  │  │  │   GET /api/properties        │   │
│  │  Ownership)    │  │  │  │   POST /api/properties       │   │
│  └────────────────┘  │  │  └──────────────────────────────┘   │
│                      │  │                                      │
│  ┌────────────────┐  │  │  ┌──────────────────────────────┐   │
│  │CumulusProperty │  │  │  │   User/KYC API               │   │
│  │NFT (ERC-721,   │  │  │  │   POST /api/users/kyc        │   │
│  │ Maintenance)   │  │  │  │   GET /api/users/:addr/kyc   │   │
│  └────────────────┘  │  │  └──────────────────────────────┘   │
│                      │  │                                      │
│  ┌────────────────┐  │  │  ┌──────────────────────────────┐   │
│  │CumulusMarket   │  │  │  │   Marketplace API            │   │
│  │(Buy/Sell,      │  │  │  │   GET /api/listings          │   │
│  │ Royalties)     │  │  │  │   POST /api/listings         │   │
│  └────────────────┘  │  │  └──────────────────────────────┘   │
│                      │  │                                      │
│  ┌────────────────┐  │  │  ┌──────────────────────────────┐   │
│  │   Events       │◄─┼──┼──┤   Event Indexer              │   │
│  │   (Indexed)    │  │  │  │   (Listens to blockchain)    │   │
│  └────────────────┘  │  │  └──────────────────────────────┘   │
└──────────────────────┘  └──────────┬───────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │   PostgreSQL DB       │
                          │                       │
                          │  ┌─────────────────┐  │
                          │  │ properties      │  │
                          │  │ users           │  │
                          │  │ listings        │  │
                          │  │ maintenance_    │  │
                          │  │   payments      │  │
                          │  │ proposals       │  │
                          │  │ votes           │  │
                          │  └─────────────────┘  │
                          └───────────────────────┘
                                     ▲
                                     │
                          ┌──────────────────────┐
                          │   IPFS (Pinata)       │
                          │                       │
                          │  - Property images    │
                          │  - Metadata JSON      │
                          │  - KYC documents      │
                          │  - Property docs      │
                          └───────────────────────┘
```

## Component Interactions

### Token Purchase Flow

```
User                    Frontend                Marketplace Contract        Registry Contract
 │                        │                           │                          │
 │ 1. Connect Wallet      │                           │                          │
 ├───────────────────────►│                           │                          │
 │                        │                           │                          │
 │ 2. Browse Properties   │                           │                          │
 ├───────────────────────►│                           │                          │
 │                        │                           │                          │
 │ 3. Select Token        │                           │                          │
 │    "Buy Token"         │                           │                          │
 ├───────────────────────►│                           │                          │
 │                        │ 4. Check KYC status       │                          │
 │                        ├──────────────────────────►│                          │
 │                        │                           │                          │
 │                        │ 5. Check foreign cap      │                          │
 │                        ├─────────────────────────────────────────────────────►
 │                        │                           │                          │
 │                        │ 6. If allowed, proceed    │                          │
 │                        │                           │                          │
 │ 7. Confirm Purchase    │                           │                          │
 │    (Sign transaction)  │                           │                          │
 ├───────────────────────►│                           │                          │
 │                        │ 8. buyToken(tokenId)      │                          │
 │                        │    + payment (MATIC)      │                          │
 │                        ├──────────────────────────►│                          │
 │                        │                           │                          │
 │                        │                           │ 9. Calculate royalty     │
 │                        │                           │    (2.5% to Jagi)        │
 │                        │                           │                          │
 │                        │                           │ 10. Check canTransfer()  │
 │                        │                           ├─────────────────────────►
 │                        │                           │                          │
 │                        │                           │ 11. If allowed:          │
 │                        │                           │     - Send royalty       │
 │                        │                           │     - Send to seller     │
 │                        │                           │     - Transfer NFT       │
 │                        │                           │                          │
 │ 12. Transaction receipt│                           │                          │
 │<───────────────────────┤                           │                          │
 │                        │                           │                          │
 │ 13. Update UI          │                           │                          │
 │    (Show token in      │                           │                          │
 │     portfolio)         │                           │                          │
```

### Maintenance Fee Payment Flow

```
User                    Frontend                PropertyNFT Contract        Backend
 │                        │                           │                        │
 │ 1. View Dashboard      │                           │                        │
 │    "Maintenance due:   │                           │                        │
 │     ₱500"              │                           │                        │
 ├───────────────────────►│                           │                        │
 │                        │                           │                        │
 │ 2. Click "Pay Now"     │                           │                        │
 ├───────────────────────►│                           │                        │
 │                        │                           │                        │
 │ 3. Confirm Payment     │                           │                        │
 │    (Sign transaction)  │                           │                        │
 ├───────────────────────►│                           │                        │
 │                        │ 4. payMaintenance(tokenId)│                        │
 │                        │    + ₱500 (MATIC)         │                        │
 │                        ├──────────────────────────►│                        │
 │                        │                           │                        │
 │                        │                           │ 5. Update              │
 │                        │                           │    lastMaintenancePaid │
 │                        │                           │    = block.timestamp   │
 │                        │                           │                        │
 │                        │                           │ 6. Transfer to treasury│
 │                        │                           │                        │
 │                        │                           │ 7. Emit                │
 │                        │                           │    MaintenancePaid     │
 │                        │                           │    event               │
 │                        │                           │                        │
 │                        │                           │                        │ 8. Indexer catches
 │                        │                           │                        │    event
 │                        │                           ├────────────────────────►
 │                        │                           │                        │
 │                        │                           │                        │ 9. Update DB
 │                        │ 10. Transaction receipt   │                        │
 │<───────────────────────┤                           │                        │
 │                        │                           │                        │
 │ 11. Success toast     │                           │                        │
 │     "Maintenance paid  │                           │                        │
 │      until [date]"     │                           │                        │
```

### Transfer Restriction (Overdue Maintenance)

```
User                    Frontend                PropertyNFT Contract
 │                        │                           │
 │ 1. Attempt to transfer │                           │
 │    token (sell/gift)   │                           │
 ├───────────────────────►│                           │
 │                        │ 2. transferFrom()         │
 │                        ├──────────────────────────►│
 │                        │                           │
 │                        │                           │ 3. _beforeTokenTransfer()
 │                        │                           │    Check: block.timestamp
 │                        │                           │      <= lastPaid + 30 days
 │                        │                           │
 │                        │                           │ 4. FAIL: Overdue
 │                        │                           │    revert("Maintenance
 │                        │                           │    overdue - pay ₱500")
 │                        │                           │
 │                        │ 5. Error returned         │
 │<───────────────────────┤                           │
 │                        │                           │
 │ 6. Show error toast:   │                           │
 │    "Cannot transfer:   │                           │
 │     Maintenance        │                           │
 │     overdue. Pay ₱500  │                           │
 │     to enable transfers│                           │
 │                        │                           │
 │ 7. User pays maintenance (see flow above)          │
 │                        │                           │
 │ 8. Retry transfer ────────────────────────────────►│
 │                        │                           │
 │                        │                           │ 9. SUCCESS: Transfer allowed
```

## Smart Contract Architecture

### Inheritance Tree

```
CumulusPropertyNFT
├── ERC721 (OpenZeppelin 5.x)
│   └── Context
├── ERC721Enumerable (OpenZeppelin 5.x)
├── Ownable (OpenZeppelin 5.x)
├── Pausable (OpenZeppelin 5.x)
└── Custom logic
    ├── maintenance fee tracking
    ├── _beforeTokenTransfer override
    └── payable functions

CumulusMarketplace
├── Ownable (OpenZeppelin 5.x)
├── ReentrancyGuard (OpenZeppelin 5.x)
└── Custom logic
    ├── listing management
    ├── buy/sell with royalty
    └── foreign ownership checks

CumulusRegistry
├── AccessControl (OpenZeppelin 5.x)
└── Custom logic
    ├── property registration
    ├── KYC status management
    ├── foreign ownership tracking
    └── compliance checks
```

## Security Model

### Smart Contract Security
- OpenZeppelin battle-tested contracts
- Multi-signature for admin functions (Gnosis Safe in production)
- Pausable contracts for emergency situations
- Reentrancy protection (Checks-Effects-Interactions)
- Access control on all admin functions
- Input validation on all public functions
- Events for all state changes (audit trail)

### Backend Security
- API rate limiting
- API key authentication for admin endpoints
- Input validation (Zod/Joi)
- SQL injection prevention (parameterized queries)
- CORS configuration
- Helmet.js security headers
- HTTPS enforcement

### Data Security
- KYC data encrypted at rest (AES-256)
- Database access restricted by role
- No PII stored on-chain
- Private keys never stored in code
- Environment variables for secrets

## Scalability Considerations

### Read Scaling
- Off-chain indexing (custom indexer or The Graph)
- Database read replicas for high traffic
- CDN for static assets (Vercel Edge Network)
- IPFS gateway caching (Pinata)
- WebSocket for real-time updates (not polling)

### Write Scaling
- Batch operations (Phase 2)
- Meta-transactions for gasless UX (Phase 2)
- Layer 2 consideration (Polygon already L2-ish)

### Future Scaling Options
- Polygon zkEVM migration (lower fees)
- Arbitrum/Optimism migration
- Chainlink Automation for maintenance fees
- The Graph for indexing

## Monitoring & Observability

### Smart Contracts
- Event logging for all state changes
- Polygonscan verification
- Tenderly monitoring (production)
- Alert system for unusual activity

### Backend
- Winston/Pino logging
- Error tracking (Sentry)
- Uptime monitoring
- Performance metrics (APM)

### Frontend
- Error boundaries
- Sentry error tracking
- Analytics (PostHog or Plausible)
- Performance monitoring (Web Vitals)
