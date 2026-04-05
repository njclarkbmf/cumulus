# 001. Blockchain Selection (Polygon vs Ethereum vs Stellar)

Date: 2026-04-05

## Status

Accepted

## Context

Need to select blockchain for NFT deployment. Requirements: low cost, smart contract support, institutional credibility, compliance tooling.

The Cumulus platform requires:
- NFT minting and trading capabilities
- Custom smart contract logic for royalties and maintenance fees
- Low transaction costs for viable unit economics (target: 10+ properties, ~100 tokens each)
- Institutional credibility for Jagi Properties partnership
- Regulatory compliance tooling (Chainalysis, Elliptic)
- PDAX exchange compatibility

## Decision

**Polygon PoS Chain**

## Reasoning

- **Cost**: $0.05/tx vs $50 Ethereum (99% reduction)
- **Ethereum compatibility**: Same Solidity, tools, auditors
- **Institutional adoption**: Stripe, Adobe, Reddit use Polygon
- **Compliance tooling**: Chainalysis, Elliptic support
- **PDAX likely supports** (to be verified)
- **Fast transactions**: ~2-3 second finality
- **EVM compatibility**: Reuse OpenZeppelin, Hardhat, existing tooling

## Consequences

### Positive Consequences
- Viable unit economics (can support 10+ properties profitably)
- Fast development cycle (Solidity ecosystem maturity)
- Proven at scale (200M+ transactions)
- Access to Ethereum developer talent pool
- Easy migration path to Ethereum L2s in future

### Negative Consequences
- Slightly more centralized than Ethereum (21 validators vs 800K+)
- Bridge dependency for cross-chain operations
- Additional complexity for users unfamiliar with Polygon
- Must educate users on bridging MATIC to Mumbai/Mainnet

## Alternatives Considered

1. **Ethereum Mainnet**
   - Pros: Maximum security, largest ecosystem, most auditors
   - Cons: Cost prohibitive ($1.3M/year in gas for 10 properties), slow transactions (12-15s), network congestion
   - Why rejected: Unit economics don't work for Philippine real estate market

2. **Stellar**
   - Pros: Built for asset tokenization, Soroban smart contracts, compliance features
   - Cons: No smart contracts (pre-Soroban), weaker royalty enforcement, smaller developer ecosystem
   - Why rejected: Cannot enforce 2.5% royalties on-chain, critical revenue requirement

3. **Binance Smart Chain (BSC)**
   - Pros: Low fees, fast transactions, EVM compatible
   - Cons: Too centralized (21 validators controlled by Binance), regulatory concerns, institutional stigma
   - Why rejected: Jagi Properties would not accept BSC for compliance reasons

4. **Solana**
   - Pros: Extremely fast, very low fees
   - Cons: Different programming model (Rust), stability concerns (multiple outages), smaller NFT ecosystem
   - Why rejected: Team expertise in Solidity, network stability concerns

5. **Arbitrum/Optimism (Ethereum L2s)**
   - Pros: Ethereum security, lower fees
   - Cons: Still more expensive than Polygon, more complex architecture
   - Why rejected: Polygon sufficient for PoC, can migrate later if needed

## References

- Polygon documentation: https://docs.polygon.technology/
- Ethereum gas tracker: https://etherscan.io/gastracker
- Polygon institutional partnerships: https://polygon.technology/partnerships
- SEC CASP guidelines for blockchain selection
- Jagi Properties technical requirements document
