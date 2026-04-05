# 003. Maintenance Fee Payment Model

Date: 2026-04-05

## Status

Accepted

## Context

Token holders must pay monthly maintenance fees (like HOA dues) for their property tokens. No standard NFT has recurring payments built in. This is a novel requirement for real estate tokenization.

Business requirement: Property maintenance fees of ₱500/month per token. If unpaid, token holder should face restrictions (cannot transfer/sell tokens).

## Decision

**Transfer restriction model - NFTs cannot be transferred if maintenance fees unpaid for >30 days.**

Implementation approach:
```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
    super._beforeTokenTransfer(from, to, tokenId, batchSize);
    
    // Skip check for minting
    if (from == address(0)) return;
    
    require(
        block.timestamp <= lastMaintenancePaid[tokenId] + 30 days,
        "Maintenance overdue - pay fees before transferring"
    );
}
```

## Consequences

### Positive Consequences
- On-chain enforcement (cannot bypass)
- Aligns incentives (must pay to maintain liquidity)
- Clear user feedback ("Pay ₱500 to unlock transfers")
- Simple implementation (OpenZeppelin hook)
- Transparent status visible to all parties

### Negative Consequences
- User must manually pay monthly (UX friction)
- Gas costs for each payment transaction
- No automatic collection (user initiative required)
- Edge case: What if user doesn't want to sell? Still must pay to transfer (gift, inheritance)

## Alternatives Considered

1. **Automated Subscription (Chainlink Automation)**
   - Pros: Automatic payments, no user action required
   - Cons: Requires pre-authorized token allowance, more complex, gas costs for automation
   - Why deferred: More complex for PoC, Phase 2 consideration

2. **Stellar Clawback**
   - Pros: Central authority can reclaim tokens
   - Cons: Too centralized, investors would resist, not aligned with Web3 principles
   - Why rejected: Centralization unacceptable for token holders

3. **Off-Chain Enforcement (Legal)**
   - Pros: No smart contract complexity
   - Cons: Not enforceable automatically, requires legal action, slow
   - Why rejected: Defeats purpose of blockchain automation

4. **Token Burning for Non-Payment**
   - Pros: Strong incentive to pay
   - Cons: Too punitive, destroys value, legal issues
   - Why rejected: Disproportionate penalty

5. **Late Fee Accumulation**
   - Pros: Encourages timely payment, compensates for delays
   - Cons: Complex accounting, user confusion
   - Why deferred: Can add in Phase 2

## Mitigation Strategies

- Email/SMS reminders 7 days before due date
- One-click payment UI (minimal friction)
- Clear status indicators ("Current", "Due in 7 days", "Overdue")
- Dashboard showing all token maintenance statuses
- Batch payment for multiple tokens (Phase 2)

## Edge Cases

1. **User owns multiple tokens**: Must pay for each individually (Phase 2: batch payment)
2. **Token listed for sale**: Buyer should verify maintenance status (marketplace checks)
3. **Grace period**: 30-day window after due date before restriction activates
4. **Overpayment**: If user pays early, next due date extends by 30 days

## References

- HOA dues collection practices (Philippine Condominium Act)
- OpenZeppelin ERC721 hooks documentation
- Chainlink Automation documentation (Phase 2)
