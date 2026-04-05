# Cumulus Live Demo Script

## Pre-Demo Setup (10 minutes before)

### 1. Prepare Demo Environment
```bash
# Ensure contracts are deployed on Mumbai testnet
npm run deploy:mumbai

# Start frontend
cd frontend && npm run dev

# Start backend
cd ../backend && npm run dev
```

### 2. Prepare Demo Wallets
- **Wallet 1 (Admin)**: Deployer wallet with MATIC
- **Wallet 2 (Seller)**: Pre-minted tokens, KYC verified (Filipino)
- **Wallet 3 (Buyer)**: Empty wallet, KYC verified (Filipino)
- **Wallet 4 (Foreign Buyer)**: Empty wallet, KYC verified (American)

Pre-fund wallets with Mumbai MATIC from faucet: https://mumbaifaucet.com/

### 3. Pre-Mint Tokens
```javascript
// In Hardhat console or script
await propertyNFT.mint(seller.address, 1, "ipfs://QmProperty1");
await propertyNFT.mint(seller.address, 2, "ipfs://QmProperty2");
```

---

## Demo Flow (5-7 minutes)

### Step 1: Introduction (30 seconds)

**Say:**
> "Cumulus is a blockchain-based platform that allows fractional ownership of Philippine real estate. Let me show you how it works."

**Show:**
- Landing page at http://localhost:3000
- Highlight key statistics (properties, token holders)

---

### Step 2: Connect Wallet (30 seconds)

**Action:**
- Click "Connect Wallet" in header
- Select MetaMask
- Switch to Polygon Mumbai network

**Say:**
> "Users connect their Web3 wallet. We support MetaMask, Coinbase Wallet, and WalletConnect."

---

### Step 3: Browse Properties (1 minute)

**Action:**
- Navigate to /properties
- Show property cards with images, prices, availability
- Click on "Cumulus Makati Condo A"

**Say:**
> "Here you can browse available properties. Each property is divided into tokens - in this case, 100 tokens at ₱500,000 each. This represents a ₱50M property."

**Show:**
- Property details page
- Token economics section
- Amenities list

---

### Step 4: Buy Token with Royalty (1.5 minutes)

**Action:**
- Switch to Buyer wallet (Wallet 3)
- Click "Buy Token" on a marketplace listing
- Show buy modal with breakdown

**Say:**
> "When you buy a token, the royalty is automatically deducted. Here you can see: Purchase price is ₱500,000, 2.5% royalty (₱12,500) goes to the platform operator, and the seller receives ₱487,500. This happens automatically - it cannot be bypassed."

**Action:**
- Confirm transaction
- Show transaction pending
- Show success message with Polygonscan link

**Say:**
> "The transaction is recorded on the Polygon blockchain. You can view it here on Polygonscan."

---

### Step 5: Pay Maintenance Fee (1 minute)

**Action:**
- Go to /dashboard
- Show maintenance status: "Current" or "Due Soon"
- Click "Pay Now"
- Show payment modal

**Say:**
> "Token holders must pay monthly maintenance fees - similar to HOA dues. This is ₱500/month per token. Let me pay it now."

**Action:**
- Confirm payment
- Show success
- Show updated status: "Paid until [date]"

**Say:**
> "Once paid, the token is unlocked for transfers. If you don't pay, you cannot sell or transfer the token."

---

### Step 6: Show Transfer Restriction (1 minute)

**Action:**
- Switch to Seller wallet (Wallet 2) with token that has overdue maintenance
- Try to list token for sale OR transfer it

**Say:**
> "Now let me show what happens when maintenance is unpaid. This token is overdue on maintenance. Let me try to transfer it."

**Action:**
- Attempt transfer/listing
- Show error message: "Maintenance overdue - bayad muna (pay maintenance fee to enable transfers)"

**Say:**
> "The transaction fails with a clear message in Filipino and English. This ensures token holders stay current on their obligations."

**Action:**
- Pay maintenance
- Retry transfer - now it works

---

### Step 7: Governance Voting (30 seconds)

**Action:**
- Navigate to /governance
- Show active proposal: "Install New Security Cameras"
- Show voting progress

**Say:**
> "Token holders can vote on property improvements. This proposal to install security cameras has 45 votes for and 5 against. Your voting power is weighted by the number of tokens you hold."

---

### Step 8: Compliance Demo (30 seconds)

**Action:**
- Try to buy token with non-KYC wallet (if prepared)

**Say:**
> "Before anyone can buy or sell, they must complete KYC verification. This is required by Philippine SEC regulations. Foreign ownership is also capped at 40% for condominiums per the Philippine Constitution."

---

## Key Talking Points

### For Investors (Property Developers)
- **Revenue Model**: 2.5% royalty on ALL secondary sales (enforced, not optional)
- **Market Opportunity**: Philippine real estate market worth ₱1.5T+
- **Competitive Advantage**: First platform with enforced royalties + maintenance fees

### For Institutions (SEC, PDAX)
- **Compliance First**: KYC gates, foreign ownership caps, audit trails
- **Transparency**: All transactions on public blockchain
- **Security**: OpenZeppelin contracts, auditable, pausable

### For Users
- **Accessibility**: Start investing with ₱50,000 instead of ₱5M+
- **Liquidity**: Sell tokens anytime (vs waiting months for property sale)
- **Transparency**: See all fees, valuations, and transaction history

---

## Troubleshooting

### Transaction Fails
- Check wallet has enough MATIC for gas
- Verify network is Polygon Mumbai
- Check maintenance status before transfers

### Wallet Won't Connect
- Ensure MetaMask is installed
- Check if user is on correct network
- Try refreshing page

### Slow Transactions
- Mumbai testnet can be slow during peak hours
- Show Polygonscan link to prove transaction is processing

---

## Post-Demo

### Next Steps to Share
1. **Phase 2**: Chainlink Automation, meta-transactions, mobile app
2. **Production**: Deploy to Polygon Mainnet, audit contracts
3. **Scale**: Onboard 10+ properties, integrate with PDAX

### Q&A Preparation
- **Q: Can royalties be bypassed?**
  - A: No, they're enforced at the smart contract level. All sales must go through our marketplace.

- **Q: What if user doesn't pay maintenance?**
  - A: Token cannot be transferred until paid. We also send email/SMS reminders.

- **Q: Is this legal in the Philippines?**
  - A: We comply with SEC CASP regulations, Philippine Data Privacy Act, and Condominium Act.

- **Q: How do you verify nationality?**
  - A: Third-party KYC provider (Onfido/Jumio) verifies government IDs. Only status is stored on-chain.

---

## Success Metrics to Highlight

- ✅ Connect wallet to Polygon Mumbai
- ✅ Browse properties with images and details
- ✅ Mint property tokens (admin function)
- ✅ List token for sale at custom price
- ✅ Buy token - show royalty deduction automatically
- ✅ Pay maintenance fee - ₱500 transaction
- ✅ Attempt to transfer token with unpaid maintenance - transaction fails with clear error
- ✅ Pay maintenance, then successfully transfer
- ✅ View portfolio with all owned tokens
- ✅ See maintenance status for each token
- ✅ Basic governance: Create proposal, cast vote

**All 11 success criteria met! 🎉**
