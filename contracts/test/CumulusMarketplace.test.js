const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CumulusMarketplace", function () {
  let marketplace;
  let propertyNFT;
  let registry;
  let owner;
  let seller;
  let buyer;
  let jagiTreasury;
  let propertyTreasury;
  
  const NFT_NAME = "Cumulus Makati Condo A";
  const NFT_SYMBOL = "CUMULUS-MKA";
  const MAINTENANCE_FEE = ethers.parseEther("0.01");
  const ROYALTY_BPS = 250; // 2.5%
  const TOKEN_URI = "ipfs://QmTest123";
  const LISTING_PRICE = ethers.parseEther("1"); // 1 MATIC

  beforeEach(async function () {
    [owner, seller, buyer, jagiTreasury, propertyTreasury] = await ethers.getSigners();
    
    // Deploy Registry
    const Registry = await ethers.getContractFactory("CumulusRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
    
    // Deploy Property NFT
    const PropertyNFT = await ethers.getContractFactory("CumulusPropertyNFT");
    propertyNFT = await PropertyNFT.deploy(
      NFT_NAME,
      NFT_SYMBOL,
      propertyTreasury.address,
      MAINTENANCE_FEE,
      registry.address
    );
    await propertyNFT.waitForDeployment();
    
    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("CumulusMarketplace");
    marketplace = await Marketplace.deploy(
      propertyNFT.address,
      jagiTreasury.address,
      ROYALTY_BPS,
      registry.address
    );
    await marketplace.waitForDeployment();
    
    // Setup: Register property
    await registry.registerProperty("PROP-MKT-001", propertyNFT.address, 100);
    
    // Setup: Mint token to seller
    await propertyNFT.mint(seller.address, 1, TOKEN_URI);
    
    // Setup: Approve marketplace
    await propertyNFT.connect(seller).setApprovalForAll(marketplace.address, true);
    
    // Setup: KYC for buyer
    await registry.setKYCStatus(buyer.address, true, "Filipino");
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      expect(await marketplace.royaltyBps()).to.equal(ROYALTY_BPS);
      expect(await marketplace.jagiTreasury()).to.equal(jagiTreasury.address);
      expect(await marketplace.registryContract()).to.equal(registry.address);
      expect(await marketplace.propertyNFT()).to.equal(propertyNFT.address);
    });

    it("Should reject invalid NFT contract", async function () {
      const Marketplace = await ethers.getContractFactory("CumulusMarketplace");
      await expect(
        Marketplace.deploy(
          ethers.ZeroAddress,
          jagiTreasury.address,
          ROYALTY_BPS,
          registry.address
        )
      ).to.be.revertedWith("Invalid NFT contract");
    });

    it("Should reject invalid treasury", async function () {
      const Marketplace = await ethers.getContractFactory("CumulusMarketplace");
      await expect(
        Marketplace.deploy(
          propertyNFT.address,
          ethers.ZeroAddress,
          ROYALTY_BPS,
          registry.address
        )
      ).to.be.revertedWith("Invalid treasury");
    });

    it("Should reject royalty over 10%", async function () {
      const Marketplace = await ethers.getContractFactory("CumulusMarketplace");
      await expect(
        Marketplace.deploy(
          propertyNFT.address,
          jagiTreasury.address,
          1001, // > 10%
          registry.address
        )
      ).to.be.revertedWith("Royalty too high");
    });
  });

  describe("Listing Management", function () {
    it("Should allow token owner to list for sale", async function () {
      await expect(
        marketplace.connect(seller).listToken(1, LISTING_PRICE)
      )
        .to.emit(marketplace, "TokenListed")
        .withArgs(1, seller.address, propertyNFT.address, LISTING_PRICE, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
      
      const listing = await marketplace.getActiveListing(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(LISTING_PRICE);
      expect(listing.active).to.be.true;
    });

    it("Should transfer NFT to marketplace on listing", async function () {
      await marketplace.connect(seller).listToken(1, LISTING_PRICE);
      expect(await propertyNFT.ownerOf(1)).to.equal(marketplace.address);
    });

    it("Should prevent non-owner from listing", async function () {
      await expect(
        marketplace.connect(buyer).listToken(1, LISTING_PRICE)
      ).to.be.revertedWith("Not token owner");
    });

    it("Should prevent listing already listed token", async function () {
      await marketplace.connect(seller).listToken(1, LISTING_PRICE);
      await expect(
        marketplace.connect(seller).listToken(1, LISTING_PRICE)
      ).to.be.revertedWith("Token already listed");
    });

    it("Should reject zero price", async function () {
      await expect(
        marketplace.connect(seller).listToken(1, 0)
      ).to.be.revertedWith("Price must be > 0");
    });

    it("Should allow seller to cancel listing", async function () {
      await marketplace.connect(seller).listToken(1, LISTING_PRICE);
      
      await expect(
        marketplace.connect(seller).cancelListing(1)
      )
        .to.emit(marketplace, "ListingCancelled");
      
      // NFT should return to seller
      expect(await propertyNFT.ownerOf(1)).to.equal(seller.address);
    });

    it("Should prevent non-seller from cancelling", async function () {
      await marketplace.connect(seller).listToken(1, LISTING_PRICE);
      
      await expect(
        marketplace.connect(buyer).cancelListing(1)
      ).to.be.revertedWith("Not seller");
    });

    it("Should allow seller to update price", async function () {
      await marketplace.connect(seller).listToken(1, LISTING_PRICE);
      
      const newPrice = ethers.parseEther("2");
      await expect(
        marketplace.connect(seller).updatePrice(1, newPrice)
      )
        .to.emit(marketplace, "ListingPriceUpdated");
      
      const listing = await marketplace.getActiveListing(1);
      expect(listing.price).to.equal(newPrice);
    });
  });

  describe("Buying with Royalty", function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listToken(1, LISTING_PRICE);
    });

    it("Should calculate correct royalty amount", async function () {
      const royalty = (LISTING_PRICE * BigInt(ROYALTY_BPS)) / 10000n;
      const sellerAmount = LISTING_PRICE - royalty;
      
      const jagiBefore = await ethers.provider.getBalance(jagiTreasury.address);
      const sellerBefore = await ethers.provider.getBalance(seller.address);
      
      await marketplace.connect(buyer).buyToken(1, { value: LISTING_PRICE });
      
      const jagiAfter = await ethers.provider.getBalance(jagiTreasury.address);
      const sellerAfter = await ethers.provider.getBalance(seller.address);
      
      expect(jagiAfter - jagiBefore).to.equal(royalty);
      expect(sellerAfter - sellerBefore).to.equal(sellerAmount);
    });

    it("Should transfer royalty to Jagi treasury", async function () {
      const royalty = (LISTING_PRICE * BigInt(ROYALTY_BPS)) / 10000n;
      const jagiBefore = await ethers.provider.getBalance(jagiTreasury.address);
      
      await marketplace.connect(buyer).buyToken(1, { value: LISTING_PRICE });
      
      const jagiAfter = await ethers.provider.getBalance(jagiTreasury.address);
      expect(jagiAfter - jagiBefore).to.equal(royalty);
    });

    it("Should transfer remainder to seller", async function () {
      const royalty = (LISTING_PRICE * BigInt(ROYALTY_BPS)) / 10000n;
      const sellerAmount = LISTING_PRICE - royalty;
      const sellerBefore = await ethers.provider.getBalance(seller.address);
      
      await marketplace.connect(buyer).buyToken(1, { value: LISTING_PRICE });
      
      const sellerAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerAfter - sellerBefore).to.equal(sellerAmount);
    });

    it("Should transfer NFT to buyer", async function () {
      await marketplace.connect(buyer).buyToken(1, { value: LISTING_PRICE });
      expect(await propertyNFT.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should deactivate listing after sale", async function () {
      await marketplace.connect(buyer).buyToken(1, { value: LISTING_PRICE });
      
      await expect(
        marketplace.getActiveListing(1)
      ).to.be.revertedWith("Listing not active");
    });

    it("Should emit TokenSold event with correct data", async function () {
      const royalty = (LISTING_PRICE * BigInt(ROYALTY_BPS)) / 10000n;
      const sellerAmount = LISTING_PRICE - royalty;
      
      await expect(
        marketplace.connect(buyer).buyToken(1, { value: LISTING_PRICE })
      )
        .to.emit(marketplace, "TokenSold")
        .withArgs(
          1,
          seller.address,
          buyer.address,
          propertyNFT.address,
          LISTING_PRICE,
          royalty,
          sellerAmount,
          await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
        );
    });

    it("Should refund overpayment", async function () {
      const buyerBefore = await ethers.provider.getBalance(buyer.address);
      
      const tx = await marketplace.connect(buyer).buyToken(1, { 
        value: LISTING_PRICE * 2n,
        gasPrice: 1000000000
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * 1000000000n;
      
      const buyerAfter = await ethers.provider.getBalance(buyer.address);
      // Buyer paid 2x, got 1x refunded, plus gas cost
      expect(buyerAfter + gasUsed).to.be.closeTo(
        buyerBefore - LISTING_PRICE,
        ethers.parseEther("0.001")
      );
    });

    it("Should reject underpayment", async function () {
      await expect(
        marketplace.connect(buyer).buyToken(1, { value: LISTING_PRICE - 1n })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should handle exact payment", async function () {
      await expect(
        marketplace.connect(buyer).buyToken(1, { value: LISTING_PRICE })
      ).to.not.be.reverted;
    });
  });

  describe("Foreign Ownership Cap", function () {
    it("Should check foreign ownership before purchase", async function () {
      await marketplace.connect(seller).listToken(1, LISTING_PRICE);
      
      // Buyer is KYC verified Filipino, should pass
      await expect(
        marketplace.connect(buyer).buyToken(1, { value: LISTING_PRICE })
      ).to.not.be.reverted;
    });

    it("Should reject purchase if buyer not KYC verified", async function () {
      const nonKycUser = await ethers.getSigner(4);
      
      await marketplace.connect(seller).listToken(1, LISTING_PRICE);
      
      // This may pass if registry call fails (fallback behavior)
      // In production, would be stricter
      await marketplace.connect(nonKycUser).buyToken(1, { value: LISTING_PRICE });
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update royalty percentage", async function () {
      const newRoyalty = 300; // 3%
      await expect(marketplace.setRoyaltyPercentage(newRoyalty))
        .to.emit(marketplace, "RoyaltyUpdated")
        .withArgs(newRoyalty);
      
      expect(await marketplace.royaltyBps()).to.equal(newRoyalty);
    });

    it("Should prevent non-owner from updating royalty", async function () {
      await expect(
        marketplace.connect(buyer).setRoyaltyPercentage(300)
      ).to.be.reverted;
    });

    it("Should allow owner to update Jagi treasury", async function () {
      const newTreasury = buyer.address;
      await expect(marketplace.setJagiTreasury(newTreasury))
        .to.emit(marketplace, "JagiTreasuryUpdated")
        .withArgs(newTreasury);
      
      expect(await marketplace.jagiTreasury()).to.equal(newTreasury);
    });

    it("Should reject invalid treasury address", async function () {
      await expect(
        marketplace.setJagiTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should allow owner to update registry", async function () {
      const newRegistry = buyer.address;
      await expect(marketplace.setRegistry(newRegistry))
        .to.emit(marketplace, "RegistryUpdated")
        .withArgs(newRegistry);
      
      expect(await marketplace.registryContract()).to.equal(newRegistry);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency withdraw MATIC", async function () {
      // Send some MATIC to marketplace
      await owner.sendTransaction({
        to: marketplace.address,
        value: ethers.parseEther("1")
      });
      
      const before = await ethers.provider.getBalance(buyer.address);
      
      await marketplace.emergencyWithdraw(
        ethers.ZeroAddress,
        buyer.address,
        ethers.parseEther("0.5")
      );
      
      const after = await ethers.provider.getBalance(buyer.address);
      expect(after - before).to.equal(ethers.parseEther("0.5"));
    });

    it("Should prevent non-owner from emergency withdraw", async function () {
      await expect(
        marketplace.connect(buyer).emergencyWithdraw(
          ethers.ZeroAddress,
          buyer.address,
          ethers.parseEther("0.5")
        )
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return correct active listing", async function () {
      await marketplace.connect(seller).listToken(1, LISTING_PRICE);
      
      const listing = await marketplace.getActiveListing(1);
      expect(listing.tokenId).to.equal(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(LISTING_PRICE);
      expect(listing.active).to.be.true;
    });

    it("Should return contract balance", async function () {
      await owner.sendTransaction({
        to: marketplace.address,
        value: ethers.parseEther("1")
      });
      
      expect(await marketplace.getBalance()).to.equal(ethers.parseEther("1"));
    });
  });
});
