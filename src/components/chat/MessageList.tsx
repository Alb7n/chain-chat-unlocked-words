import React from 'react';
import EnhancedMessageBubble from '@/components/EnhancedMessageBubble';
import { Message } from '@/types/message';

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  onReply: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  referencedMessage?: Message;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  onReply,
  onReact,
  referencedMessage,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
      {messages.map((message) => (
        <div key={`${message.id}-${message.timestamp}`} id={`message-${message.id}`}>
          <EnhancedMessageBubble 
            message={message} 
            currentUser={currentUser}
            onReply={onReply}
            onReact={onReact}
            referencedMessage={referencedMessage}
          />
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;