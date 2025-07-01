
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Shield, CheckCircle, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { polygonWeb3Service } from '@/utils/polygonWeb3Service';

interface WalletConnectionProps {
  onConnect: (address: string) => void;
  isConnected: boolean;
  address?: string;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({ onConnect, isConnected, address }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string>('');
  const [network, setNetwork] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string>('');
  const [contractStats, setContractStats] = useState<{
    totalMessages: number;
    contractBalance: string;
    isContractDeployed: boolean;
  }>({ totalMessages: 0, contractBalance: '0', isContractDeployed: false });

  useEffect(() => {
    if (isConnected && address) {
      loadWalletData();
      // Set up periodic connection checks
      const interval = setInterval(checkConnectionStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  const checkConnectionStatus = async () => {
    if (!isConnected) return;
    
    try {
      const isStillConnected = await polygonWeb3Service.checkConnection();
      if (!isStillConnected) {
        toast({
          title: "Connection Lost",
          description: "Wallet connection was lost. Please reconnect.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.warn('Connection status check failed:', error);
    }
  };

  const loadWalletData = async () => {
    if (!address) return;
    
    try {
      const [userBalance, networkInfo, stats] = await Promise.all([
        polygonWeb3Service.getBalance(address),
        polygonWeb3Service.getCurrentNetwork(),
        polygonWeb3Service.getContractStats()
      ]);
      
      setBalance(userBalance);
      setNetwork(networkInfo.name);
      setContractStats(stats);
      setConnectionError('');
    } catch (error) {
      console.warn('⚠️  Could not load wallet data:', error);
      setConnectionError('Failed to load wallet data');
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setConnectionError('');
    
    try {
      console.log('🔄 Starting wallet connection...');
      
      // Check if wallet is available
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const { address } = await polygonWeb3Service.connectWallet();
      
      // Load wallet data
      const [userBalance, networkInfo, stats] = await Promise.all([
        polygonWeb3Service.getBalance(address),
        polygonWeb3Service.getCurrentNetwork(),
        polygonWeb3Service.getContractStats()
      ]);
      
      setBalance(userBalance);
      setNetwork(networkInfo.name);
      setContractStats(stats);
      onConnect(address);
      
      toast({
        title: "Wallet Connected Successfully",
        description: `Connected to ${networkInfo.name}`,
      });

      // Show contract deployment status
      if (!stats.isContractDeployed) {
        toast({
          title: "Contract Not Deployed",
          description: "Smart contract needs to be deployed for full functionality. Some features will be limited.",
          variant: "destructive",
        });
      }
      
      console.log('✅ Wallet connected successfully');
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setConnectionError(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Provide specific guidance based on error type
      if (errorMessage.includes('MetaMask')) {
        setTimeout(() => {
          toast({
            title: "Install MetaMask",
            description: "Visit metamask.io to install MetaMask browser extension",
            action: (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://metamask.io', '_blank')}
              >
                <ExternalLink size={14} className="mr-1" />
                Get MetaMask
              </Button>
            ),
          });
        }, 2000);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const retryConnection = async () => {
    setConnectionError('');
    await connectWallet();
  };

  if (isConnected) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-purple-600 dark:text-purple-400" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Polygon Wallet Connected
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
            {balance && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Balance: {parseFloat(balance).toFixed(4)} MATIC
              </p>
            )}
            {network && (
              <p className="text-xs text-purple-500 dark:text-purple-500">
                Network: {network}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadWalletData}
            className="p-2"
            title="Refresh wallet data"
          >
            <RefreshCw size={14} />
          </Button>
        </div>
        
        {/* Contract Status */}
        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-700 dark:text-purple-300">
              Contract Status:
            </span>
            <div className="flex items-center gap-1">
              {contractStats.isContractDeployed ? (
                <>
                  <CheckCircle size={12} className="text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Deployed</span>
                </>
              ) : (
                <>
                  <AlertCircle size={12} className="text-yellow-500" />
                  <span className="text-yellow-600 dark:text-yellow-400">Not Deployed</span>
                </>
              )}
            </div>
          </div>
          
          {contractStats.isContractDeployed ? (
            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
              <div className="flex justify-between">
                <span>Total Messages:</span>
                <span>{contractStats.totalMessages}</span>
              </div>
              <div className="flex justify-between">
                <span>Contract Balance:</span>
                <span>{parseFloat(contractStats.contractBalance).toFixed(4)} MATIC</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              <p>Deploy the smart contract to enable messaging features</p>
            </div>
          )}
        </div>

        {connectionError && (
          <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={12} />
              <span>{connectionError}</span>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-purple-200 dark:border-purple-800">
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
          <Wallet className="text-purple-600 dark:text-purple-400" size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Connect to Polygon Blockchain
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your wallet to Polygon network for secure, decentralized messaging
          </p>
        </div>

        {connectionError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Connection Failed</p>
                <p className="text-xs mt-1">{connectionError}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={retryConnection}
              className="mt-2 w-full"
            >
              <RefreshCw size={14} className="mr-2" />
              Try Again
            </Button>
          </div>
        )}
        
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-w-[160px]"
        >
          {isConnecting ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Shield size={16} className="mr-2" />
              Connect to Polygon
            </>
          )}
        </Button>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p className="mb-1">✓ Low transaction fees with MATIC</p>
          <p className="mb-1">✓ Fast blockchain confirmation</p>
          <p className="mb-1">✓ Ethereum-compatible security</p>
          <p className="text-blue-600 dark:text-blue-400 mt-2">
            Need MetaMask? <button 
              onClick={() => window.open('https://metamask.io', '_blank')}
              className="underline hover:no-underline"
            >
              Install here
            </button>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default WalletConnection;
