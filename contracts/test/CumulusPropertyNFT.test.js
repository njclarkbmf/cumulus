const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CumulusPropertyNFT", function () {
  let propertyNFT;
  let owner;
  let user1;
  let user2;
  let treasury;
  
  const NFT_NAME = "Cumulus Makati Condo A";
  const NFT_SYMBOL = "CUMULUS-MKA";
  const MAINTENANCE_FEE = ethers.parseEther("0.01"); // 0.01 MATIC for testing
  const MOCK_REGISTRY = "0x1234567890123456789012345678901234567890";
  const TOKEN_URI = "ipfs://QmTest123";

  beforeEach(async function () {
    [owner, user1, user2, treasury] = await ethers.getSigners();
    
    const PropertyNFT = await ethers.getContractFactory("CumulusPropertyNFT");
    propertyNFT = await PropertyNFT.deploy(
      NFT_NAME,
      NFT_SYMBOL,
      treasury.address,
      MAINTENANCE_FEE,
      MOCK_REGISTRY
    );
    await propertyNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      expect(await propertyNFT.name()).to.equal(NFT_NAME);
      expect(await propertyNFT.symbol()).to.equal(NFT_SYMBOL);
      expect(await propertyNFT.propertyTreasury()).to.equal(treasury.address);
      expect(await propertyNFT.monthlyMaintenanceFee()).to.equal(MAINTENANCE_FEE);
      expect(await propertyNFT.registryContract()).to.equal(MOCK_REGISTRY);
    });

    it("Should reject invalid treasury address", async function () {
      const PropertyNFT = await ethers.getContractFactory("CumulusPropertyNFT");
      await expect(
        PropertyNFT.deploy(
          NFT_NAME,
          NFT_SYMBOL,
          ethers.ZeroAddress,
          MAINTENANCE_FEE,
          MOCK_REGISTRY
        )
      ).to.be.revertedWith("Invalid treasury");
    });

    it("Should reject invalid registry address", async function () {
      const PropertyNFT = await ethers.getContractFactory("CumulusPropertyNFT");
      await expect(
        PropertyNFT.deploy(
          NFT_NAME,
          NFT_SYMBOL,
          treasury.address,
          MAINTENANCE_FEE,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid registry");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      await expect(propertyNFT.mint(user1.address, 1, TOKEN_URI))
        .to.emit(propertyNFT, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, 1);
      
      expect(await propertyNFT.ownerOf(1)).to.equal(user1.address);
      expect(await propertyNFT.tokenURI(1)).to.equal(TOKEN_URI);
    });

    it("Should prevent non-owner from minting", async function () {
      await expect(
        propertyNFT.connect(user1).mint(user1.address, 1, TOKEN_URI)
      ).to.be.reverted;
    });

    it("Should prevent minting duplicate token IDs", async function () {
      await propertyNFT.mint(user1.address, 1, TOKEN_URI);
      await expect(
        propertyNFT.mint(user2.address, 1, TOKEN_URI)
      ).to.be.revertedWith("Token already exists");
    });

    it("Should reject minting to zero address", async function () {
      await expect(
        propertyNFT.mint(ethers.ZeroAddress, 1, TOKEN_URI)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should initialize maintenance tracking on mint", async function () {
      await propertyNFT.mint(user1.address, 1, TOKEN_URI);
      
      const [lastPaid, current, nextDueDate] = await propertyNFT.getMaintenanceStatus(1);
      expect(lastPaid).to.be.greaterThan(0);
      expect(current).to.be.true;
    });
  });

  describe("Maintenance Fees", function () {
    beforeEach(async function () {
      await propertyNFT.mint(user1.address, 1, TOKEN_URI);
    });

    it("Should accept maintenance payment", async function () {
      await expect(
        propertyNFT.connect(user1).payMaintenance(1, { value: MAINTENANCE_FEE })
      )
        .to.emit(propertyNFT, "MaintenancePaid");
    });

    it("Should update lastMaintenancePaid timestamp", async function () {
      const [beforeLastPaid] = await propertyNFT.getMaintenanceStatus(1);
      
      // Advance time by 1 day
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      
      await propertyNFT.connect(user1).payMaintenance(1, { value: MAINTENANCE_FEE });
      
      const [afterLastPaid] = await propertyNFT.getMaintenanceStatus(1);
      expect(afterLastPaid).to.be.greaterThan(beforeLastPaid);
    });

    it("Should transfer payment to property treasury", async function () {
      const treasuryBefore = await ethers.provider.getBalance(treasury.address);
      
      await propertyNFT.connect(user1).payMaintenance(1, { value: MAINTENANCE_FEE });
      
      const treasuryAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryAfter - treasuryBefore).to.equal(MAINTENANCE_FEE);
    });

    it("Should reject insufficient maintenance payment", async function () {
      await expect(
        propertyNFT.connect(user1).payMaintenance(1, { value: MAINTENANCE_FEE - 1n })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should refund overpayment", async function () {
      const userBefore = await ethers.provider.getBalance(user1.address);
      
      const tx = await propertyNFT.connect(user1).payMaintenance(1, { 
        value: MAINTENANCE_FEE * 2n,
        gasPrice: 1000000000 // 1 gwei for predictable gas
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * 1000000000n;
      
      const userAfter = await ethers.provider.getBalance(user1.address);
      // User paid MAINTENANCE_FEE * 2, got MAINTENANCE_FEE refunded, plus gas cost
      expect(userAfter + gasUsed).to.be.closeTo(
        userBefore - MAINTENANCE_FEE,
        ethers.parseEther("0.001") // Small tolerance
      );
    });

    it("Should allow owner to update maintenance fee", async function () {
      const newFee = ethers.parseEther("0.02");
      await expect(propertyNFT.setMaintenanceFee(newFee))
        .to.emit(propertyNFT, "MaintenanceFeeUpdated")
        .withArgs(newFee);
      
      expect(await propertyNFT.monthlyMaintenanceFee()).to.equal(newFee);
    });

    it("Should prevent non-owner from updating maintenance fee", async function () {
      await expect(
        propertyNFT.connect(user1).setMaintenanceFee(ethers.parseEther("0.02"))
      ).to.be.reverted;
    });

    it("Should return correct maintenance status", async function () {
      const [lastPaid, current, nextDueDate] = await propertyNFT.getMaintenanceStatus(1);
      
      expect(lastPaid).to.be.greaterThan(0);
      expect(current).to.be.true;
      expect(nextDueDate).to.be.greaterThan(lastPaid);
    });
  });

  describe("Transfer Restrictions (Maintenance)", function () {
    beforeEach(async function () {
      await propertyNFT.mint(user1.address, 1, TOKEN_URI);
    });

    it("Should allow transfer if maintenance current", async function () {
      await propertyNFT.connect(user1).approve(user2.address, 1);
      await expect(
        propertyNFT.connect(user2).transferFrom(user1.address, user2.address, 1)
      ).to.not.be.reverted;
    });

    it("Should prevent transfer if maintenance overdue", async function () {
      // Advance time by 31 days (past grace period)
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      await propertyNFT.connect(user1).approve(user2.address, 1);
      await expect(
        propertyNFT.connect(user2).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("Maintenance overdue");
    });

    it("Should allow transfer after paying overdue maintenance", async function () {
      // Advance time by 31 days
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      // Pay maintenance
      await propertyNFT.connect(user1).payMaintenance(1, { value: MAINTENANCE_FEE });
      
      // Now transfer should work
      await propertyNFT.connect(user1).approve(user2.address, 1);
      await expect(
        propertyNFT.connect(user2).transferFrom(user1.address, user2.address, 1)
      ).to.not.be.reverted;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to pause contract", async function () {
      await expect(propertyNFT.pause())
        .to.emit(propertyNFT, "Paused")
        .withArgs(owner.address);
      
      expect(await propertyNFT.isPaused()).to.be.true;
    });

    it("Should allow owner to unpause contract", async function () {
      await propertyNFT.pause();
      
      await expect(propertyNFT.unpause())
        .to.emit(propertyNFT, "Unpaused")
        .withArgs(owner.address);
      
      expect(await propertyNFT.isPaused()).to.be.false;
    });

    it("Should prevent transfers when paused", async function () {
      await propertyNFT.mint(user1.address, 1, TOKEN_URI);
      await propertyNFT.pause();
      
      await propertyNFT.connect(user1).approve(user2.address, 1);
      await expect(
        propertyNFT.connect(user2).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("Contract paused");
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(propertyNFT.connect(user1).pause()).to.be.reverted;
    });

    it("Should allow owner to update treasury", async function () {
      const newTreasury = user2.address;
      await expect(propertyNFT.setPropertyTreasury(newTreasury))
        .to.emit(propertyNFT, "PropertyTreasuryUpdated")
        .withArgs(newTreasury);
      
      expect(await propertyNFT.propertyTreasury()).to.equal(newTreasury);
    });

    it("Should reject invalid treasury address", async function () {
      await expect(
        propertyNFT.setPropertyTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should allow owner to update registry", async function () {
      const newRegistry = user2.address;
      await expect(propertyNFT.setRegistry(newRegistry))
        .to.emit(propertyNFT, "RegistryUpdated")
        .withArgs(newRegistry);
      
      expect(await propertyNFT.registryContract()).to.equal(newRegistry);
    });
  });

  describe("ERC-721 Enumerable", function () {
    beforeEach(async function () {
      await propertyNFT.mint(user1.address, 1, TOKEN_URI);
      await propertyNFT.mint(user1.address, 2, TOKEN_URI);
      await propertyNFT.mint(user2.address, 3, TOKEN_URI);
    });

    it("Should track total supply", async function () {
      expect(await propertyNFT.totalSupply()).to.equal(3);
    });

    it("Should track token by index", async function () {
      expect(await propertyNFT.tokenByIndex(0)).to.equal(1);
    });

    it("Should track owner's tokens", async function () {
      expect(await propertyNFT.tokenOfOwnerByIndex(user1.address, 0)).to.equal(1);
      expect(await propertyNFT.tokenOfOwnerByIndex(user1.address, 1)).to.equal(2);
    });

    it("Should return correct balance", async function () {
      expect(await propertyNFT.balanceOf(user1.address)).to.equal(2);
      expect(await propertyNFT.balanceOf(user2.address)).to.equal(1);
    });
  });

  describe("Metadata", function () {
    it("Should return correct token URI", async function () {
      await propertyNFT.mint(user1.address, 1, TOKEN_URI);
      expect(await propertyNFT.getTokenURI(1)).to.equal(TOKEN_URI);
    });

    it("Should reject non-existent token", async function () {
      await expect(propertyNFT.getTokenURI(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });
});
