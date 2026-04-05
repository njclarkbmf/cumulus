# Data Flow Diagrams

## 1. User Registration + KYC Flow

```
┌─────────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│  User   │          │ Frontend │          │ Backend  │          │ Registry │
│         │          │          │          │          │          │ Contract │
└────┬────┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
     │                    │                     │                     │
     │ 1. Connect Wallet  │                     │                     │
     ├───────────────────►│                     │                     │
     │                    │                     │                     │
     │ 2. Submit KYC Info │                     │                     │
     │    (Name, ID, etc) │                     │                     │
     ├───────────────────►│                     │                     │
     │                    │ 3. POST /api/users/kyc                    │
     │                    ├────────────────────►│                     │
     │                    │                     │                     │
     │                    │                     │ 4. Store in DB      │
     │                    │                     │    (encrypted)      │
     │                    │                     │                     │
     │                    │                     │ 5. Send to KYC      │
     │                    │                     │    Provider API     │
     │                    │                     │    (Onfido/Jumio)   │
     │                    │                     │                     │
     │                    │                     │ 6. KYC Verified     │
     │                    │                     │◄────────────────────│
     │                    │                     │                     │
     │                    │                     │ 7. setKYCStatus()   │
     │                    │                     ├────────────────────►│
     │                    │                     │                     │
     │                    │                     │                     │ 8. Update
     │                    │                     │                     │    kycData
     │                    │                     │                     │
     │                    │ 9. KYC Status       │                     │
     │                    │    Updated Event    │                     │
     │                    │◄────────────────────┤                     │
     │                    │                     │                     │
     │ 10. KYC Complete   │                     │                     │
     │     Notification   │                     │                     │
     │◄───────────────────┤                     │                     │
     │                    │                     │                     │
```

## 2. Property Tokenization Flow

```
┌─────────┐          ┌──────────┐          ┌──────────────┐          ┌──────────┐
│  Admin  │          │ Frontend │          │ PropertyNFT  │          │ Registry │
└────┬────┘          └────┬─────┘          └──────┬───────┘          └────┬─────┘
     │                    │                       │                       │
     │ 1. Create Property │                       │                       │
     │    (Details,Images)│                       │                       │
     ├───────────────────►│                       │                       │
     │                    │                       │                       │
     │                    │ 2. Upload to IPFS     │                       │
     │                    │    (Pinata)            │                       │
     │                    ├───────────────────────┼───────────────────────┤
     │                    │                       │                       │
     │                    │ 3. Get IPFS URI       │                       │
     │                    │◄──────────────────────┼───────────────────────┤
     │                    │                       │                       │
     │ 4. Deploy          │                       │                       │
     │    PropertyNFT     │                       │                       │
     │    Contract        │                       │                       │
     ├───────────────────►│                       │                       │
     │                    │ 5. Deploy Contract    │                       │
     │                    ├──────────────────────►│                       │
     │                    │                       │                       │
     │                    │ 6. Register Property  │                       │
     │                    ├───────────────────────┼──────────────────────►│
     │                    │                       │                       │
     │                    │                       │                       │ 7. Store
     │                    │                       │                       │    Property
     │                    │                       │                       │    Info
     │                    │                       │                       │
     │ 8. Mint Tokens     │                       │                       │
     │    (e.g., 100)     │                       │                       │
     ├───────────────────►│                       │                       │
     │                    │ 9. mint() x100        │                       │
     │                    ├──────────────────────►│                       │
     │                    │                       │                       │
     │                    │                       │ 10. Initialize        │
     │                    │                       │     maintenance       │
     │                    │                       │     tracking          │
     │                    │                       │                       │
     │ 11. Tokens Ready   │                       │                       │
     │     for Sale       │                       │                       │
     │◄───────────────────┤                       │                       │
     │                    │                       │                       │
```

## 3. Token Listing Flow

