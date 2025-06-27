
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WalletConnectionProps {
  onConnect: (address: string) => void;
  isConnected: boolean;
  address?: string;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({ onConnect, isConnected, address }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockAddress = "0x1234...5678";
      onConnect(mockAddress);
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-600" size={20} />
          <div>
            <p className="text-sm font-medium text-green-900">Wallet Connected</p>
            <p className="text-xs text-green-700">{address}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-full">
          <Wallet className="text-blue-600" size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Connect your Web3 wallet to start secure messaging on the blockchain
          </p>
        </div>
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Shield size={16} className="mr-2" />
              Connect MetaMask
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default WalletConnection;
