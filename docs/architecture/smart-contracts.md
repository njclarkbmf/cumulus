# Smart Contracts Documentation

## Overview

Cumulus uses three main smart contracts deployed on Polygon:

1. **CumulusRegistry** - Compliance hub (KYC, foreign ownership)
2. **CumulusPropertyNFT** - ERC-721 tokens with maintenance fees
3. **CumulusMarketplace** - Secondary trading with enforced royalties

---

## 1. CumulusRegistry.sol

### Purpose
Central registry for managing properties, KYC status, and foreign ownership tracking.

### State Variables

```solidity
uint256 public foreignOwnershipCap; // Default: 40% for condos

mapping(address => PropertyInfo) public properties;
mapping(address => UserKYC) public kycData;
mapping(address => mapping(address => bool)) public foreignOwners;
address[] public propertyContracts;
```

### Key Functions

#### Admin Functions
- `registerProperty(propertyId, nftContract, maxSupply)` - Register new property
- `setForeignOwnershipCap(capPercentage)` - Update foreign ownership limit
- `setKYCStatus(user, verified, nationality)` - Set KYC verification (KYC provider only)
- `updateOwnership(nftContract, owner, isForeign)` - Track ownership changes

#### View Functions
- `isKYCVerified(user)` → `bool` - Check KYC status
- `getUserNationality(user)` → `string` - Get user nationality
- `getForeignOwnershipPercentage(nftContract)` → `uint256` - Calculate foreign %
- `canTransfer(nftContract, from, to)` → `(bool, string)` - Compliance check
- `isEligibleForRedemption(user, nftContract)` → `bool` - Check redemption eligibility

### Events
- `PropertyRegistered(propertyId, nftContract, maxSupply)`
- `KYCStatusUpdated(user, verified, nationality, timestamp)`
- `OwnershipUpdated(nftContract, owner, isForeign)`
- `ForeignOwnershipCapUpdated(newCap)`

### Access Control
- `DEFAULT_ADMIN_ROLE`: Deployer
- `ADMIN_ROLE`: Property management
- `KYC_PROVIDER_ROLE`: KYC verification

---

## 2. CumulusPropertyNFT.sol

### Purpose
ERC-721 NFT representing fractional ownership of a specific property with maintenance fee tracking.

### Inheritance
- ERC721 (OpenZeppelin 5.x)
- ERC721Enumerable
- Ownable
- Pausable

### State Variables

```solidity
uint256 public monthlyMaintenanceFee; // in wei
uint256 public constant MAINTENANCE_GRACE_PERIOD = 30 days;
address public propertyTreasury;
address public registryContract;
string public propertyAddress;
uint256 public totalPropertyValue;

mapping(uint256 => uint256) public lastMaintenancePaid;
```

### Key Functions

#### Minting
- `mint(to, tokenId, uri)` - Create new token (owner only)

#### Maintenance
- `payMaintenance(tokenId)` - Pay monthly maintenance fee (payable)
- `setMaintenanceFee(newFee)` - Update fee amount (owner only)
- `getMaintenanceStatus(tokenId)` → `(lastPaid, current, nextDueDate)` - Check status

#### Admin
- `pause()` - Pause all transfers (owner only)
- `unpause()` - Unpause transfers (owner only)
- `setPropertyTreasury(newTreasury)` - Update treasury address
- `setRegistry(newRegistry)` - Update registry address

#### Internal Override
- `_update(to, tokenId, auth)` - Adds maintenance check before transfer

### Transfer Restriction Logic

```solidity
// Skip check for minting
if (from != address(0)) {
    require(
        block.timestamp <= lastMaintenancePaid[tokenId] + 30 days,
        "Maintenance overdue - bayad muna"
    );
}
```

### Events
- `MaintenancePaid(tokenId, payer, amount, paidAt, nextDueDate)`
- `MaintenanceFeeUpdated(newFee)`
- `PropertyTreasuryUpdated(newTreasury)`
- `RegistryUpdated(newRegistry)`

---

## 3. CumulusMarketplace.sol

### Purpose
Custom marketplace with enforced 2.5% royalties and compliance checks.

### State Variables

```solidity
uint256 public royaltyBps; // 250 = 2.5%
address public jagiTreasury;
address public registryContract;
IERC721 public propertyNFT;

mapping(uint256 => Listing) public listings;
uint256 public listingCount;

struct Listing {
    uint256 tokenId;
    address seller;
    address nftContract;
    uint256 price;
    uint256 listedAt;
    bool active;
}
```

### Key Functions

