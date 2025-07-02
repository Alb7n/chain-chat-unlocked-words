
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting Smart Contract Deployment Setup");
  console.log("=" + "=".repeat(50));

  // Check if .env file exists
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log("⚠️  .env file not found!");
    console.log("📝 Please create a .env file with your configuration:");
    console.log("   cp .env.example .env");
    console.log("   # Then edit .env with your private key and RPC URLs");
    process.exit(1);
  }

  const networkName = network.name;
  const isTestnet = networkName === 'amoy' || networkName === 'mumbai' || networkName === 'localhost' || networkName === 'hardhat';
  
  console.log(`\n🌐 Deploying to: ${networkName}`);
  console.log(`🧪 Testnet: ${isTestnet ? 'Yes' : 'No'}`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInMatic = ethers.formatEther(balance);
  console.log("💰 Deployer balance:", balanceInMatic, "MATIC");

  const minBalance = isTestnet ? "0.01" : "0.1";
  if (parseFloat(balanceInMatic) < parseFloat(minBalance)) {
    console.log(`\n❌ Insufficient balance!`);
    console.log(`   Required: ${minBalance} MATIC`);
    console.log(`   Current: ${balanceInMatic} MATIC`);
    
    if (isTestnet) {
      console.log("\n💡 Get testnet MATIC:");
      console.log("   1. Visit: https://faucet.polygon.technology/");
      console.log("   2. Connect your wallet");
      console.log("   3. Request Amoy MATIC");
      console.log("   4. Wait for transaction confirmation");
      console.log("   5. Run deployment again");
    }
    process.exit(1);
  }

  // Deploy contract
  console.log("\n📝 Deploying MessageRegistry contract...");
  const MessageRegistry = await ethers.getContractFactory("MessageRegistry");
  
  try {
    const messageRegistry = await MessageRegistry.deploy();
    console.log("⏳ Deployment transaction sent...");
    
    await messageRegistry.waitForDeployment();
    const contractAddress = await messageRegistry.getAddress();
    
    console.log("\n✅ CONTRACT DEPLOYED SUCCESSFULLY!");
    console.log("=" + "=".repeat(50));
    console.log("📍 Contract Address:", contractAddress);
    console.log("🌐 Network:", networkName);
    console.log("🔗 Transaction:", messageRegistry.deploymentTransaction()?.hash);
    
    // Test contract
    console.log("\n🧪 Testing contract...");
    const totalMessages = await messageRegistry.getTotalMessages();
    const messageFee = await messageRegistry.messageFee();
    console.log("   ✓ Total messages:", totalMessages.toString());
    console.log("   ✓ Message fee:", ethers.formatEther(messageFee), "MATIC");
    
    // Generate frontend config
    console.log("\n📋 NEXT STEPS:");
    console.log("=" + "=".repeat(50));
    console.log("1. Update your frontend configuration:");
    console.log("   File: src/utils/polygonWeb3Service.ts");
    console.log("   Replace this line:");
    console.log("   messageRegistry: '0x0000000000000000000000000000000000000000',");
    console.log("   With:");
    console.log(`   messageRegistry: '${contractAddress}',`);
    
    console.log("\n2. Refresh your browser and test the app");
    console.log("3. Connect your wallet - it should show 'Contract: Deployed'");
    console.log("4. Try sending a test message");
    
    // Explorer links
    const explorerBase = isTestnet ? "https://amoy.polygonscan.com" : "https://polygonscan.com";
    console.log(`\n🔍 View on Explorer: ${explorerBase}/address/${contractAddress}`);
    
  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED!");
    console.error("Error:", error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.error("\n💡 Solution: Get more MATIC from the faucet");
    } else if (error.message.includes('nonce')) {
      console.error("\n💡 Solution: Reset MetaMask account or wait and try again");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
