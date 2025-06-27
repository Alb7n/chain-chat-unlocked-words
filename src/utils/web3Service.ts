
import { ethers } from 'ethers';

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectWallet(): Promise<{ address: string; provider: ethers.BrowserProvider }> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();

      return { address, provider: this.provider };
    } catch (error) {
      throw new Error('Failed to connect wallet');
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized');

    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.parseEther(value),
      data: data || '0x'
    });

    return tx.hash;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized');
    
    return await this.signer.signMessage(message);
  }

  async getCurrentNetwork(): Promise<{ name: string; chainId: number }> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const network = await this.provider.getNetwork();
    return {
      name: network.name,
      chainId: Number(network.chainId)
    };
  }

  async estimateGas(to: string, data: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const gasEstimate = await this.provider.estimateGas({
      to,
      data
    });
    
    return ethers.formatUnits(gasEstimate, 'gwei');
  }
}

export const web3Service = new Web3Service();

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
