
const fs = require('fs');
const path = require('path');

function updateContractAddress(contractAddress) {
  const filePath = path.join(__dirname, '../src/utils/polygonWeb3Service.ts');
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the contract address
    const oldPattern = /messageRegistry: '[^']*'/;
    const newValue = `messageRegistry: '${contractAddress}'`;
    
    content = content.replace(oldPattern, newValue);
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated contract address in ${filePath}`);
    console.log(`📍 New address: ${contractAddress}`);
  } catch (error) {
    console.error('❌ Error updating contract address:', error.message);
  }
}

// Check if contract address was provided as command line argument
const contractAddress = process.argv[2];
if (!contractAddress) {
  console.log('Usage: node update-contract-address.js <CONTRACT_ADDRESS>');
  process.exit(1);
}

updateContractAddress(contractAddress);
