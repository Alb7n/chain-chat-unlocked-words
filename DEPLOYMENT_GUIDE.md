
# Smart Contract Deployment Guide

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in your environment variables:
     - `PRIVATE_KEY`: Your wallet's private key (without 0x prefix)
     - `MUMBAI_RPC_URL`: Mumbai testnet RPC URL (default provided)
     - `POLYGONSCAN_API_KEY`: Get from https://polygonscan.com/apis

## Step-by-Step Deployment

### 1. Get Testnet MATIC
- Visit: https://faucet.polygon.technology/
- Connect your wallet and request Mumbai MATIC
- Wait for the transaction to complete

### 2. Deploy Contract
```bash
# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.js --network mumbai

# If you get compilation errors, clean first:
npx hardhat clean
npx hardhat compile
npx hardhat run scripts/deploy.js --network mumbai
```

### 3. Update Frontend Configuration
After successful deployment, copy the contract address from the console output and update it in `src/utils/polygonWeb3Service.ts`:

```typescript
const CONTRACT_ADDRESSES = {
  messageRegistry: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
};
```

### 4. Test the Application
1. Refresh your browser
2. Connect your wallet
3. The app should now show "Contract: Deployed" status
4. Try sending a test message

## Troubleshooting

### Common Issues:

1. **"Insufficient funds" error**
   - Get more Mumbai MATIC from the faucet
   - Ensure you have at least 0.01 MATIC

2. **"Nonce too high" error**
   - Reset your MetaMask account: Settings → Advanced → Reset Account

3. **"Network not supported" error**
   - Make sure you're connected to Mumbai testnet in MetaMask
   - The app will try to switch automatically

4. **Contract verification fails**
   - This is optional and doesn't affect functionality
   - You can verify manually on Mumbai Polygonscan later

### Manual Network Setup

If the app can't switch networks automatically:

1. Open MetaMask
2. Click network dropdown → Add Network
3. Fill in Mumbai testnet details:
   - Network Name: Polygon Mumbai
   - RPC URL: https://rpc-mumbai.maticvigil.com
   - Chain ID: 80001
   - Currency Symbol: MATIC
   - Block Explorer: https://mumbai.polygonscan.com

## After Deployment

Your app will have these features enabled:
- ✅ Wallet connection to Polygon Mumbai
- ✅ Send encrypted messages on-chain
- ✅ Add and manage contacts
- ✅ View message history
- ✅ Real-time blockchain status

## Moving to Production

To deploy to Polygon mainnet:
1. Change `isTestnet` to `false` in `polygonWeb3Service.ts`
2. Update hardhat config default network to `polygon`
3. Get mainnet MATIC
4. Deploy with `--network polygon`
