
import React from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Zap, Shield, Globe } from 'lucide-react';

const BlockchainStatus: React.FC = () => {
  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/40 dark:to-blue-950/40 border-border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Activity size={16} className="text-purple-600 dark:text-purple-400" />
          Network Status
        </h4>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center gap-1">
          <Zap size={16} className="text-yellow-500 dark:text-yellow-400" />
          <span className="text-xs text-muted-foreground">Gas Price</span>
          <span className="text-sm font-semibold text-foreground">12 gwei</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <Shield size={16} className="text-green-500 dark:text-green-400" />
          <span className="text-xs text-muted-foreground">Messages</span>
          <span className="text-sm font-semibold text-foreground">1,247</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <Globe size={16} className="text-blue-500 dark:text-blue-400" />
          <span className="text-xs text-muted-foreground">Network</span>
          <span className="text-sm font-semibold text-foreground">Ethereum</span>
        </div>
      </div>
    </Card>
  );
};

export default BlockchainStatus;
