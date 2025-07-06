
import React, { useState } from 'react';
import { Shield, Clock, CheckCircle, AlertCircle, Reply, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MessageReactions from './MessageReactions';
import { Message } from '@/types/message';

interface EnhancedMessageBubbleProps {
  message: Message;
  currentUser: string;
  onReply: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  referencedMessage?: Message;
}

const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({ 
  message, 
  currentUser,
  onReply,
  onReact,
  referencedMessage
}) => {
  const [showActions, setShowActions] = useState(false);

  const getStatusIcon = () => {
    switch (message.blockchainStatus) {
      case 'pending':
        return <Clock size={12} className="text-yellow-500 animate-spin" />;
      case 'confirmed':
        return <CheckCircle size={12} className="text-green-500" />;
      case 'failed':
        return <AlertCircle size={12} className="text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (message.blockchainStatus) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20';
      case 'confirmed':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
    }
  };

  return (
    <div className={cn(
      "flex mb-4 group",
      message.isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md relative",
        message.isOwn ? "ml-12" : "mr-12"
      )}>
        {/* Reply Reference */}
        {message.replyTo && referencedMessage && (
          <div className={cn(
            "mb-1 p-2 rounded-lg border-l-4 text-xs opacity-70",
            message.isOwn 
              ? "border-l-blue-400 bg-blue-50 dark:bg-blue-900/20" 
              : "border-l-gray-400 bg-gray-50 dark:bg-gray-800"
          )}>
            <p className="font-medium">Replying to {referencedMessage.sender}</p>
            <p className="truncate">{referencedMessage.content}</p>
          </div>
        )}

        {/* Main Message */}
        <div 
          className={cn(
            "px-4 py-2 rounded-2xl relative",
            message.isOwn 
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm" 
              : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm"
          )}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Voice Message */}
          {message.voiceBlob && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              </div>
              <span className="text-sm">
                Voice message • {Math.floor((message.voiceDuration || 0) / 60)}:
                {String((message.voiceDuration || 0) % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Text Content */}
          <div className="flex items-start gap-2 mb-1">
            <p className="text-sm break-words flex-1">{message.content}</p>
            {message.isEncrypted && (
              <Shield size={12} className={message.isOwn ? "text-blue-200" : "text-gray-500"} />
            )}
          </div>
          
          {/* Metadata */}
          <div className="flex items-center justify-between text-xs mt-2">
            <span className={message.isOwn ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className={message.isOwn ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}>
                {message.blockchainStatus}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className={cn(
              "absolute top-0 flex gap-1",
              message.isOwn ? "-left-20" : "-right-20"
            )}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white dark:bg-gray-800 shadow-md"
                onClick={() => onReply(message.id)}
              >
                <Reply size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white dark:bg-gray-800 shadow-md"
              >
                <MoreVertical size={12} />
              </Button>
            </div>
          )}
        </div>

        {/* Reactions */}
        <MessageReactions
          messageId={message.id}
          reactions={message.reactions}
          onReact={onReact}
          currentUser={currentUser}
        />

        {/* Transaction Link */}
        {message.transactionHash && (
          <div className={cn(
            "mt-1 px-2 py-1 rounded text-xs border w-fit",
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

export default EnhancedMessageBubble;
