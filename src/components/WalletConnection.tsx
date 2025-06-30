
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Shield, CheckCircle, AlertCircle } from 'lucide-react';
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

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const { address } = await polygonWeb3Service.connectWallet();
      const userBalance = await polygonWeb3Service.getBalance(address);
      const networkInfo = await polygonWeb3Service.getCurrentNetwork();
      
      setBalance(userBalance);
      setNetwork(networkInfo.name);
      onConnect(address);
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${networkInfo.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-purple-600 dark:text-purple-400" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Polygon Wallet Connected</p>
            <p className="text-xs text-purple-700 dark:text-purple-300">{address}</p>
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
        </div>
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
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Connect to Polygon</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your wallet to Polygon network for low-cost, secure blockchain messaging
          </p>
        </div>
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Shield size={16} className="mr-2" />
              Connect to Polygon
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default WalletConnection;
