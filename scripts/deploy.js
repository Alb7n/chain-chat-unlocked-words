
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying MessageRegistry contract to Polygon...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy MessageRegistry
  const MessageRegistry = await ethers.getContractFactory("MessageRegistry");
  const messageRegistry = await MessageRegistry.deploy();

  await messageRegistry.deployed();

  console.log("MessageRegistry deployed to:", messageRegistry.address);
  console.log("Transaction hash:", messageRegistry.deployTransaction.hash);

  // Verify contract on Polygonscan (optional)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await messageRegistry.deployTransaction.wait(6);
    
    console.log("Verifying contract on Polygonscan...");
    try {
      await run("verify:verify", {
        address: messageRegistry.address,
        constructorArguments: [],
      });
    } catch (e) {
      console.log("Verification failed:", e);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