```
┌─────────┐          ┌──────────┐          ┌──────────────┐          ┌──────────┐
│  Seller │          │ Frontend │          │  Marketplace │          │ PropertyNFT│
│         │          │          │          │  Contract    │          │  Contract │
└────┬────┘          └────┬─────┘          └──────┬───────┘          └────┬─────┘
     │                    │                       │                       │
     │ 1. Select Token    │                       │                       │
     │    "List for Sale" │                       │                       │
     ├───────────────────►│                       │                       │
     │                    │                       │                       │
     │ 2. Set Price       │                       │                       │
     │    (₱520,000)      │                       │                       │
     ├───────────────────►│                       │                       │
     │                    │                       │                       │
     │ 3. Approve         │                       │                       │
     │    Marketplace     │                       │                       │
     ├───────────────────►│ 4. setApprovalForAll()│                       │
     │                    ├───────────────────────┼──────────────────────►│
     │                    │                       │                       │
     │                    │ 5. Approve Confirmed  │                       │
     │                    │◄──────────────────────┼───────────────────────┤
     │                    │                       │                       │
     │ 6. List Token      │                       │                       │
     ├───────────────────►│                       │                       │
     │                    │ 7. listToken(id,price)│                       │
     │                    ├──────────────────────►│                       │
     │                    │                       │                       │
     │                    │                       │ 8. Transfer NFT       │
     │                    │                       │    to Marketplace     │
     │                    │                       ├──────────────────────►│
     │                    │                       │                       │
     │                    │                       │ 9. Transfer Confirmed │
     │                    │                       │◄──────────────────────┤
     │                    │                       │                       │
     │                    │ 10. Listing Created   │                       │
     │                    │     Event             │                       │
     │                    │◄──────────────────────┤                       │
     │                    │                       │                       │
     │ 11. Listed         │                       │                       │
     │     Successfully   │                       │                       │
     │◄───────────────────┤                       │                       │
     │                    │                       │                       │
```

## 4. Token Purchase Flow

```
┌─────────┐          ┌──────────┐          ┌──────────────┐          ┌─────────────┐
│  Buyer  │          │ Frontend │          │  Marketplace │          │  Registry   │
│         │          │          │          │  Contract    │          │  Contract   │
└────┬────┘          └────┬─────┘          └──────┬───────┘          └─────┬───────┘
     │                    │                       │                       │
     │ 1. Browse          │                       │                       │
     │    Marketplace     │                       │                       │
     ├───────────────────►│                       │                       │
     │                    │                       │                       │
     │ 2. Select Token    │                       │                       │
     │    "Buy Now"       │                       │                       │
     ├───────────────────►│                       │                       │
     │                    │                       │                       │
     │                    │ 3. Check              │                       │
     │                    │    Compliance         │                       │
     │                    ├──────────────────────►│                       │
     │                    │                       │                       │
     │                    │                       │ 4. canTransfer()      │
     │                    │                       ├──────────────────────►│
     │                    │                       │                       │
     │                    │                       │ 5. Check KYC +        │
     │                    │                       │    Foreign Cap        │
     │                    │                       │◄──────────────────────┤
     │                    │                       │                       │
     │                    │                       │ 6. Allowed            │
     │                    │                       │◄──────────────────────┤
     │                    │                       │                       │
     │ 4. Show Breakdown  │                       │                       │
     │    Price: ₱520K    │                       │                       │
     │    Royalty: ₱13K   │                       │                       │
     │    Seller: ₱507K   │                       │                       │
     │◄───────────────────┤                       │                       │
     │                    │                       │                       │
     │ 5. Confirm         │                       │                       │
     │    Purchase        │                       │                       │
     ├───────────────────►│                       │                       │
     │                    │ 6. buyToken()         │                       │
     │                    │    + ₱520K MATIC      │                       │
     │                    ├──────────────────────►│                       │
     │                    │                       │                       │
     │                    │                       │ 7. Calculate          │
     │                    │                       │    Royalty (2.5%)     │
     │                    │                       │                       │
     │                    │                       │ 8. Send Royalty       │
     │                    │                       │    to Royalty Treasury   │
     │                    │                       │                       │
     │                    │                       │ 9. Send Remainder     │
     │                    │                       │    to Seller          │
     │                    │                       │                       │
     │                    │                       │ 10. Transfer NFT      │
     │                    │                       │     to Buyer          │
     │                    │                       │                       │
     │                    │ 11. TokenSold Event   │                       │
     │                    │◄──────────────────────┤                       │
     │                    │                       │                       │
     │ 12. Purchase       │                       │                       │
     │     Complete       │                       │                       │
     │◄───────────────────┤                       │                       │
     │                    │                       │                       │
```

