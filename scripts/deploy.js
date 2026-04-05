const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Cumulus Smart Contracts...\n");

  // Configuration
  const PROPERTY_NAME = "Cumulus Makati Condo A";
  const PROPERTY_SYMBOL = "CUMULUS-MKA";
  const PROPERTY_ID = "PROP-MKT-001";
  const MAX_SUPPLY = 100;
  const MONTHLY_MAINTENANCE_FEE = hre.ethers.parseEther("0.01"); // 0.01 MATIC for testnet
  const ROYALTY_BPS = 250; // 2.5%
  const FOREIGN_OWNERSHIP_CAP = 40; // 40%

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  // 1. Deploy CumulusRegistry
  console.log("1️⃣  Deploying CumulusRegistry...");
  const Registry = await hre.ethers.getContractFactory("CumulusRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("   ✅ Registry deployed to:", registryAddress);

  // 2. Deploy CumulusPropertyNFT
  console.log("\n2️⃣  Deploying CumulusPropertyNFT...");
  const PropertyNFT = await hre.ethers.getContractFactory("CumulusPropertyNFT");
  const propertyNFT = await PropertyNFT.deploy(
    PROPERTY_NAME,
    PROPERTY_SYMBOL,
    deployer.address, // property treasury (deployer for testing)
    MONTHLY_MAINTENANCE_FEE,
    registryAddress
  );
  await propertyNFT.waitForDeployment();
  const propertyNFTAddress = await propertyNFT.getAddress();
  console.log("   ✅ PropertyNFT deployed to:", propertyNFTAddress);

  // 3. Deploy CumulusMarketplace
  console.log("\n3️⃣  Deploying CumulusMarketplace...");
  const Marketplace = await hre.ethers.getContractFactory("CumulusMarketplace");
  const marketplace = await Marketplace.deploy(
    propertyNFTAddress,
    deployer.address, // Jagi treasury (deployer for testing)
    ROYALTY_BPS,
    registryAddress
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("   ✅ Marketplace deployed to:", marketplaceAddress);

  // 4. Register property in registry
  console.log("\n4️⃣  Registering property in registry...");
  const tx1 = await registry.registerProperty(
    PROPERTY_ID,
    propertyNFTAddress,
    MAX_SUPPLY
  );
  await tx1.wait();
  console.log("   ✅ Property registered:", PROPERTY_ID);

  // 5. Set marketplace as approved operator
  console.log("\n5️⃣  Setting marketplace as approved operator...");
  const tx2 = await propertyNFT.setApprovalForAll(marketplaceAddress, true);
  await tx2.wait();
  console.log("   ✅ Marketplace approved");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   Registry:", registryAddress);
  console.log("   PropertyNFT:", propertyNFTAddress);
  console.log("   Marketplace:", marketplaceAddress);
  
  console.log("\n📊 Configuration:");
  console.log("   Property Name:", PROPERTY_NAME);
  console.log("   Property Symbol:", PROPERTY_SYMBOL);
  console.log("   Property ID:", PROPERTY_ID);
  console.log("   Max Supply:", MAX_SUPPLY);
  console.log("   Monthly Maintenance:", hre.ethers.formatEther(MONTHLY_MAINTENANCE_FEE), "MATIC");
  console.log("   Royalty:", ROYALTY_BPS / 100, "%");
  console.log("   Foreign Ownership Cap:", FOREIGN_OWNERSHIP_CAP, "%");

  console.log("\n📝 Update your .env file with these addresses:");
  console.log(`REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`PROPERTY_NFT_ADDRESS=${propertyNFTAddress}`);
  console.log(`MARKETPLACE_ADDRESS=${marketplaceAddress}`);

  console.log("\n🔗 Verify contracts on Polygonscan:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${registryAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${propertyNFTAddress} "${PROPERTY_NAME}" "${PROPERTY_SYMBOL}" ${deployer.address} ${MONTHLY_MAINTENANCE_FEE} ${registryAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${marketplaceAddress} ${propertyNFTAddress} ${deployer.address} ${ROYALTY_BPS} ${registryAddress}`);

  console.log("\n✅ Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
