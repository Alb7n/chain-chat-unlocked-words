
import { ethers } from 'ethers';

// Polygon network configuration
const POLYGON_CONFIG = {
  chainId: 137, // Polygon Mainnet
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://polygon-rpc.com/'],
  blockExplorerUrls: ['https://polygonscan.com/'],
};

const POLYGON_TESTNET_CONFIG = {
  chainId: 80001, // Mumbai Testnet
  chainName: 'Polygon Mumbai',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
  blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
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
  messageRegistry: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
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

  async connectWallet(): Promise<{ address: string; provider: ethers.BrowserProvider }> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask to continue.');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check if we're on the correct network
      const network = await this.provider.getNetwork();
      const targetChainId = this.isTestnet ? POLYGON_TESTNET_CONFIG.chainId : POLYGON_CONFIG.chainId;
      
      if (Number(network.chainId) !== targetChainId) {
        await this.switchToPolygon();
      }

      await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();

      // Initialize contract
      await this.initializeContract();

      this.isInitialized = true;
      console.log('✅ Wallet connected successfully:', address);
      
      return { address, provider: this.provider };
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async initializeContract(): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer not available');
    }

    if (CONTRACT_ADDRESSES.messageRegistry === '0x0000000000000000000000000000000000000000') {
      console.warn('⚠️  Contract address not set. Please deploy the contract and update CONTRACT_ADDRESSES.');
      // Create a placeholder contract for testing
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
      console.log('📊 Contract initialized. Total messages:', totalMessages.toString());
    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
      throw new Error('Failed to initialize smart contract');
    }
  }

  async switchToPolygon(): Promise<void> {
    if (!window.ethereum) throw new Error('MetaMask not detected');

    const config = this.isTestnet ? POLYGON_TESTNET_CONFIG : POLYGON_CONFIG;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${config.chainId.toString(16)}` }],
      });
      console.log('✅ Switched to', config.chainName);
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        console.log('➕ Adding', config.chainName, 'to MetaMask...');
        await window.ethereum.request({
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
        console.log('✅ Network added successfully');
      } else {
        throw switchError;
      }
    }
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

    try {
      console.log('📤 Sending message to blockchain...');
      const messageFee = await this.messageContract.messageFee();
      
      // Estimate gas
      const gasEstimate = await this.messageContract.sendMessage.estimateGas(
        recipient,
        contentHash,
        metadataHash,
        isEncrypted,
        messageType,
        { value: messageFee }
      );

      const tx = await this.messageContract.sendMessage(
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
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Transaction failed'}`);
    }
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

    try {
      console.log('👤 Adding contact to blockchain...');
      
      const gasEstimate = await this.messageContract.addContact.estimateGas(
        contactAddress,
        name,
        ensName,
        avatar
      );

      const tx = await this.messageContract.addContact(
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
    } catch (error) {
      console.error('❌ Error adding contact:', error);
      throw new Error(`Failed to add contact: ${error instanceof Error ? error.message : 'Transaction failed'}`);
    }
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
    
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async getCurrentNetwork(): Promise<{ name: string; chainId: number; currency: string }> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);
    
    return {
      name: chainId === 137 ? 'Polygon Mainnet' : chainId === 80001 ? 'Polygon Mumbai' : 'Unknown Network',
      chainId,
      currency: 'MATIC'
    };
  }

  async getMessageFee(): Promise<string> {
    if (!this.messageContract) throw new Error('Contract not initialized');
    
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
    if (!this.messageContract) {
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

  getExplorerUrl(txHash: string): string {
    const baseUrl = this.isTestnet 
      ? 'https://mumbai.polygonscan.com' 
      : 'https://polygonscan.com';
    return `${baseUrl}/tx/${txHash}`;
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
  }
}