## 5. Maintenance Payment Flow

```
┌─────────────┐      ┌──────────┐      ┌──────────────┐      ┌─────────────┐
│ Token Holder│      │ Frontend │      │ PropertyNFT  │      │  Backend    │
│             │      │          │      │  Contract    │      │  Indexer    │
└──────┬──────┘      └────┬─────┘      └──────┬───────┘      └──────┬──────┘
       │                  │                   │                     │
       │ 1. View Dashboard│                   │                     │
       │    "Maintenance  │                   │                     │
       │     Due: ₱500"   │                   │                     │
       ├─────────────────►│                   │                     │
       │                  │                   │                     │
       │ 2. Click         │                   │                     │
       │    "Pay Now"     │                   │                     │
       ├─────────────────►│                   │                     │
       │                  │                   │                     │
       │ 3. Confirm       │                   │                     │
       │    Payment       │                   │                     │
       ├─────────────────►│                   │                     │
       │                  │ 4. payMaintenance()│                     │
       │                  │    + ₱500 MATIC    │                     │
       │                  ├──────────────────►│                     │
       │                  │                   │                     │
       │                  │                   │ 5. Update            │
       │                  │                   │    lastMaintenance   │
       │                  │                   │    Paid timestamp    │
       │                  │                   │                     │
       │                  │                   │ 6. Transfer to       │
       │                  │                   │    Property Treasury │
       │                  │                   │                     │
       │                  │                   │ 7. Emit              │
       │                  │                   │    MaintenancePaid   │
       │                  │                   │    Event             │
       │                  │                   │                     │
       │                  │ 8. Success         │                     │
       │                  │    Receipt         │                     │
       │                  │◄──────────────────┤                     │
       │                  │                   │                     │
       │                  │                   │                     │ 9. Catch Event
       │                  │                   │                     ├─────────────┐
       │                  │                   │                     │             │
       │                  │                   │                     │ 10. Update  │
       │                  │                   │                     │     DB      │
       │                  │                   │                     │             │
       │ 9. Payment       │                   │                     │             │
       │    Confirmed     │                   │                     │             │
       │    "Paid until   │                   │                     │             │
       │     May 5, 2026" │                   │                     │             │
       │◄─────────────────┤                   │                     │             │
       │                  │                   │                     │             │
```

## 6. Proposal Creation + Voting Flow

