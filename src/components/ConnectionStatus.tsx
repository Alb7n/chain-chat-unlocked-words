
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  walletAddress: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ walletAddress }) => {
  const isConnected = true; // In a real app, this would check actual connection status

  return (
    <div className="flex items-center justify-between p-2 bg-card border-border rounded-lg">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi size={16} className="text-green-500" />
        ) : (
          <WifiOff size={16} className="text-red-500" />
        )}
        <span className="text-sm text-foreground">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
      </Badge>
    </div>
  );
};

export default ConnectionStatus;
