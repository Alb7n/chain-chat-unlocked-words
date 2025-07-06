import { ethers } from 'ethers';
import { ipfsService } from './ipfsService';

// Updated Polygon network configuration with reliable RPC endpoints
const POLYGON_CONFIG = {
  chainId: 137, // Polygon Mainnet
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://polygon.llamarpc.com', 'https://polygon-rpc.com/', 'https://rpc-mainnet.matic.network'],
  blockExplorerUrls: ['https://polygonscan.com/'],
};

const POLYGON_TESTNET_CONFIG = {
  chainId: 80002, // Amoy Testnet
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology/', 'https://polygon-amoy.drpc.org', 'https://rpc.ankr.com/polygon_amoy'],
  blockExplorerUrls: ['https://amoy.polygonscan.com/'],
};

// MessageRegistry Contract ABI
const MESSAGE_REGISTRY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "string", "name": "contentHash", "type": "string" },
      { "internalType": "string", "name": "metadataHash", "type": "string" },
      { "internalType": "bool", "name": "isEncrypted", "type": "bool" },
      { "internalType": "uint256", "name": "messageType", "type": "uint256" }
    ],
    "name": "sendMessage",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "contactAddress", "type": "address" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "ensName", "type": "string" },
      { "internalType": "string", "name": "avatar", "type": "string" }
    ],
    "name": "addContact",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "messageId", "type": "bytes32" },
      { "internalType": "string", "name": "emoji", "type": "string" },
      { "internalType": "bool", "name": "add", "type": "bool" }
    ],
    "name": "reactToMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getUserMessages",
    "outputs": [
      { "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getUserContacts",
    "outputs": [
      { "internalType": "address[]", "name": "", "type": "address[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "messageId", "type": "bytes32" }
    ],
    "name": "getMessage",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "contentHash", "type": "string" },
          { "internalType": "address", "name": "sender", "type": "address" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "blockNumber", "type": "uint256" },
          { "internalType": "bool", "name": "isEncrypted", "type": "bool" },
          { "internalType": "string", "name": "metadataHash", "type": "string" },
          { "internalType": "uint256", "name": "messageType", "type": "uint256" }
        ],
        "internalType": "struct MessageRegistry.Message",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user1", "type": "address" },
      { "internalType": "address", "name": "user2", "type": "address" }
    ],
    "name": "getConversation",
    "outputs": [
      { "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalMessages",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "messageFee",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract addresses - UPDATE THESE AFTER DEPLOYMENT
const CONTRACT_ADDRESSES = {
  // Updated with new MessageRegistry deployment
  messageRegistry: '0x160D81bbecD62f77c7E3FA93a37937eCB5039b56',
};

export interface BlockchainMessage {
  id: string;
  contentHash: string;
  sender: string;
  recipient: string;
  timestamp: number;
  blockNumber: number;
  isEncrypted: boolean;
  metadataHash: string;
  messageType: number; // 0: text, 1: media, 2: voice
  transactionHash: string;
  reactions?: { [emoji: string]: number };
}

export interface BlockchainContact {
  address: string;
  name: string;
  ensName: string;
  addedAt: number;
  isActive: boolean;
  avatar: string;
}

export class PolygonWeb3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private messageContract: ethers.Contract | null = null;
  private isTestnet: boolean = true; // Switch to false for mainnet
  private isInitialized: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  
  // Global chat address - using a well-known address for global messages
  private readonly GLOBAL_CHAT_ADDRESS = '0x0000000000000000000000000000000000000001';

  // Check if MetaMask or compatible wallet is available
  private isWalletAvailable(): boolean {
    return typeof window !== 'undefined' && (
      typeof window.ethereum !== 'undefined' || 
      typeof (window as any).web3 !== 'undefined'
    );
  }

  // Get wallet provider with better detection
  private getWalletProvider(): any {
    if (typeof window === 'undefined') return null;
    
    // Check for MetaMask
    if (window.ethereum?.isMetaMask) {
      return window.ethereum;
    }
    
    // Check for other injected providers
    if (window.ethereum) {
      return window.ethereum;
    }
    
    // Legacy web3 provider
    if ((window as any).web3?.currentProvider) {
      return (window as any).web3.currentProvider;
    }
    
    return null;
  }

  async connectWallet(): Promise<{ address: string; provider: ethers.BrowserProvider }> {
    console.log('🔄 Starting wallet connection process...');
    
    if (!this.isWalletAvailable()) {
      throw new Error('No crypto wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    const walletProvider = this.getWalletProvider();
    if (!walletProvider) {
      throw new Error('Unable to access wallet provider. Please ensure your wallet is unlocked.');
    }

    try {
      console.log('📱 Wallet provider detected, initializing connection...');
      this.provider = new ethers.BrowserProvider(walletProvider);
      
      // Request account access with timeout
      console.log('🔐 Requesting account access...');
      const accounts = await Promise.race([
        this.provider.send('eth_requestAccounts', []),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout - please check your wallet')), 30000)
        )
      ]) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }

      console.log('✅ Account access granted');

      // Check network and switch if needed
      await this.ensureCorrectNetwork();

      // Get signer
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      console.log('👤 Connected address:', address);

      // Initialize contract (this will work even if not deployed)
      await this.initializeContract();

      this.isInitialized = true;
      this.retryCount = 0; // Reset retry count on success
      
      console.log('✅ Wallet connected successfully');
      return { address, provider: this.provider };
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      
      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('rejected')) {
          throw new Error('Connection rejected by user. Please accept the connection request in your wallet.');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Connection timeout. Please ensure your wallet is responsive and try again.');
        }
        if (error.message.includes('network')) {
          throw new Error('Network connection failed. Please check your internet connection and wallet settings.');
        }
        throw error;
      }
      
      throw new Error('Failed to connect wallet. Please ensure your wallet is installed and unlocked.');
    }
  }

  private async ensureCorrectNetwork(): Promise<void> {
    if (!this.provider) throw new Error('Provider not initialized');

    try {
      const network = await this.provider.getNetwork();
      const targetChainId = this.isTestnet ? POLYGON_TESTNET_CONFIG.chainId : POLYGON_CONFIG.chainId;
      const config = this.isTestnet ? POLYGON_TESTNET_CONFIG : POLYGON_CONFIG;
      
      console.log(`🌐 Current network: ${network.chainId}, target: ${targetChainId}`);
      
      if (Number(network.chainId) !== targetChainId) {
        console.log(`🔄 Switching to ${config.chainName}...`);
        await this.switchToPolygon();
      } else {
        console.log(`✅ Already on ${config.chainName}`);
      }
    } catch (error) {
      console.error('❌ Network check failed:', error);
      throw new Error('Failed to verify network connection');
    }
  }

  private async initializeContract(): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer not available');
    }

    console.log('📄 Initializing smart contract...');

    if (CONTRACT_ADDRESSES.messageRegistry === '0x0000000000000000000000000000000000000000') {
      console.warn('⚠️  Contract address not set. Creating placeholder contract instance.');
      // Create a placeholder contract for testing UI without deployed contract
      this.messageContract = new ethers.Contract(
        CONTRACT_ADDRESSES.messageRegistry,
        MESSAGE_REGISTRY_ABI,
        this.signer
      );
      return;
    }

    try {
      this.messageContract = new ethers.Contract(
        CONTRACT_ADDRESSES.messageRegistry,
        MESSAGE_REGISTRY_ABI,
        this.signer
      );

      // Test contract connection
      const totalMessages = await this.messageContract.getTotalMessages();
      console.log('✅ Contract initialized. Total messages:', totalMessages);
    } catch (error) {
      console.warn('⚠️  Contract connection failed (contract may not be deployed):', error);
      // Don't throw error here - allow UI to work without deployed contract
    }
  }

  async switchToPolygon(): Promise<void> {
    const walletProvider = this.getWalletProvider();
    if (!walletProvider) throw new Error('Wallet provider not available');

    const config = this.isTestnet ? POLYGON_TESTNET_CONFIG : POLYGON_CONFIG;
    
    try {
      console.log(`🔄 Requesting network switch to ${config.chainName}...`);
      await walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${config.chainId.toString(16)}` }],
      });
      console.log(`✅ Successfully switched to ${config.chainName}`);
    } catch (switchError: any) {
      console.log('Switch error code:', switchError.code);
      
      // Chain not added to wallet (error code 4902)
      if (switchError.code === 4902) {
        console.log(`➕ Adding ${config.chainName} to wallet...`);
        try {
          await walletProvider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${config.chainId.toString(16)}`,
                chainName: config.chainName,
                nativeCurrency: config.nativeCurrency,
                rpcUrls: config.rpcUrls,
                blockExplorerUrls: config.blockExplorerUrls,
              },
            ],
          });
          console.log(`✅ ${config.chainName} added successfully`);
        } catch (addError) {
          console.error('❌ Failed to add network:', addError);
          throw new Error(`Failed to add ${config.chainName} to your wallet. Please add it manually.`);
        }
      } else {
        console.error('❌ Network switch failed:', switchError);
        throw new Error(`Failed to switch to ${config.chainName}. Please switch manually in your wallet.`);
      }
    }
  }

  // Retry mechanism for failed operations
  private async withRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`⚠️  ${operationName} attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error(`${operationName} failed after ${this.maxRetries} attempts`);
  }

  async sendMessage(message: string, recipient?: string): Promise<string> {
    if (!this.messageContract || !this.signer) {
      throw new Error('Contract not initialized. Please connect your wallet first.');
    }

    if (CONTRACT_ADDRESSES.messageRegistry === '0x0000000000000000000000000000000000000000') {
      throw new Error('Smart contract not deployed. Please deploy the contract first.');
    }

    // Use global chat address if no specific recipient and normalize addresses to prevent ENS lookups
    let finalRecipient = recipient || this.GLOBAL_CHAT_ADDRESS;
    
    // Ensure address is properly formatted and prevent ENS resolution
    try {
      if (recipient && recipient !== this.GLOBAL_CHAT_ADDRESS) {
        // Validate and normalize the recipient address to prevent ENS lookups
        finalRecipient = ethers.getAddress(recipient);
      }
    } catch (error) {
      throw new Error(`Invalid recipient address: ${recipient}`);
    }

    return this.withRetry(async () => {
      console.log('📤 Uploading message to IPFS first...', finalRecipient === this.GLOBAL_CHAT_ADDRESS ? '(Global Chat)' : `(Private to ${finalRecipient})`);
      
      // First upload content to IPFS
      // Get sender address without ENS resolution
      const senderAddress = await this.signer!.getAddress();
      const contentHash = await ipfsService.uploadMessage(message, {
        recipient: finalRecipient,
        sender: senderAddress
      });
      
      console.log('📤 Sending IPFS hash to blockchain...', { contentHash });
      
      // Get message fee
      const messageFee = await this.messageContract!.messageFee();
      
      // MessageRegistry sendMessage parameters: recipient, contentHash, metadataHash, isEncrypted, messageType
      const tx = await this.messageContract!.sendMessage(
        finalRecipient,
        contentHash, // IPFS hash instead of raw content
        '', // metadataHash
        true, // isEncrypted
        0, // messageType (text)
        { value: messageFee }
      );

      console.log('⏳ Transaction submitted:', tx.hash);
      await tx.wait();
      console.log('✅ Message sent successfully with IPFS integration');
      
      return tx.hash;
    }, 'Send Message');
  }

  async addContact(
    contactAddress: string,
    name: string,
    ensName: string = '',
    avatar: string = ''
  ): Promise<string> {
    if (!this.messageContract || !this.signer) {
      throw new Error('Contract not initialized. Please connect your wallet first.');
    }

    // Validate and normalize the contact address to prevent ENS lookups
    let normalizedAddress: string;
    try {
      normalizedAddress = ethers.getAddress(contactAddress);
    } catch (error) {
      throw new Error(`Invalid contact address: ${contactAddress}`);
    }

    return this.withRetry(async () => {
      console.log('👤 Adding contact to blockchain...');
      
      const tx = await this.messageContract!.addContact(
        normalizedAddress,
        name,
        ensName,
        avatar
      );

      console.log('⏳ Transaction submitted:', tx.hash);
      await tx.wait();
      console.log('✅ Contact added successfully');
      
      return tx.hash;
    }, 'Add Contact');
  }

  async reactToMessage(messageId: string, emoji: string, add: boolean = true): Promise<string> {
    if (!this.messageContract || !this.signer) {
      throw new Error('Contract not initialized. Please connect your wallet first.');
    }

    return this.withRetry(async () => {
      console.log('😊 Adding reaction to message...');
      
      // Convert messageId to bytes32 format
      const messageIdBytes32 = ethers.id(messageId);
      
      const tx = await this.messageContract!.reactToMessage(
        messageIdBytes32,
        emoji,
        add
      );

      console.log('⏳ Transaction submitted:', tx.hash);
      await tx.wait();
      console.log('✅ Reaction added successfully');
      
      return tx.hash;
    }, 'React to Message');
  }

  async getUserMessages(userAddress: string): Promise<BlockchainMessage[]> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('📥 Fetching messages for user:', userAddress);
      const messageIds = await this.messageContract.getUserMessages(userAddress);
      const messages: BlockchainMessage[] = [];

      // Fetch each message details
      for (const messageId of messageIds) {
        try {
          const messageData = await this.messageContract.getMessage(messageId);
          
          // Retrieve actual content from IPFS using the hash
          let actualContent = messageData.contentHash;
          try {
            const ipfsData = await ipfsService.retrieveMessage(messageData.contentHash);
            actualContent = ipfsData.content;
          } catch (ipfsError) {
            console.warn('⚠️ Failed to retrieve content from IPFS, using hash:', messageData.contentHash);
          }
          
          messages.push({
            id: messageId,
            contentHash: actualContent, // Now contains actual content, not hash
            sender: messageData.sender,
            recipient: messageData.recipient,
            timestamp: Number(messageData.timestamp),
            blockNumber: Number(messageData.blockNumber),
            isEncrypted: messageData.isEncrypted,
            metadataHash: messageData.metadataHash,
            messageType: Number(messageData.messageType),
            transactionHash: messageId, // Using messageId as transaction reference
          });
        } catch (error) {
          console.warn('⚠️  Failed to fetch message details for:', messageId);
        }
      }

      console.log('✅ Fetched', messages.length, 'user messages with IPFS content');
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      return [];
    }
  }

  // New method specifically for global chat messages
  async getGlobalMessages(): Promise<BlockchainMessage[]> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('🌍 Fetching global chat messages...');
      
      // Normalize the global chat address to prevent ENS lookups
      const normalizedGlobalAddress = ethers.getAddress(this.GLOBAL_CHAT_ADDRESS);
      const globalMessageIds = await this.messageContract.getUserMessages(normalizedGlobalAddress);
      const messages: BlockchainMessage[] = [];

      console.log('🌍 Found global message IDs:', globalMessageIds.length);

      for (const messageId of globalMessageIds) {
        try {
          const messageData = await this.messageContract.getMessage(messageId);
          
          // Retrieve actual content from IPFS
          let actualContent = messageData.contentHash;
          try {
            const ipfsData = await ipfsService.retrieveMessage(messageData.contentHash);
            actualContent = ipfsData.content;
          } catch (ipfsError) {
            console.warn('⚠️ Failed to retrieve global content from IPFS, using hash:', messageData.contentHash);
          }
          
          messages.push({
            id: messageId,
            contentHash: actualContent, // Now contains actual content, not hash
            sender: messageData.sender,
            recipient: messageData.recipient,
            timestamp: Number(messageData.timestamp),
            blockNumber: Number(messageData.blockNumber),
            isEncrypted: messageData.isEncrypted,
            metadataHash: messageData.metadataHash,
            messageType: Number(messageData.messageType),
            transactionHash: messageId,
          });
        } catch (error) {
          console.warn('⚠️  Failed to fetch global message details for:', messageId);
        }
      }

      console.log('✅ Fetched', messages.length, 'global messages with IPFS content');
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('❌ Error fetching global messages:', error);
      return [];
    }
  }

  async getUserContacts(userAddress: string): Promise<BlockchainContact[]> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('👥 Fetching contacts for user:', userAddress);
      const contactAddresses = await this.messageContract.getUserContacts(userAddress);
      const contacts: BlockchainContact[] = [];

      // Note: The contract stores contact addresses but we'd need additional calls
      // to get contact details. For now, return basic structure.
      contactAddresses.forEach((address: string, index: number) => {
        contacts.push({
          address,
          name: `Contact ${index + 1}`, // We'd need to fetch this from contract
          ensName: '',
          addedAt: Date.now() / 1000, // We'd need to fetch this from contract
          isActive: true,
          avatar: ''
        });
      });

      console.log('✅ Fetched', contacts.length, 'contacts');
      return contacts;
    } catch (error) {
      console.error('❌ Error fetching contacts:', error);
      return [];
    }
  }

  async getConversation(user1: string, user2: string): Promise<BlockchainMessage[]> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('💬 Fetching conversation between', user1, 'and', user2);
      const messageIds = await this.messageContract.getConversation(user1, user2);
      const messages: BlockchainMessage[] = [];

      // Fetch each message details
      for (const messageId of messageIds) {
        try {
          const messageData = await this.messageContract.getMessage(messageId);
          
          // Retrieve actual content from IPFS using the hash
          let actualContent = messageData.contentHash;
          try {
            const ipfsData = await ipfsService.retrieveMessage(messageData.contentHash);
            actualContent = ipfsData.content;
          } catch (ipfsError) {
            console.warn('⚠️ Failed to retrieve conversation content from IPFS, using hash:', messageData.contentHash);
          }
          
          messages.push({
            id: messageId,
            contentHash: actualContent, // Now contains actual content, not hash
            sender: messageData.sender,
            recipient: messageData.recipient,
            timestamp: Number(messageData.timestamp),
            blockNumber: Number(messageData.blockNumber),
            isEncrypted: messageData.isEncrypted,
            metadataHash: messageData.metadataHash,
            messageType: Number(messageData.messageType),
            transactionHash: messageId,
          });
        } catch (error) {
          console.warn('⚠️  Failed to fetch message details for:', messageId);
        }
      }

      console.log('✅ Fetched', messages.length, 'conversation messages with IPFS content');
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('❌ Error fetching conversation:', error);
      return [];
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.warn('⚠️  Could not fetch balance:', error);
      return '0.0';
    }
  }

  async getCurrentNetwork(): Promise<{ name: string; chainId: number; currency: string }> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    try {
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      
      return {
        name: chainId === 137 ? 'Polygon Mainnet' : chainId === 80002 ? 'Polygon Amoy Testnet' : chainId === 80001 ? 'Polygon Mumbai' : 'Unknown Network',
        chainId,
        currency: 'MATIC'
      };
    } catch (error) {
      console.warn('⚠️  Could not fetch network info:', error);
      return {
        name: 'Polygon Amoy Testnet',
        chainId: 80002,
        currency: 'MATIC'
      };
    }
  }

  async getMessageFee(): Promise<string> {
    if (!this.messageContract) {
      return '0.001'; // Default fee
    }

    try {
      const fee = await this.messageContract.messageFee();
      return ethers.formatEther(fee);
    } catch (error) {
      console.warn('⚠️  Could not fetch message fee:', error);
      return '0.001';
    }
  }

  async getContractStats(): Promise<{
    totalMessages: number;
    contractBalance: string;
    isContractDeployed: boolean;
  }> {
    if (!this.messageContract || CONTRACT_ADDRESSES.messageRegistry === '0x0000000000000000000000000000000000000000') {
      return {
        totalMessages: 0,
        contractBalance: '0',
        isContractDeployed: false
      };
    }

    try {
      const totalMessages = await this.messageContract.getTotalMessages();
      const contractBalance = await this.messageContract.getContractBalance();
      
      return {
        totalMessages: Number(totalMessages),
        contractBalance: ethers.formatEther(contractBalance),
        isContractDeployed: true
      };
    } catch (error) {
      console.warn('⚠️  Could not fetch contract stats');
      return {
        totalMessages: 0,
        contractBalance: '0',
        isContractDeployed: false
      };
    }
  }

  // Utility functions
  isConnected(): boolean {
    return this.isInitialized && this.signer !== null;
  }

  getContractAddress(): string {
    return CONTRACT_ADDRESSES.messageRegistry;
  }

  isContractDeployed(): boolean {
    return CONTRACT_ADDRESSES.messageRegistry !== '0x0000000000000000000000000000000000000000';
  }

  getExplorerUrl(txHash: string): string {
    const baseUrl = this.isTestnet 
      ? 'https://amoy.polygonscan.com' 
      : 'https://polygonscan.com';
    return `${baseUrl}/tx/${txHash}`;
  }

  // Connection status monitoring
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.provider || !this.signer) return false;
      
      // Try to get the current address
      await this.signer.getAddress();
      return true;
    } catch (error) {
      console.warn('⚠️  Connection check failed:', error);
      return false;
    }
  }

  // Event listeners
  onMessageSent(callback: (messageId: string, sender: string, recipient: string) => void) {
    if (!this.messageContract) return;
    
    this.messageContract.on('MessageSent', (messageId, sender, recipient) => {
      callback(messageId, sender, recipient);
    });
  }

  onContactAdded(callback: (user: string, contact: string, name: string) => void) {
    if (!this.messageContract) return;
    
    this.messageContract.on('ContactAdded', (user, contact, name) => {
      callback(user, contact, name);
    });
  }
}

export const polygonWeb3Service = new PolygonWeb3Service();

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
    web3?: any;
  }
}
