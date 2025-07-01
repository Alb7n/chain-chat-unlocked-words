
const { ethers } = require("hardhat");

async function main() {
  const networkName = network.name;
  const isTestnet = networkName === 'mumbai' || networkName === 'localhost' || networkName === 'hardhat';
  
  console.log(`\n🚀 Deploying MessageRegistry contract to ${networkName}...`);
  console.log("="+"=".repeat(50));

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC");

  // Check if we have enough balance for deployment
  const minimumBalance = isTestnet ? "0.01" : "0.1";
  if (balance < ethers.parseEther(minimumBalance)) {
    console.warn(`⚠️  Low balance! You need at least ${minimumBalance} MATIC for deployment.`);
    if (isTestnet) {
      console.log("💡 Get testnet MATIC from: https://faucet.polygon.technology/");
    }
    process.exit(1);
  }

  // Deploy MessageRegistry
  console.log("\n📝 Deploying MessageRegistry contract...");
  const MessageRegistry = await ethers.getContractFactory("MessageRegistry");
  
  // Estimate gas for deployment
  const deploymentData = MessageRegistry.interface.encodeDeploy([]);
  const estimatedGas = await deployer.estimateGas({ data: deploymentData });
  const gasPrice = await deployer.provider.getFeeData();
  
  console.log("⛽ Estimated gas:", estimatedGas.toString());
  console.log("💵 Gas price:", ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'), "gwei");
  console.log("💰 Estimated cost:", ethers.formatEther((estimatedGas * (gasPrice.gasPrice || 0n)).toString()), "MATIC");

  const messageRegistry = await MessageRegistry.deploy({
    gasLimit: estimatedGas + BigInt(50000) // Add buffer
  });

  console.log("\n⏳ Waiting for deployment transaction...");
  await messageRegistry.waitForDeployment();

  const deployedAddress = await messageRegistry.getAddress();
  const deploymentTx = messageRegistry.deploymentTransaction();
  
  console.log("\n✅ DEPLOYMENT SUCCESSFUL!");
  console.log("="+"=".repeat(50));
  console.log("📍 Contract address:", deployedAddress);
  console.log("📜 Transaction hash:", deploymentTx?.hash);
  console.log("🌐 Network:", networkName);

  // Wait for confirmations before verification
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await deploymentTx?.wait(5);

    // Verify contract on Polygonscan
    console.log("\n🔍 Verifying contract on Polygonscan...");
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
        console.log("💡 You can verify manually on Polygonscan later");
      }
    }
  }

  // Test the contract functions
  console.log("\n🧪 Testing contract functions...");
  try {
    const totalMessages = await messageRegistry.getTotalMessages();
    const messageFee = await messageRegistry.messageFee();
    const owner = await messageRegistry.owner();
    const contractBalance = await messageRegistry.getContractBalance();
    
    console.log("\n📊 Contract Status:");
    console.log("  - Total messages:", totalMessages.toString());
    console.log("  - Message fee:", ethers.formatEther(messageFee), "MATIC");
    console.log("  - Owner:", owner);
    console.log("  - Contract balance:", ethers.formatEther(contractBalance), "MATIC");
  } catch (error) {
    console.log("❌ Contract test failed:", error.message);
  }

  // Provide next steps
  console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("="+"=".repeat(50));
  console.log("\n📋 NEXT STEPS:");
  console.log("1. 📝 Update CONTRACT_ADDRESSES in src/utils/polygonWeb3Service.ts:");
  console.log(`   messageRegistry: '${deployedAddress}',`);
  console.log("\n2. 🔧 Environment Variables Check:");
  console.log("   - POLYGON_RPC_URL (or MUMBAI_RPC_URL for testnet)");
  console.log("   - PRIVATE_KEY");
  console.log("   - POLYGONSCAN_API_KEY (for verification)");
  console.log("\n3. 🌐 Explorer Links:");
  
  const explorerUrl = isTestnet 
    ? `https://mumbai.polygonscan.com/address/${deployedAddress}`
    : `https://polygonscan.com/address/${deployedAddress}`;
  console.log(`   Contract: ${explorerUrl}`);
  
  if (deploymentTx?.hash) {
    const txUrl = isTestnet 
      ? `https://mumbai.polygonscan.com/tx/${deploymentTx.hash}`
      : `https://polygonscan.com/tx/${deploymentTx.hash}`;
    console.log(`   Transaction: ${txUrl}`);
  }

  console.log("\n4. 🧪 Test the application:");
  console.log("   - Connect wallet");
  console.log("   - Send test messages");
  console.log("   - Add contacts");
  console.log("\n5. 🔄 If using testnet, get MATIC from:");
  console.log("   https://faucet.polygon.technology/");
  
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Ready to use your decentralized messaging app!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED!");
    console.error("="+"=".repeat(50));
    console.error("Error:", error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.error("\n💡 Solution: Add more MATIC to your account");
      console.error("   Testnet faucet: https://faucet.polygon.technology/");
    } else if (error.message.includes('nonce')) {
      console.error("\n💡 Solution: Reset MetaMask account or wait and try again");
    } else if (error.message.includes('network')) {
      console.error("\n💡 Solution: Check your RPC URL and network connection");
    }
    
    console.error("="+"=".repeat(50));
    process.exit(1);
  });