```
┌─────────┐      ┌──────────┐      ┌────────────┐      ┌──────────┐
│  Admin  │      │ Frontend │      │  Backend   │      │ On-Chain │
│         │      │          │      │            │      │ (Phase 2)│
└────┬────┘      └────┬─────┘      └─────┬──────┘      └────┬─────┘
     │                │                  │                  │
     │ 1. Create      │                  │                  │
     │    Proposal    │                  │                  │
     │    (Title,     │                  │                  │
     │     Desc,Cost) │                  │                  │
     ├───────────────►│                  │                  │
     │                │                  │                  │
     │                │ 2. POST          │                  │
     │                │    /api/proposals│                  │
     │                ├─────────────────►│                  │
     │                │                  │                  │
     │                │                  │ 3. Store in DB   │
     │                │                  │                  │
     │ 4. Proposal    │                  │                  │
     │    Created     │                  │                  │
     │◄───────────────┤                  │                  │
     │                │                  │                  │
     │                │                  │                  │
     │                │ 5. Proposal      │                  │
     │                │    Visible to    │                  │
     │                │    Token Holders │                  │
     │                │                  │                  │
     │                │◄─────────────────┤                  │
     │                │                  │                  │
     │                │                  │                  │
     │                │ 6. Vote (For/Against)               │
     │◄───────────────┤                  │                  │
     │                │                  │                  │
     │ 7. Cast Vote   │                  │                  │
     ├───────────────►│                  │                  │
     │                │ 8. POST          │                  │
     │                │    /api/         │                  │
     │                │    proposals/:id │                  │
     │                │    /vote         │                  │
     │                ├─────────────────►│                  │
     │                │                  │                  │
     │                │                  │ 9. Verify        │
     │                │                  │    Token Holdings│
     │                │                  │    (On-Chain)    │
     │                │                  ├─────────────────►│
     │                │                  │                  │
     │                │                  │ 10. Get Vote     │
     │                │                  │    Weight         │
     │                │                  │◄─────────────────┤
     │                │                  │                  │
     │                │                  │ 11. Record Vote  │
     │                │                  │     in DB         │
     │                │                  │                  │
     │                │ 12. Vote         │                  │
     │                │     Confirmed    │                  │
     │                │◄─────────────────┤                  │
     │                │                  │                  │
     │ 13. Vote       │                  │                  │
     │     Successful │                  │                  │
     │◄───────────────┤                  │                  │
     │                │                  │                  │
```

## 7. Token Redemption Flow (Future)

```
┌─────────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Token Holder│      │ Frontend │      │ Backend  │      │ Registry │
│             │      │          │      │          │      │ Contract │
└──────┬──────┘      └────┬─────┘      └─────┬────┘      └────┬─────┘
       │                  │                 │                  │
       │ 1. Request       │                 │                  │
       │    Redemption    │                 │                  │
       ├─────────────────►│                 │                  │
       │                  │                 │                  │
       │                  │ 2. Check        │                  │
       │                  │    Eligibility  │                  │
       │                  ├────────────────►│                  │
       │                  │                 │                  │
       │                  │                 │ 3. isEligibleFor │
       │                  │                 │    Redemption()  │
       │                  │                 ├─────────────────►│
       │                  │                 │                  │
       │                  │                 │ 4. Check:        │
       │                  │                 │    - Filipino?   │
       │                  │                 │    - Or 60% PH   │
       │                  │                 │      Corp?       │
       │                  │                 │◄─────────────────┤
       │                  │                 │                  │
       │                  │ 5. Eligible     │                  │
       │                  │◄────────────────┤                  │
       │                  │                 │                  │
       │ 3. Eligible -    │                 │                  │
       │    Submit Docs   │                 │                  │
       ├─────────────────►│                 │                  │
       │                  │ 4. Upload to    │                  │
       │                  │    IPFS +      │                  │
       │                  │    Legal Team  │                  │
       │                  │                 │                  │
       │ 5. Review        │                 │                  │
       │    Period (7d)   │                 │                  │
       │◄─────────────────┤                 │                  │
       │                  │                 │                  │
       │ 6. Redemption    │                 │                  │
       │    Complete -    │                 │                  │
       │    Tokens Burned │                 │                  │
       │    Physical Deed │                 │                  │
       │    Transferred   │                 │                  │
       │◄─────────────────┤                 │                  │
       │                  │                 │                  │
```

## Event Indexing

All major state changes emit events that are indexed by the backend:

- `PropertyRegistered` → Update properties table
- `TokenListed` → Insert into listings table
- `TokenSold` → Update listings, transfer ownership
- `MaintenancePaid` → Insert into maintenance_payments
- `KYCStatusUpdated` → Update users table
- `ProposalCreated` (Phase 2) → Insert into proposals
- `VoteCast` (Phase 2) → Insert into votes

Backend indexer listens to blockchain events and updates PostgreSQL accordingly.
