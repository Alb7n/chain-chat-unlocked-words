
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Zap, Shield, Globe, Database, AlertCircle } from 'lucide-react';
import { polygonWeb3Service } from '@/utils/polygonWeb3Service';

const BlockchainStatus: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    name: string;
    chainId: number;
    currency: string;
  } | null>(null);
  const [messageFee, setMessageFee] = useState<string>('');
  const [contractStats, setContractStats] = useState<{
    totalMessages: number;
    contractBalance: string;
    isContractDeployed: boolean;
  }>({ totalMessages: 0, contractBalance: '0', isContractDeployed: false });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    fetchNetworkInfo();
    const interval = setInterval(fetchNetworkInfo, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      if (polygonWeb3Service.isConnected()) {
        const [info, fee, stats] = await Promise.all([
          polygonWeb3Service.getCurrentNetwork(),
          polygonWeb3Service.getMessageFee(),
          polygonWeb3Service.getContractStats()
        ]);
        
        setNetworkInfo(info);
        setMessageFee(fee);
        setContractStats(stats);
        setIsOnline(true);
      } else {
        // Set default values when not connected
        setNetworkInfo({
          name: 'Polygon Mumbai',
          chainId: 80001,
          currency: 'MATIC'
        });
        setMessageFee('0.001');
        setContractStats({
          totalMessages: 0,
          contractBalance: '0',
          isContractDeployed: false
        });
        setIsOnline(false);
      }
    } catch (error) {
      console.log('⚠️  Network info not available:', error);
      setIsOnline(false);
    }
  };

  const getExplorerUrl = () => {
    const contractAddress = polygonWeb3Service.getContractAddress();
    if (contractAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    const baseUrl = networkInfo?.chainId === 137 
      ? 'https://polygonscan.com' 
      : 'https://mumbai.polygonscan.com';
    return `${baseUrl}/address/${contractAddress}`;
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Activity size={16} className="text-purple-600 dark:text-purple-400" />
          Blockchain Status
        </h4>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-xs font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isOnline ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center mb-3">
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
            {networkInfo ? networkInfo.name.replace('Polygon ', '') : 'Mumbai'}
          </span>
        </div>
      </div>
      
      {/* Contract Information */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-blue-500 dark:text-blue-400" />
            <span className="text-xs font-medium text-foreground">Smart Contract</span>
          </div>
          <div className="flex items-center gap-1">
            {contractStats.isContractDeployed ? (
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            ) : (
              <AlertCircle size={12} className="text-yellow-500" />
            )}
            <span className={`text-xs ${contractStats.isContractDeployed ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {contractStats.isContractDeployed ? 'Deployed' : 'Not Deployed'}
            </span>
          </div>
        </div>
        
        {contractStats.isContractDeployed && (
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Messages:</span>
              <span className="font-medium">{contractStats.totalMessages}</span>
            </div>
            <div className="flex justify-between">
              <span>Balance:</span>
              <span className="font-medium">{parseFloat(contractStats.contractBalance).toFixed(4)} MATIC</span>
            </div>
          </div>
        )}
        
        {!contractStats.isContractDeployed && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Deploy the smart contract to enable full functionality
          </p>
        )}
      </div>
      
      {networkInfo && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Chain ID: {networkInfo.chainId}</span>
            <span>Currency: {networkInfo.currency}</span>
          </div>
          {getExplorerUrl() && (
            <div className="mt-1">
              <a 
                href={getExplorerUrl()!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Contract on Explorer ↗
              </a>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default BlockchainStatus;
