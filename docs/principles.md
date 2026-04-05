# Cumulus Development Principles & Patterns

## Core Principles

### 1. Security First

All financial transactions must be auditable and secure. We are handling real estate assets and user funds - there is no room for compromise.

**Rules:**
- Use OpenZeppelin battle-tested contracts (never reinvent the wheel)
- Multi-signature for admin functions (Gnosis Safe in production)
- No private key storage in code or environment files
- All external calls must follow Checks-Effects-Interactions pattern
- Input validation on all public functions
- Rate limiting on API endpoints
- Regular security audits before production deployment

**Examples:**
```solidity
// GOOD: Reentrancy protection
function buyToken(uint256 tokenId) external payable {
    // CHECKS
    require(msg.value >= price, "Insufficient payment");
    
    // EFFECTS (state changes before external calls)
    delete listings[tokenId];
    
    // INTERACTIONS (external calls last)
    payable(seller).transfer(amount);
    propertyNFT.transferFrom(seller, buyer, tokenId);
}

// BAD: Reentrancy vulnerability
function buyToken(uint256 tokenId) external payable {
    payable(seller).transfer(amount); // External call first!
    delete listings[tokenId]; // Attacker can re-enter here
}
```

### 2. Regulatory Compliance by Design

The Philippine regulatory environment requires built-in compliance. We don't bolt it on later - it's core to the architecture.

**Rules:**
- KYC gates before any token operations
- Foreign ownership tracking at contract level (40% cap for condos)
- Audit trails for all transactions
- SEC/AMLC reporting capabilities built-in
- Nationality verification for redemption eligibility

**Examples:**
```solidity
// Marketplace enforces KYC + foreign ownership
function buyToken(uint256 tokenId) external payable {
    require(registry.isKYCVerified(msg.sender), "KYC required");
    
    (bool allowed, string memory reason) = registry.canTransfer(
        address(propertyNFT), 
        address(0), 
        msg.sender
    );
    require(allowed, reason);
    
    // ... proceed with purchase
}
```

### 3. User Experience Over Complexity

Most blockchain products fail because they're too complex for normal users. We're building for real estate buyers, not crypto natives.

