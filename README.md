# SecureChat - Decentralized Messaging Platform

## PL Genesis: Modular Worlds Submission

**Track**: Secure, Sovereign Systems (Existing Code)

A censorship-resistant, blockchain-based messaging platform that combines IPFS storage with Ethereum/Polygon smart contracts to ensure message permanence and user sovereignty.

## 🌟 Key Features

- **Decentralized Storage**: Messages stored on IPFS for censorship resistance
- **Blockchain Verification**: Smart contract validation on Polygon network
- **End-to-End Encryption**: Client-side encryption before IPFS upload
- **Sovereign Identity**: Wallet-based authentication (no central authorities)
- **Rich Media Support**: Voice messages, file sharing, and reactions
- **Zero Downtime**: Distributed infrastructure with no single point of failure

## 🏗️ Architecture

This application demonstrates key principles of the decentralized web:

1. **Data Sovereignty**: Users control their data through wallet ownership
2. **Censorship Resistance**: IPFS ensures messages cannot be deleted by authorities
3. **Transparent Verification**: All message hashes recorded on-chain for authenticity
4. **Resilient Infrastructure**: No reliance on centralized servers

## 🚀 Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Blockchain**: Ethereum/Polygon, Ethers.js, Hardhat
- **Storage**: IPFS for decentralized file storage
- **Smart Contracts**: Solidity
- **UI Components**: shadcn/ui, Radix UI primitives

## 📱 Core Functionality

- **Wallet Connection**: MetaMask integration for secure authentication
- **Contact Management**: Add contacts via wallet addresses
- **Message Threading**: Reply-to functionality with message references
- **Real-time Status**: Live blockchain confirmation tracking
- **Media Sharing**: Decentralized file storage and retrieval
- **Search & Discovery**: Message search across conversation history

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Access to Polygon Mumbai testnet (or mainnet)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Smart Contract Deployment

```bash
# Deploy contracts to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet
```

## 🔧 Configuration

1. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your private key and RPC URLs
   ```

2. Configure your wallet for Polygon network
3. Deploy smart contracts using provided scripts
4. Update contract addresses in the application

## 🎯 Competition Relevance

This project addresses the **Secure, Sovereign Systems** challenge by:

- **Eliminating Central Points of Failure**: No servers, no databases, no admin controls
- **User Data Sovereignty**: Users own their messages through blockchain verification
- **Censorship Resistance**: IPFS ensures message permanence regardless of political pressure
- **Zero-Knowledge Privacy**: Messages encrypted client-side before storage
- **Transparent Infrastructure**: All operations verifiable on-chain

## 🏆 PL Genesis Innovation

Building on existing decentralized technologies, this project introduces:

- **Hybrid Storage Model**: Combining IPFS permanence with blockchain verification
- **Progressive Decentralization**: Seamless user experience while maintaining full decentralization
- **Cross-Chain Compatibility**: Architecture ready for multi-chain deployment
- **Modular Design**: Components can be extended for other Web3 applications

## 🤝 Contributing

This project welcomes contributions from the Protocol Labs ecosystem and beyond. See our contribution guidelines for development setup and submission process.

## 📄 License

Open source under MIT License - building the decentralized future together.
