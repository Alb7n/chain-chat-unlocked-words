
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ConnectionStatusProps {
  walletAddress?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ walletAddress }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [blockchainConnected, setBlockchainConnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (walletAddress && isOnline) {
      // Simulate blockchain connection check
      const timer = setTimeout(() => {
        setBlockchainConnected(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setBlockchainConnected(false);
    }
  }, [walletAddress, isOnline]);

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (blockchainConnected) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (blockchainConnected) return 'Connected';
    return 'Connecting...';
  };

  return (
    <Card className="p-3 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi size={14} className={getStatusColor()} />
          ) : (
            <WifiOff size={14} className="text-red-500" />
          )}
          <span className={getStatusColor()}>{getStatusText()}</span>
        </div>
        {blockchainConnected && (
          <div className="flex items-center gap-1 ml-2">
            <Activity size={14} className="text-blue-500" />
            <span className="text-blue-500 text-xs">Ethereum</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ConnectionStatus;
