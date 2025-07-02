import { ethers } from 'ethers';

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

// Updated Contract ABI - Complete interface
const MESSAGE_REGISTRY_ABI = [
  "function sendMessage(address recipient, string contentHash, string metadataHash, bool isEncrypted, uint256 messageType) payable",
  "function addContact(address contactAddress, string name, string ensName, string avatar)",
  "function reactToMessage(bytes32 messageId, string emoji, bool add)",
  "function getUserMessages(address user) view returns (bytes32[])",
  "function getUserContacts(address user) view returns (address[])",
  "function getMessage(bytes32 messageId) view returns (tuple(string contentHash, address sender, address recipient, uint256 timestamp, uint256 blockNumber, bool isEncrypted, string metadataHash, uint256 messageType))",
  "function getContact(address user, address contactAddress) view returns (tuple(address contactAddress, string name, string ensName, uint256 addedAt, bool isActive, string avatar))",
  "function getMessageReactions(bytes32 messageId, string emoji) view returns (uint256)",
  "function getConversation(address user1, address user2) view returns (bytes32[])",
  "function messageFee() view returns (uint256)",
  "function getTotalMessages() view returns (uint256)",
  "function getContractBalance() view returns (uint256)",
  "event MessageSent(bytes32 indexed messageId, address indexed sender, address indexed recipient, string contentHash, uint256 timestamp, uint256 messageType)",
  "event ContactAdded(address indexed user, address indexed contact, string name, uint256 timestamp)",
  "event MessageReaction(bytes32 indexed messageId, address indexed user, string emoji, bool added)"
];

// Contract addresses - UPDATE THESE AFTER DEPLOYMENT
const CONTRACT_ADDRESSES = {
  // Replace with actual deployed address after running deploy script
  messageRegistry: '0x22ee4beEc4eDeA96C95dA7805ffdAA66b13Bb146',
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
      console.log('✅ Contract initialized. Total messages:', totalMessages.toString());
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

  async sendMessage(
    recipient: string,
    contentHash: string,
    metadataHash: string = '',
    isEncrypted: boolean = true,
    messageType: number = 0
  ): Promise<string> {
    if (!this.messageContract || !this.signer) {
      throw new Error('Contract not initialized. Please connect your wallet first.');
    }

    if (CONTRACT_ADDRESSES.messageRegistry === '0x0000000000000000000000000000000000000000') {
      throw new Error('Smart contract not deployed. Please deploy the contract first.');
    }

    return this.withRetry(async () => {
      console.log('📤 Sending message to blockchain...');
      const messageFee = await this.messageContract!.messageFee();
      
      // Estimate gas
      const gasEstimate = await this.messageContract!.sendMessage.estimateGas(
        recipient,
        contentHash,
        metadataHash,
        isEncrypted,
        messageType,
        { value: messageFee }
      );

      const tx = await this.messageContract!.sendMessage(
        recipient,
        contentHash,
        metadataHash,
        isEncrypted,
        messageType,
        { 
          value: messageFee,
          gasLimit: gasEstimate + BigInt(10000) // Add buffer
        }
      );

      console.log('⏳ Transaction submitted:', tx.hash);
      await tx.wait();
      console.log('✅ Message sent successfully');
      
      return tx.hash;
    }, 'Send Message');
  }

  async addContact(
    contactAddress: string,
    name: string,
    ensName: string = '',
    avatar: string = ''
  ): Promise<string> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    if (CONTRACT_ADDRESSES.messageRegistry === '0x0000000000000000000000000000000000000000') {
      throw new Error('Smart contract not deployed. Please deploy the contract first.');
    }

    return this.withRetry(async () => {
      console.log('👤 Adding contact to blockchain...');
      
      const gasEstimate = await this.messageContract!.addContact.estimateGas(
        contactAddress,
        name,
        ensName,
        avatar
      );

      const tx = await this.messageContract!.addContact(
        contactAddress, 
        name, 
        ensName, 
        avatar,
        { gasLimit: gasEstimate + BigInt(5000) }
      );
      
      console.log('⏳ Transaction submitted:', tx.hash);
      await tx.wait();
      console.log('✅ Contact added successfully');
      
      return tx.hash;
    }, 'Add Contact');
  }

  async reactToMessage(messageId: string, emoji: string, add: boolean = true): Promise<string> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.messageContract.reactToMessage(messageId, emoji, add);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('❌ Error reacting to message:', error);
      throw new Error('Failed to react to message');
    }
  }

  async getUserMessages(userAddress: string): Promise<BlockchainMessage[]> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('📥 Fetching messages for:', userAddress);
      const messageIds = await this.messageContract.getUserMessages(userAddress);
      const messages: BlockchainMessage[] = [];

      for (const messageId of messageIds) {
        try {
          const message = await this.messageContract.getMessage(messageId);
          messages.push({
            id: messageId,
            contentHash: message.contentHash,
            sender: message.sender,
            recipient: message.recipient,
            timestamp: Number(message.timestamp),
            blockNumber: Number(message.blockNumber),
            isEncrypted: message.isEncrypted,
            metadataHash: message.metadataHash,
            messageType: Number(message.messageType),
            transactionHash: messageId,
          });
        } catch (msgError) {
          console.warn('⚠️  Failed to fetch message:', messageId, msgError);
        }
      }

      console.log('✅ Fetched', messages.length, 'messages');
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      return [];
    }
  }

  async getUserContacts(userAddress: string): Promise<BlockchainContact[]> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('👥 Fetching contacts for:', userAddress);
      const contactAddresses = await this.messageContract.getUserContacts(userAddress);
      const contacts: BlockchainContact[] = [];

      for (const contactAddress of contactAddresses) {
        try {
          const contact = await this.messageContract.getContact(userAddress, contactAddress);
          contacts.push({
            address: contact.contactAddress,
            name: contact.name,
            ensName: contact.ensName,
            addedAt: Number(contact.addedAt),
            isActive: contact.isActive,
            avatar: contact.avatar,
          });
        } catch (contactError) {
          console.warn('⚠️  Failed to fetch contact:', contactAddress, contactError);
        }
      }

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
      const messageIds = await this.messageContract.getConversation(user1, user2);
      const messages: BlockchainMessage[] = [];

      for (const messageId of messageIds) {
        const message = await this.messageContract.getMessage(messageId);
        messages.push({
          id: messageId,
          contentHash: message.contentHash,
          sender: message.sender,
          recipient: message.recipient,
          timestamp: Number(message.timestamp),
          blockNumber: Number(message.blockNumber),
          isEncrypted: message.isEncrypted,
          metadataHash: message.metadataHash,
          messageType: Number(message.messageType),
          transactionHash: messageId,
        });
      }

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
    if (!this.messageContract || CONTRACT_ADDRESSES.messageRegistry === '0x0000000000000000000000000000000000000000') {
      return '0.001'; // Default fee when contract not deployed
    }
    
    try {
      const fee = await this.messageContract.messageFee();
      return ethers.formatEther(fee);
    } catch (error) {
      console.warn('⚠️  Could not fetch message fee, using default');
      return '0.001'; // Default fee
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
