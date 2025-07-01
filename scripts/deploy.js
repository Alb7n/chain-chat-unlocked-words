
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying MessageRegistry contract to Polygon...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  // Check if we have enough balance
  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Low balance! You might need more MATIC for deployment.");
  }

  // Deploy MessageRegistry
  console.log("📝 Deploying MessageRegistry...");
  const MessageRegistry = await ethers.getContractFactory("MessageRegistry");
  
  // Estimate gas for deployment
  const deploymentData = MessageRegistry.interface.encodeDeploy([]);
  const estimatedGas = await deployer.estimateGas({ data: deploymentData });
  console.log("Estimated gas for deployment:", estimatedGas.toString());

  const messageRegistry = await MessageRegistry.deploy({
    gasLimit: estimatedGas + BigInt(50000) // Add buffer
  });

  console.log("⏳ Waiting for deployment transaction...");
  await messageRegistry.waitForDeployment();

  const deployedAddress = await messageRegistry.getAddress();
  console.log("✅ MessageRegistry deployed to:", deployedAddress);
  console.log("📜 Transaction hash:", messageRegistry.deploymentTransaction().hash);

  // Wait for a few confirmations before verification
  console.log("⏳ Waiting for block confirmations...");
  await messageRegistry.deploymentTransaction().wait(5);

  // Verify contract on Polygonscan
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("🔍 Verifying contract on Polygonscan...");
    try {
      await run("verify:verify", {
        address: deployedAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified successfully!");
    } catch (e) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log("ℹ️  Contract already verified");
      } else {
        console.log("❌ Verification failed:", e.message);
      }
    }
  }

  // Test the contract
  console.log("\n🧪 Testing contract functions...");
  try {
    const totalMessages = await messageRegistry.getTotalMessages();
    const messageFee = await messageRegistry.messageFee();
    const owner = await messageRegistry.owner();
    
    console.log("📊 Contract Status:");
    console.log("  - Total messages:", totalMessages.toString());
    console.log("  - Message fee:", ethers.formatEther(messageFee), "MATIC");
    console.log("  - Owner:", owner);
    console.log("  - Contract balance:", ethers.formatEther(await messageRegistry.getContractBalance()), "MATIC");
  } catch (error) {
    console.log("❌ Contract test failed:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Next steps:");
  console.log("1. Update CONTRACT_ADDRESSES in polygonWeb3Service.ts with:", deployedAddress);
  console.log("2. Set up your environment variables");
  console.log("3. Test the application");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
