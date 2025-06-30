
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Zap, Shield, Globe } from 'lucide-react';
import { polygonWeb3Service } from '@/utils/polygonWeb3Service';

const BlockchainStatus: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    name: string;
    chainId: number;
    currency: string;
  } | null>(null);
  const [messageFee, setMessageFee] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const info = await polygonWeb3Service.getCurrentNetwork();
        setNetworkInfo(info);
        
        const fee = await polygonWeb3Service.getMessageFee();
        setMessageFee(fee);
        setIsOnline(true);
      } catch (error) {
        console.log('Network info not available yet');
        setIsOnline(false);
      }
    };

    fetchNetworkInfo();
    const interval = setInterval(fetchNetworkInfo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Activity size={16} className="text-purple-600 dark:text-purple-400" />
          Polygon Status
        </h4>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-xs font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center gap-1">
          <Zap size={16} className="text-yellow-500 dark:text-yellow-400" />
          <span className="text-xs text-muted-foreground">Message Fee</span>
          <span className="text-sm font-semibold text-foreground">
            {messageFee ? `${parseFloat(messageFee).toFixed(4)} MATIC` : '~0.001 MATIC'}
          </span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <Shield size={16} className="text-green-500 dark:text-green-400" />
          <span className="text-xs text-muted-foreground">Security</span>
          <span className="text-sm font-semibold text-foreground">High</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <Globe size={16} className="text-purple-500 dark:text-purple-400" />
          <span className="text-xs text-muted-foreground">Network</span>
          <span className="text-sm font-semibold text-foreground">
            {networkInfo ? networkInfo.name.replace('Polygon ', '') : 'Polygon'}
          </span>
        </div>
      </div>
      
      {networkInfo && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Chain ID: {networkInfo.chainId}</span>
            <span>Currency: {networkInfo.currency}</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BlockchainStatus;
