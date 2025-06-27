
import React from 'react';
import { Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
  isEncrypted: boolean;
  blockchainStatus: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const getStatusIcon = () => {
    switch (message.blockchainStatus) {
      case 'pending':
        return <Clock size={12} className="text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle size={12} className="text-green-500" />;
      case 'failed':
        return <AlertCircle size={12} className="text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (message.blockchainStatus) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'confirmed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className={cn(
      "flex mb-4",
      message.isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative",
        message.isOwn 
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm" 
          : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm"
      )}>
        <div className="flex items-start gap-2 mb-1">
          <p className="text-sm break-words flex-1">{message.content}</p>
          {message.isEncrypted && (
            <Shield size={12} className={message.isOwn ? "text-blue-200" : "text-gray-500"} />
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs mt-2">
          <span className={message.isOwn ? "text-blue-200" : "text-gray-500"}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className={message.isOwn ? "text-blue-200" : "text-gray-500"}>
              {message.blockchainStatus}
            </span>
          </div>
        </div>
        
        {message.transactionHash && (
          <div className={cn(
            "absolute -bottom-6 right-0 px-2 py-1 rounded text-xs border",
            getStatusColor()
          )}>
            <a 
              href={`https://etherscan.io/tx/${message.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              View on Explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