#### Listing Management
- `listToken(tokenId, price)` - List token for sale
- `cancelListing(tokenId)` - Cancel listing
- `updatePrice(tokenId, newPrice)` - Update listing price

#### Trading
- `buyToken(tokenId)` - Purchase token (payable, enforces royalty)

#### Admin
- `setRoyaltyPercentage(bps)` - Update royalty rate
- `setJagiTreasury(treasury)` - Update treasury address
- `setRegistry(registry)` - Update registry address
- `emergencyWithdraw(token, to, amount)` - Emergency fund recovery

#### View
- `getActiveListing(tokenId)` → `Listing` - Get listing details
- `getAllListings()` → `Listing[]` - Get all active listings (gas-intensive)
- `getBalance()` → `uint256` - Contract MATIC balance

### Royalty Calculation

```solidity
uint256 royalty = (price * royaltyBps) / 10000;
uint256 sellerAmount = price - royalty;

// ENFORCED: Royalty sent first
payable(jagiTreasury).transfer(royalty);
payable(seller).transfer(sellerAmount);
```

### Compliance Check

```solidity
// Before purchase, verify buyer can legally own token
_checkCompliance(address(propertyNFT), seller, msg.sender);
```

### Events
- `TokenListed(tokenId, seller, nftContract, price, listedAt)`
- `ListingCancelled(tokenId, seller, cancelledAt)`
- `ListingPriceUpdated(tokenId, newPrice, updatedAt)`
- `TokenSold(tokenId, seller, buyer, nftContract, price, royalty, sellerAmount, soldAt)`
- `RoyaltyUpdated(newRoyaltyBps)`
- `JagiTreasuryUpdated(newTreasury)`

---

## Contract Interactions

### Deployment Order
1. Deploy CumulusRegistry
2. Deploy CumulusPropertyNFT (with registry address)
3. Deploy CumulusMarketplace (with NFT and registry addresses)
4. Register property in registry
5. Set marketplace as approved operator on NFT contract

### Token Purchase Flow
```
Buyer → Marketplace.buyToken(tokenId) 
  → Check compliance (registry.canTransfer)
  → Calculate royalty
  → Send royalty to Jagi treasury
  → Send remainder to seller
  → Transfer NFT to buyer
```

### Maintenance Payment Flow
```
Token Holder → PropertyNFT.payMaintenance(tokenId) 
  → Update lastMaintenancePaid[tokenId]
  → Transfer fee to property treasury
  → Emit MaintenancePaid event
```

---

## Gas Optimization

1. **Packing structs** - Related variables packed to minimize storage slots
2. **Events over storage** - Use events for historical data, index off-chain
3. **Batch operations** - Phase 2: batch maintenance payments
4. **View functions** - Read data without gas when possible

---

## Security Features

### Reentrancy Protection
- Checks-Effects-Interactions pattern
- State changes before external calls
- Marketplace: `listing.active = false` before transfers

### Access Control
- OpenZeppelin AccessControl for roles
- Ownable for simple admin functions
- Multi-sig recommended for production

### Emergency Controls
- Pausable contracts (NFT transfers)
- Emergency withdrawal (marketplace)
- Circuit breaker pattern

### Input Validation
- All public functions validate inputs
- Require statements with clear error messages
- Address zero checks

---

## Upgrade Path

### Current (PoC)
- Direct contract deployment
- No upgradeability

### Production Recommendation
- TransparentUpgradeableProxy pattern
- Separate implementation and proxy contracts
- Timelock for upgrades
- Multi-sig governance

---

## Verification

Verify contracts on Polygonscan:

```bash
npx hardhat verify --network mumbai <ADDRESS> [CONSTRUCTOR_ARGS]
```

Example:
```bash
npx hardhat verify --network mumbai 0xRegistry \
  "Cumulus Makati Condo A" \
  "CUMULUS-MKA" \
  0xTreasury \
  10000000000000000 \
  0xRegistry
```

---

## Known Limitations (PoC)

1. **Foreign ownership calculation**: Simplified tracking (Phase 2: full iteration)
2. **Listing queries**: getAllListings() returns empty array (use backend API)
3. **Registry lookup**: No efficient property search by ID (Phase 2: indexing)
4. **No ZK proofs**: KYC data handled by centralized backend (Phase 3: privacy)

---

## Test Coverage

Run tests:
```bash
npm test
npm run test:coverage
```

Target: >95% coverage

Tests cover:
- Deployment and initialization
- Happy paths
- Edge cases
- Error conditions
- Access control
- Event emission