**Rules:**
- One-click maintenance payments
- Clear error messages in Filipino + English
- Mobile-first responsive design
- Gas fees abstracted where possible (meta-transactions in Phase 2)
- Loading states for all blockchain operations
- Optimistic UI updates (don't wait for confirmations)
- Transaction status with clear feedback

**Examples:**
```typescript
// GOOD: Clear error message
if (!maintenancePaid) {
  throw new Error("Maintenance overdue - pay ₱500 to enable transfers");
}

// BAD: Cryptic error
if (!maintenancePaid) {
  throw new Error("0x1a2b3c");
}
```

### 4. Transparency

All on-chain data should be publicly verifiable. Users must trust the system, and transparency builds trust.

**Rules:**
- All property valuations updated regularly with source documentation
- Fee structures clearly displayed before transactions
- Transaction history fully accessible
- Smart contract source code verified on Polygonscan
- Open-source frontend (can be audited by anyone)

**Examples:**
```typescript
// Display royalty breakdown before purchase
<RoyaltyBreakdown 
  price={500000}
  royaltyBps={250}
  royaltyAmount={12500}
  sellerReceives={487500}
/>

// Shows:
// Purchase Price: ₱500,000
// Royalty (2.5%): ₱12,500 → Jagi Properties
// Seller Receives: ₱487,500
```

### 5. Fail-Safe Mechanisms

Things will go wrong. We must have recovery mechanisms.

**Rules:**
- Circuit breakers for emergency situations (Pausable contracts)
- Upgrade paths for bug fixes (Proxy pattern)
- Recovery mechanisms for edge cases (fund recovery)
- Graceful degradation when services fail
- Fallback RPC endpoints

**Examples:**
```solidity
// Emergency pause
contract CumulusPropertyNFT is Pausable {
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function transferFrom(address from, address to, uint256 tokenId) 
        public 
        whenNotPaused // All transfers blocked when paused
        override 
    {
        super.transferFrom(from, to, tokenId);
    }
}
```

## Design Patterns

### Smart Contract Patterns

#### 1. Factory Pattern
Used for creating property NFT contracts. Registry acts as factory.

```solidity
contract CumulusRegistry {
    mapping(string => address) public propertyContracts;
    
    function registerProperty(
        address nftContract, 
        string memory propertyId, 
        uint256 maxSupply
    ) external onlyOwner {
        propertyContracts[propertyId] = nftContract;
        // ... registration logic
    }
}
```

#### 2. Proxy Pattern (Upgradeability)
For production deployment. Allows contract upgrades without changing addresses.

```solidity
// Use OpenZeppelin TransparentUpgradeableProxy
// Implementation deployed separately
// Proxy points to implementation
// Admin can upgrade implementation
```

#### 3. Access Control
OpenZeppelin Ownable for simple ownership, AccessControl for role-based.

```solidity
contract CumulusRegistry is AccessControl {
    bytes32 public constant KYC_PROVIDER_ROLE = keccak256("KYC_PROVIDER_ROLE");
    
    function setKYCStatus(
        address user, 
        bool verified, 
        string memory nationality
    ) external onlyRole(KYC_PROVIDER_ROLE) {
        // Only KYC providers can update KYC status
    }
}
```

#### 4. Checks-Effects-Interactions
Prevents reentrancy attacks.

```solidity
function buyToken(uint256 tokenId) external payable {
    // 1. CHECKS
    Listing memory listing = listings[tokenId];
    require(listing.active, "Not for sale");
    require(msg.value >= listing.price, "Insufficient payment");
    
    // 2. EFFECTS (state changes)
    delete listings[tokenId];
    foreignOwners[address(propertyNFT)][msg.sender] = 
        registry.isForeign(msg.sender);
    
    // 3. INTERACTIONS (external calls)
    payable(jagiTreasury).transfer(royalty);
    payable(listing.seller).transfer(sellerAmount);
    propertyNFT.transferFrom(listing.seller, msg.sender, tokenId);
}
```

### Frontend Patterns

#### 1. Server Components for Data Fetching
Next.js App Router - fetch property data server-side for SEO.

```tsx
// app/properties/[id]/page.tsx
export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = await fetchProperty(params.id); // Server-side
  return <PropertyDetails property={property} />;
}
```

#### 2. Client Components for Wallet Interactions
Use 'use client' directive for Web3 interactions.

```tsx
'use client';

import { useAccount, useWriteContract } from 'wagmi';

export function BuyTokenButton({ tokenId, price }: { tokenId: number, price: bigint }) {
  const { isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  
  return (
    <button onClick={() => writeContract({
      address: MARKETPLACE_ADDRESS,
      functionName: 'buyToken',
      args: [tokenId],
      value: price,
    })}>
      Buy Token
    </button>
  );
}
```

#### 3. Optimistic UI Updates
Update UI immediately, rollback on error.

```typescript
// Optimistically add token to portfolio
const buyToken = async (tokenId: number) => {
  // Optimistic update
  setPortfolio(prev => [...prev, { tokenId, pending: true }]);
  
  try {
    await writeContractAsync({ /* ... */ });
    // Success - mark as confirmed
    setPortfolio(prev => prev.map(t => 
      t.tokenId === tokenId ? { ...t, pending: false } : t
    ));
  } catch (error) {
    // Rollback
    setPortfolio(prev => prev.filter(t => t.tokenId !== tokenId));
    toast.error('Transaction failed');
  }
};
```

#### 4. Error Boundaries for Web3 Failures
Handle wallet disconnections, transaction failures gracefully.

```tsx
'use client';

export function Web3ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={
      <Alert variant="error">
        Wallet connection failed. Please try again.
      </Alert>
    }>
      {children}
    </ErrorBoundary>
  );
}
```

### API Patterns

#### 1. RESTful Endpoints
Standard REST conventions for off-chain data.

```typescript
// GET /api/properties - List all properties
// GET /api/properties/:id - Get property details
// POST /api/properties - Create property (admin only)
// PUT /api/properties/:id - Update property (admin only)
```

#### 2. Rate Limiting
Protect API from abuse.

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

#### 3. API Key Authentication
Admin endpoints require authentication.

```typescript
function authenticateAPI(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/api/properties', authenticateAPI, createProperty);
```

## Philippine Context

### Localization
- Amounts in PHP (₱), not USD ($)
- Tagalog + English error messages where appropriate
- Philippine address formats (Barangay, City/Municipality, Province)
- Time zone: Asia/Manila (UTC+8)

### Cultural Considerations
- Mobile-first (Philippines has high mobile usage)
- Low bandwidth optimization
- Clear, simple language (avoid jargon)
- Trust signals (regulatory compliance badges)

### Regulatory Landscape
- SEC CASP compliance
- Data Privacy Act of 2012
- AMLC reporting requirements
- Condominium Act (40% foreign ownership)
- Anti-Dummy Law

## Code Quality Standards

### Smart Contracts
- Solidity 0.8.20+ (no older versions)
- OpenZeppelin 5.x (no 3.x or 4.x)
- NatSpec documentation for all public functions
- Gas optimization (avoid unnecessary storage)
- Comprehensive test coverage (>95%)

### Frontend
- TypeScript strict mode
- Next.js 14+ (no create-react-app)
- Tailwind CSS + shadcn/ui
- Responsive design (mobile-first)
- Accessibility (WCAG 2.1 AA)

### Backend
- Node.js 18+
- Express.js with TypeScript
- PostgreSQL 14+
- Input validation (Zod or Joi)
- Error handling middleware
- Logging (Winston or Pino)

## References

- OpenZeppelin documentation: https://docs.openzeppelin.com/
- Next.js documentation: https://nextjs.org/docs
- Express.js best practices
- Philippine regulatory guidelines
- Web3 security best practices
