# 004. Compliance Architecture (KYC & Foreign Ownership)

Date: 2026-04-05

## Status

Accepted

## Context

Philippine regulatory requirements mandate compliance for real estate tokenization:

1. **SEC CASP Requirements**: KYC/AML verification for all token holders
2. **Philippine Constitution**: Foreign land ownership restrictions
   - Condominiums: Maximum 40% foreign ownership per project
   - Land: Foreigners cannot own (must be via 60% Filipino-owned corporation)
3. **AMLC Reporting**: Suspicious transaction monitoring required

Must balance regulatory compliance with user privacy and decentralization principles.

## Decision

**Hybrid on-chain + off-chain compliance system.**

### Architecture

```
Off-Chain (Backend + Database)
├── KYC document storage (encrypted)
├── Third-party verification (Onfido/Jumio)
├── Identity verification workflow
└── PII data storage (never on-chain)

On-Chain (Smart Contracts)
├── KYC status flag (verified: true/false)
├── Nationality string (non-PII)
├── Foreign ownership percentage calculation
└── Transfer gate (check KYC + foreign cap)
```

### Implementation

1. **KYC Verification Flow**:
   - User submits KYC documents to backend (passport, government ID)
   - Third-party service (Onfido/Jumio) verifies identity
   - Backend calls `registry.setKYCStatus(address, true, "Filipino")`
   - Only verification status + nationality stored on-chain

2. **Foreign Ownership Enforcement**:
   - Registry contract tracks foreign ownership per property
   - `canTransfer(nftContract, from, to)` checks:
     - Buyer KYC status
     - Nationality of buyer
     - Current foreign ownership percentage
     - Would adding this buyer exceed 40% cap?
   - Marketplace calls `canTransfer()` before allowing purchase

3. **Redemption Eligibility**:
   - Physical property redemption requires additional verification
   - Filipino citizens: Eligible
   - Corporations: Must be 60% Filipino-owned (verify via SEC registration)
   - Foreigners: Not eligible for land, eligible for condos up to 40%

### State Variables

```solidity
struct PropertyInfo {
    string propertyId;
    uint256 maxSupply;
    uint256 foreignTokenCount;
    bool registered;
}

struct UserKYC {
    bool verified;
    string nationality;
    uint256 verifiedAt;
}

mapping(address => PropertyInfo) public properties;
mapping(address => UserKYC) public kycData;
mapping(address => mapping(address => bool)) public foreignOwners;
uint256 public foreignOwnershipCap; // 40% for condos
```

## Consequences

### Positive Consequences
- Regulatory compliant (SEC CASP, AMLC requirements met)
- Enforceable at contract level (cannot bypass)
- PII kept off-chain (privacy preserved)
- Transparent foreign ownership tracking
- Audit trail for all compliance decisions

### Negative Consequences
- Centralization point (backend holds KYC data)
- Oracle trust assumption (must trust KYC provider)
- Backend becomes single point of failure for KYC
- User must trust platform with sensitive documents
- Regulatory risk if backend compromised

## Alternatives Considered

1. **Fully On-Chain KYC**
   - Pros: Decentralized, transparent
   - Cons: PII on public blockchain (illegal under Data Privacy Act), no privacy
   - Why rejected: Illegal under Philippine Data Privacy Act of 2012

2. **Fully Off-Chain Compliance**
   - Pros: Privacy preserved, simpler smart contracts
   - Cons: Not enforceable (can bypass via direct contract interaction)
   - Why rejected: Regulatory risk, no guarantee of compliance

3. **Zero-Knowledge Proofs (ZK-KYC)**
   - Pros: Privacy-preserving, cryptographically verifiable
   - Cons: Too complex for PoC, emerging technology, limited tooling
   - Why deferred: Phase 3 consideration (Semaphore, zkSync)

4. **Soulbound Tokens (SBT) for KYC**
   - Pros: Non-transferable, on-chain verification
   - Cons: Still exposes wallet identity, privacy concerns
   - Why deferred: Can add in Phase 2 with ZK proofs

5. **Decentralized Identity (DID)**
   - Pros: User-controlled identity, portable
   - Cons: Not mature enough, limited adoption, complex UX
   - Why deferred: Phase 3 consideration (Ceramic, SpruceID)

## Security Considerations

- KYC data encrypted at rest (AES-256)
- Database access restricted to KYC provider role
- Regular security audits of backend
- Incident response plan for data breaches
- Compliance with Philippine Data Privacy Act
- Right to deletion (user can request KYC data removal)

## Regulatory References

- Philippine SEC Circular on Crowdfunding Exemptions
- SEC Memorandum on CASP (Crypto Asset Service Providers)
- Philippine Data Privacy Act of 2012 (RA 10173)
- AMLC regulations for virtual asset service providers
- Condominium Act (RA 4726) - 40% foreign ownership limit
- Anti-Dummy Law (CA 108) - foreign ownership restrictions
