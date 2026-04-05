const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CumulusRegistry", function () {
  let registry;
  let owner;
  let kycProvider;
  let user1;
  let user2;
  let foreignUser;
  
  const PROPERTY_ID = "PROP-MKT-001";
  const MOCK_NFT_CONTRACT = "0x1234567890123456789012345678901234567890";
  const MAX_SUPPLY = 100;

  beforeEach(async function () {
    [owner, kycProvider, user1, user2, foreignUser] = await ethers.getSigners();
    
    const Registry = await ethers.getContractFactory("CumulusRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      expect(await registry.foreignOwnershipCap()).to.equal(40);
      expect(await registry.getPropertyCount()).to.equal(0);
    });

    it("Should assign correct roles to deployer", async function () {
      const ADMIN_ROLE = await registry.ADMIN_ROLE();
      const KYC_PROVIDER_ROLE = await registry.KYC_PROVIDER_ROLE();
      const DEFAULT_ADMIN_ROLE = await registry.DEFAULT_ADMIN_ROLE();
      
      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await registry.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await registry.hasRole(KYC_PROVIDER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Property Registration", function () {
    it("Should allow admin to register a property", async function () {
      await expect(
        registry.connect(owner).registerProperty(PROPERTY_ID, MOCK_NFT_CONTRACT, MAX_SUPPLY)
      )
        .to.emit(registry, "PropertyRegistered")
        .withArgs(PROPERTY_ID, MOCK_NFT_CONTRACT, MAX_SUPPLY);
      
      const prop = await registry.properties(MOCK_NFT_CONTRACT);
      expect(prop.propertyId).to.equal(PROPERTY_ID);
      expect(prop.registered).to.be.true;
      expect(prop.maxSupply).to.equal(MAX_SUPPLY);
    });

    it("Should prevent non-admin from registering", async function () {
      await expect(
        registry.connect(user1).registerProperty(PROPERTY_ID, MOCK_NFT_CONTRACT, MAX_SUPPLY)
      ).to.be.reverted;
    });

    it("Should prevent duplicate registration", async function () {
      await registry.registerProperty(PROPERTY_ID, MOCK_NFT_CONTRACT, MAX_SUPPLY);
      
      await expect(
        registry.registerProperty(PROPERTY_ID, MOCK_NFT_CONTRACT, MAX_SUPPLY)
      ).to.be.revertedWith("Property already registered");
    });

    it("Should reject invalid NFT contract address", async function () {
      await expect(
        registry.registerProperty(PROPERTY_ID, ethers.ZeroAddress, MAX_SUPPLY)
      ).to.be.revertedWith("Invalid NFT contract");
    });

    it("Should reject zero max supply", async function () {
      await expect(
        registry.registerProperty(PROPERTY_ID, MOCK_NFT_CONTRACT, 0)
      ).to.be.revertedWith("Max supply must be > 0");
    });

    it("Should update property count", async function () {
      await registry.registerProperty(PROPERTY_ID, MOCK_NFT_CONTRACT, MAX_SUPPLY);
      expect(await registry.getPropertyCount()).to.equal(1);
    });
  });

  describe("Foreign Ownership Cap", function () {
    it("Should allow admin to update foreign ownership cap", async function () {
      await expect(registry.setForeignOwnershipCap(50))
        .to.emit(registry, "ForeignOwnershipCapUpdated")
        .withArgs(50);
      
      expect(await registry.foreignOwnershipCap()).to.equal(50);
    });

    it("Should prevent non-admin from updating cap", async function () {
      await expect(registry.connect(user1).setForeignOwnershipCap(50)).to.be.reverted;
    });

    it("Should reject cap over 100%", async function () {
      await expect(registry.setForeignOwnershipCap(101)).to.be.revertedWith(
        "Cap must be <= 100%"
      );
    });
  });

  describe("KYC Management", function () {
    it("Should allow KYC provider to set verification status", async function () {
      await expect(
        registry.connect(owner).setKYCStatus(user1.address, true, "Filipino")
      )
        .to.emit(registry, "KYCStatusUpdated")
        .withArgs(user1.address, true, "Filipino", await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      const kyc = await registry.kycData(user1.address);
      expect(kyc.verified).to.be.true;
      expect(kyc.nationality).to.equal("Filipino");
    });

    it("Should prevent non-KYC provider from setting status", async function () {
      await expect(
        registry.connect(user1).setKYCStatus(user1.address, true, "Filipino")
      ).to.be.reverted;
    });

    it("Should allow checking KYC status", async function () {
      await registry.setKYCStatus(user1.address, true, "Filipino");
      expect(await registry.isKYCVerified(user1.address)).to.be.true;
      expect(await registry.isKYCVerified(user2.address)).to.be.false;
    });

    it("Should return user nationality", async function () {
      await registry.setKYCStatus(user1.address, true, "American");
      expect(await registry.getUserNationality(user1.address)).to.equal("American");
    });

    it("Should allow updating KYC status", async function () {
      await registry.setKYCStatus(user1.address, false, "");
      expect(await registry.isKYCVerified(user1.address)).to.be.false;
      
      await registry.setKYCStatus(user1.address, true, "Filipino");
      expect(await registry.isKYCVerified(user1.address)).to.be.true;
    });
  });

  describe("Transfer Compliance Checks", function () {
    beforeEach(async function () {
      await registry.registerProperty(PROPERTY_ID, MOCK_NFT_CONTRACT, MAX_SUPPLY);
      await registry.setKYCStatus(user1.address, true, "Filipino");
      await registry.setKYCStatus(foreignUser.address, true, "American");
    });

    it("Should allow transfer to KYC verified Filipino", async function () {
      const [allowed, reason] = await registry.canTransfer(
        MOCK_NFT_CONTRACT,
        owner.address,
        user1.address
      );
      expect(allowed).to.be.true;
    });

    it("Should reject transfer to non-KYC user", async function () {
      const [allowed, reason] = await registry.canTransfer(
        MOCK_NFT_CONTRACT,
        owner.address,
        user2.address
      );
      expect(allowed).to.be.false;
      expect(reason).to.include("KYC verified");
    });

    it("Should allow transfer to foreigner if under cap", async function () {
      const [allowed, reason] = await registry.canTransfer(
        MOCK_NFT_CONTRACT,
        owner.address,
        foreignUser.address
      );
      expect(allowed).to.be.true;
    });

    it("Should skip compliance check for minting (from = address(0))", async function () {
      const [allowed, reason] = await registry.canTransfer(
        MOCK_NFT_CONTRACT,
        ethers.ZeroAddress,
        user2.address
      );
      expect(allowed).to.be.true;
    });
  });

  describe("Ownership Tracking", function () {
    beforeEach(async function () {
      await registry.registerProperty(PROPERTY_ID, MOCK_NFT_CONTRACT, MAX_SUPPLY);
    });

    it("Should allow admin to update ownership", async function () {
      await expect(
        registry.updateOwnership(MOCK_NFT_CONTRACT, user1.address, true)
      )
        .to.emit(registry, "OwnershipUpdated")
        .withArgs(MOCK_NFT_CONTRACT, user1.address, true);
      
      expect(await registry.foreignOwners(MOCK_NFT_CONTRACT, user1.address)).to.be.true;
    });

    it("Should prevent non-admin from updating ownership", async function () {
      await expect(
        registry.connect(user1).updateOwnership(MOCK_NFT_CONTRACT, user1.address, true)
      ).to.be.reverted;
    });

    it("Should reject invalid owner address", async function () {
      await expect(
        registry.updateOwnership(MOCK_NFT_CONTRACT, ethers.ZeroAddress, true)
      ).to.be.revertedWith("Invalid owner address");
    });
  });

  describe("Redemption Eligibility", function () {
    beforeEach(async function () {
      await registry.registerProperty(PROPERTY_ID, MOCK_NFT_CONTRACT, MAX_SUPPLY);
    });

    it("Should verify Filipino eligibility", async function () {
      await registry.setKYCStatus(user1.address, true, "Filipino");
      expect(await registry.isEligibleForRedemption(user1.address, MOCK_NFT_CONTRACT)).to.be.true;
    });

    it("Should reject non-KYC user", async function () {
      expect(await registry.isEligibleForRedemption(user1.address, MOCK_NFT_CONTRACT)).to.be.false;
    });
  });
});
