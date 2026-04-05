# 002. Royalty Enforcement Strategy

Date: 2026-04-05

## Status

Accepted

## Context

Standard NFT royalties (ERC-2981) are optional and can be bypassed by marketplaces. We need guaranteed royalty payments on ALL secondary sales to ensure Jagi Properties receives 2.5% revenue from every transaction.

Business requirement: Jagi Properties must receive 2.5% royalty on every secondary sale of property tokens. This is a core revenue model and cannot be optional or bypassed.

## Decision

**Custom marketplace smart contract with enforced royalty deduction before token transfer.**

Implementation approach:
```solidity
function buyToken(uint256 tokenId) external payable {
    Listing memory listing = listings[tokenId];
    require(msg.value >= listing.price, "Insufficient payment");
    
    uint256 royalty = (listing.price * royaltyBps) / 10000;
    uint256 sellerAmount = listing.price - royalty;
    
    // ENFORCED: Royalty sent first
    payable(jagiTreasury).transfer(royalty);
    
    // Seller receives remainder
    payable(listing.seller).transfer(sellerAmount);
    
    // Transfer NFT
    propertyNFT.transferFrom(listing.seller, msg.sender, tokenId);
    
    // Clean up
    delete listings[tokenId];
}
```

## Consequences

### Positive Consequences
- Mathematical guarantee of royalty payments (100% enforcement)
- Revenue certainty enables business model planning
- Cannot be bypassed - all sales must go through marketplace
- Transparent on-chain accounting (all parties can verify)
- No dependency on external marketplace compliance

### Negative Consequences
- Must build custom marketplace (cannot use OpenSea, Rarible, etc.)
- Users cannot list on external platforms
- Additional smart contract deployment cost
- Requires user education on why they must use our marketplace
- Direct NFT transfers (not through marketplace) still possible - must implement transfer restrictions

## Alternatives Considered

1. **ERC-2981 Standard**
   - Pros: Industry standard, supported by many marketplaces
   - Cons: Optional enforcement, marketplaces can ignore, no guarantee
   - Why rejected: 0% enforcement guarantee - business model depends on royalties

2. **Backend Enforcement**
   - Pros: Easier to implement, off-chain logic
   - Cons: Can be bypassed via direct smart contract interaction, centralized
   - Why rejected: Not enforceable, defeats purpose of blockchain

3. **Operator Filtering**
   - Pros: Blocks known marketplaces from transferring
   - Cons: Complex to maintain, not foolproof, new marketplaces constantly emerging
   - Why rejected: Arms race with marketplaces, not sustainable

4. **Transfer Tax (On-Chain Royalty)**
   - Pros: Enforced at NFT contract level, works with any marketplace
   - Cons: Non-standard, may break marketplace integrations, complex accounting
   - Why rejected: Too complex for PoC, may have compatibility issues

## Implementation Notes

- Royalty percentage stored in basis points (250 = 2.5%)
- Jagi treasury address configurable by admin
- Royalty calculation: `(price * royaltyBps) / 10000`
- Refund overpayment to buyer
- Revert on underpayment
- All transactions logged with events for off-chain indexing

## References

- ERC-2981 specification: https://eips.ethereum.org/EIPS/eip-2981
- OpenSea royalty documentation
- Manifold Royalty Standard: https://royaltyregistry.xyz/
- Jagi Properties business model requirements
