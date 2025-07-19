const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Starting deployment of SilentIntellect Blockchain Application...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy GovernanceToken first (non-upgradeable)
  console.log("\n1. Deploying GovernanceToken...");
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const governanceToken = await GovernanceToken.deploy();
  await governanceToken.deployed();
  console.log("GovernanceToken deployed to:", governanceToken.address);

  // Deploy IdentityRegistry (upgradeable)
  console.log("\n2. Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await upgrades.deployProxy(
    IdentityRegistry,
    [],
    { initializer: "initialize" }
  );
  await identityRegistry.deployed();
  console.log("IdentityRegistry deployed to:", identityRegistry.address);

  // Deploy CredentialManager (upgradeable)
  console.log("\n3. Deploying CredentialManager...");
  const CredentialManager = await ethers.getContractFactory("CredentialManager");
  const credentialManager = await upgrades.deployProxy(
    CredentialManager,
    [identityRegistry.address],
    { initializer: "initialize" }
  );
  await credentialManager.deployed();
  console.log("CredentialManager deployed to:", credentialManager.address);

  // Deploy LendingPool (upgradeable)
  console.log("\n4. Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await upgrades.deployProxy(
    LendingPool,
    [identityRegistry.address, credentialManager.address],
    { initializer: "initialize" }
  );
  await lendingPool.deployed();
  console.log("LendingPool deployed to:", lendingPool.address);

  // Setup initial configuration
  console.log("\n5. Setting up initial configuration...");
  
  // Authorize the credential manager as an issuer
  await credentialManager.setIssuerAuthorization(deployer.address, true);
  console.log("Deployer authorized as credential issuer");

  // Add ETH pool to lending (using WETH address for mainnet, or a mock for testnet)
  const wethAddress = process.env.WETH_ADDRESS || "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  try {
    await lendingPool.addAssetPool(wethAddress, 200); // 2% base rate
    console.log("WETH pool added to lending protocol");
  } catch (error) {
    console.log("Note: WETH pool setup skipped (may not be available on this network)");
  }

  // Create initial governance snapshot
  await governanceToken.snapshot();
  console.log("Initial governance snapshot created");

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("==========================================");
  console.log("GovernanceToken:", governanceToken.address);
  console.log("IdentityRegistry:", identityRegistry.address);
  console.log("CredentialManager:", credentialManager.address);
  console.log("LendingPool:", lendingPool.address);
  console.log("==========================================");

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      GovernanceToken: governanceToken.address,
      IdentityRegistry: identityRegistry.address,
      CredentialManager: credentialManager.address,
      LendingPool: lendingPool.address,
    },
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contracts on Etherscan (if not local network)
  if (process.env.ETHERSCAN_API_KEY && (await ethers.provider.getNetwork()).chainId !== 1337) {
    console.log("\n🔍 Starting contract verification...");
    try {
      await hre.run("verify:verify", {
        address: governanceToken.address,
        constructorArguments: [],
      });
      console.log("GovernanceToken verified");
    } catch (error) {
      console.log("GovernanceToken verification failed:", error.message);
    }
  }

  return deploymentInfo;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

