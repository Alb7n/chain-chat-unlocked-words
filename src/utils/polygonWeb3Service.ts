
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

// Contract ABI (simplified for demo)
const MESSAGE_REGISTRY_ABI = [
  "function sendMessage(address recipient, string contentHash, string metadataHash, bool isEncrypted) payable",
  "function addContact(address contactAddress, string name, string ensName)",
  "function getUserMessages(address user) view returns (bytes32[])",
  "function getUserContacts(address user) view returns (address[])",
  "function getMessage(bytes32 messageId) view returns (tuple(string contentHash, address sender, address recipient, uint256 timestamp, uint256 blockNumber, bool isEncrypted, string metadataHash))",
  "function getContact(address user, address contactAddress) view returns (tuple(address contactAddress, string name, string ensName, uint256 addedAt, bool isActive))",
  "function messageFee() view returns (uint256)",
  "event MessageSent(bytes32 indexed messageId, address indexed sender, address indexed recipient, string contentHash, uint256 timestamp)",
  "event ContactAdded(address indexed user, address indexed contact, string name, uint256 timestamp)"
];

// Contract addresses (to be deployed)
const CONTRACT_ADDRESSES = {
  messageRegistry: '0x0000000000000000000000000000000000000000', // Replace with actual deployed address
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
  transactionHash: string;
}

export interface BlockchainContact {
  address: string;
  name: string;
  ensName: string;
  addedAt: number;
  isActive: boolean;
}

export class PolygonWeb3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private messageContract: ethers.Contract | null = null;
  private isTestnet: boolean = true; // Switch to false for mainnet

  async connectWallet(): Promise<{ address: string; provider: ethers.BrowserProvider }> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
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
      this.messageContract = new ethers.Contract(
        CONTRACT_ADDRESSES.messageRegistry,
        MESSAGE_REGISTRY_ABI,
        this.signer
      );

      return { address, provider: this.provider };
    } catch (error) {
      throw new Error('Failed to connect wallet');
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
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
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
      } else {
        throw switchError;
      }
    }
  }

  async sendMessage(
    recipient: string,
    contentHash: string,
    metadataHash: string = '',
    isEncrypted: boolean = true
  ): Promise<string> {
    if (!this.messageContract || !this.signer) {
      throw new Error('Contract not initialized');
    }

    try {
      const messageFee = await this.messageContract.messageFee();
      
      const tx = await this.messageContract.sendMessage(
        recipient,
        contentHash,
        metadataHash,
        isEncrypted,
        { value: messageFee }
      );

      return tx.hash;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async addContact(
    contactAddress: string,
    name: string,
    ensName: string = ''
  ): Promise<string> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.messageContract.addContact(contactAddress, name, ensName);
      return tx.hash;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw new Error('Failed to add contact');
    }
  }

  async getUserMessages(userAddress: string): Promise<BlockchainMessage[]> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const messageIds = await this.messageContract.getUserMessages(userAddress);
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
          transactionHash: messageId, // Using messageId as transaction reference
        });
      }

      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async getUserContacts(userAddress: string): Promise<BlockchainContact[]> {
    if (!this.messageContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const contactAddresses = await this.messageContract.getUserContacts(userAddress);
      const contacts: BlockchainContact[] = [];

      for (const contactAddress of contactAddresses) {
        const contact = await this.messageContract.getContact(userAddress, contactAddress);
        contacts.push({
          address: contact.contactAddress,
          name: contact.name,
          ensName: contact.ensName,
          addedAt: Number(contact.addedAt),
          isActive: contact.isActive,
        });
      }

      return contacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
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
      name: chainId === 137 ? 'Polygon Mainnet' : chainId === 80001 ? 'Polygon Mumbai' : 'Unknown',
      chainId,
      currency: 'MATIC'
    };
  }

  async getMessageFee(): Promise<string> {
    if (!this.messageContract) throw new Error('Contract not initialized');
    
    const fee = await this.messageContract.messageFee();
    return ethers.formatEther(fee);
  }
}

export const polygonWeb3Service = new PolygonWeb3Service();

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
