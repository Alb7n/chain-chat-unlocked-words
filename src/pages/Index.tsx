import React, { useState } from 'react';
import WalletConnection from '@/components/WalletConnection';
import ChatInterface from '@/components/ChatInterface';
import BlockchainStatus from '@/components/BlockchainStatus';
import DIDProfile from '@/components/DIDProfile';
import { Card } from '@/components/ui/card';
import { MessageCircle, Shield, Zap } from 'lucide-react';

const Index = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
    setIsWalletConnected(true);
  };

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <MessageCircle size={32} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              BlockChat
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The future of secure messaging. End-to-end encrypted, blockchain-powered, 
              and completely decentralized communication.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center bg-white/70 backdrop-blur border-blue-200">
              <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                <Shield size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">End-to-End Encrypted</h3>
              <p className="text-sm text-gray-600">
                Your messages are encrypted client-side using military-grade encryption
              </p>
            </Card>

            <Card className="p-6 text-center bg-white/70 backdrop-blur border-purple-200">
              <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                <Zap size={24} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Blockchain Powered</h3>
              <p className="text-sm text-gray-600">
                Messages are secured and verified on the Ethereum blockchain
              </p>
            </Card>

            <Card className="p-6 text-center bg-white/70 backdrop-blur border-pink-200">
              <div className="p-3 bg-pink-100 rounded-full w-fit mx-auto mb-4">
                <MessageCircle size={24} className="text-pink-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Truly Decentralized</h3>
              <p className="text-sm text-gray-600">
                No central servers, no data harvesting, complete digital sovereignty
              </p>
            </Card>
          </div>

          {/* Wallet Connection */}
          <div className="max-w-md mx-auto">
            <WalletConnection 
              onConnect={handleWalletConnect}
              isConnected={isWalletConnected}
              address={walletAddress}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="grid lg:grid-cols-4 gap-6 h-screen max-h-screen">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <WalletConnection 
              onConnect={handleWalletConnect}
              isConnected={isWalletConnected}
              address={walletAddress}
            />
            <DIDProfile walletAddress={walletAddress} />
            <BlockchainStatus />
          </div>

          {/* Main Chat */}
          <div className="lg:col-span-3">
            <Card className="h-full bg-white shadow-lg">
              <ChatInterface walletAddress={walletAddress} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
