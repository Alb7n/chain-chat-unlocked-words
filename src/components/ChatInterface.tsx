import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Shield, User, ArrowLeft, Moon, Sun } from 'lucide-react';
import EnhancedMessageBubble from './EnhancedMessageBubble';
import MediaShare from './MediaShare';
import NotificationCenter from './NotificationCenter';
import AddContact from './AddContact';
import ContactList from './ContactList';
import MessageSearch from './MessageSearch';
import VoiceMessage from './VoiceMessage';
import ConnectionStatus from './ConnectionStatus';
import { ChatLoadingSkeleton } from './LoadingStates';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
  isEncrypted: boolean;
  blockchainStatus: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  mediaHash?: string;
  mediaType?: string;
  fileName?: string;
  reactions?: { emoji: string, count: number, users: string[] }[];
  voiceBlob?: Blob;
  voiceDuration?: number;
}

interface Contact {
  address: string;
  name: string;
  ensName?: string;
  avatar?: string;
  addedAt: Date;
}

interface ChatInterfaceProps {
  walletAddress: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ walletAddress }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Welcome to blockchain messaging! Your messages are end-to-end encrypted and stored on the decentralized network.',
      sender: 'system',
      timestamp: new Date(Date.now() - 300000),
      isOwn: false,
      isEncrypted: true,
      blockchainStatus: 'confirmed',
      transactionHash: '0xabcd1234567890abcdef'
    },
    {
      id: '2',
      content: 'This is amazing! True privacy and ownership of my data.',
      sender: walletAddress,
      timestamp: new Date(Date.now() - 120000),
      isOwn: true,
      isEncrypted: true,
      blockchainStatus: 'confirmed',
      transactionHash: '0x1234567890abcdef'
    }
  ]);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [showContactList, setShowContactList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleContactAdded = (contact: Contact) => {
    setContacts(prev => [...prev, contact]);
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactList(false);
    // Load messages for this contact (in a real app, you'd fetch from blockchain/storage)
    toast({
      title: "Chat Opened",
      description: `Starting conversation with ${contact.name}`,
    });
  };

  const handleReply = (messageId: string) => {
    setReplyToMessage(messageId);
    const messageElement = document.getElementById(`message-${messageId}`);
    messageElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          if (existingReaction.users.includes(walletAddress)) {
            // Remove reaction
            existingReaction.count--;
            existingReaction.users = existingReaction.users.filter(u => u !== walletAddress);
            if (existingReaction.count === 0) {
              return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
            }
          } else {
            // Add reaction
            existingReaction.count++;
            existingReaction.users.push(walletAddress);
          }
        } else {
          // New reaction
          reactions.push({
            emoji,
            count: 1,
            users: [walletAddress]
          });
        }
        
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const handleVoiceMessage = (audioBlob: Blob, duration: number) => {
    const message: Message = {
      id: Date.now().toString(),
      content: 'Voice message',
      sender: walletAddress,
      timestamp: new Date(),
      isOwn: true,
      isEncrypted: true,
      blockchainStatus: 'pending',
      transactionHash: `0x${Math.random().toString(16).substr(2, 16)}`,
      voiceBlob: audioBlob,
      voiceDuration: duration
    };

    setMessages(prev => [...prev, message]);
  };

  const handleSearchResults = (results: Message[]) => {
    setSearchResults(results);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    const recipient = selectedContact?.address || 'general';
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: walletAddress,
      timestamp: new Date(),
      isOwn: true,
      isEncrypted,
      blockchainStatus: 'pending',
      transactionHash: `0x${Math.random().toString(16).substr(2, 16)}`,
      replyTo: replyToMessage || undefined
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setReplyToMessage(null);
    setIsLoading(false);

    toast({
      title: "Message Sent",
      description: selectedContact 
        ? `Encrypted message sent to ${selectedContact.name}` 
        : "Your encrypted message is being processed on the blockchain",
    });

    // Simulate blockchain confirmation
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, blockchainStatus: 'confirmed' as const }
            : msg
        )
      );
      
      toast({
        title: "Message Confirmed",
        description: "Your message has been confirmed on the blockchain",
      });
    }, 3000);
  };

  const handleMediaShare = (mediaHash: string, mediaType: string, fileName: string) => {
    const message: Message = {
      id: Date.now().toString(),
      content: `Shared ${mediaType}: ${fileName}`,
      sender: walletAddress,
      timestamp: new Date(),
      isOwn: true,
      isEncrypted: true,
      blockchainStatus: 'pending',
      transactionHash: `0x${Math.random().toString(16).substr(2, 16)}`,
      mediaHash,
      mediaType,
      fileName
    };

    setMessages(prev => [...prev, message]);

    // Simulate blockchain confirmation
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, blockchainStatus: 'confirmed' as const }
            : msg
        )
      );
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (showContactList) {
    return (
      <div className="flex flex-col h-full">
        {/* Contact List Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContactList(false)}
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Contacts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <AddContact 
              onContactAdded={handleContactAdded}
              existingContacts={contacts}
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 p-4">
          <ContactList
            contacts={contacts}
            onContactSelect={handleContactSelect}
            selectedContact={selectedContact}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <User size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {selectedContact ? selectedContact.name : 'Blockchain Chat'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Shield size={12} className="text-green-500" />
                {selectedContact ? (
                  <>
                    {selectedContact.ensName || `${selectedContact.address.slice(0, 6)}...${selectedContact.address.slice(-4)}`}
                  </>
                ) : (
                  'End-to-end encrypted'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <NotificationCenter />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowContactList(true)}
            >
              <User size={16} className="mr-1" />
              Contacts ({contacts.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <MessageSearch
        messages={messages}
        onSearchResults={handleSearchResults}
        onClearSearch={handleClearSearch}
      />

      {/* Connection Status */}
      <div className="px-4 py-2">
        <ConnectionStatus walletAddress={walletAddress} />
      </div>

      {/* Messages */}
      {isLoading ? (
        <ChatLoadingSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {(isSearching ? searchResults : messages).map((message) => (
            <div key={message.id} id={`message-${message.id}`}>
              <EnhancedMessageBubble 
                message={message} 
                currentUser={walletAddress}
                onReply={handleReply}
                onReact={handleReact}
                referencedMessage={replyToMessage ? messages.find(m => m.id === replyToMessage) : undefined}
              />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Reply Preview */}
      {replyToMessage && (
        <div className="mx-4 p-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Replying to: {messages.find(m => m.id === replyToMessage)?.content}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessage(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <Card className="m-4 p-4 dark:bg-gray-800">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MediaShare onMediaShare={handleMediaShare} />
            <VoiceMessage onVoiceMessage={handleVoiceMessage} />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  selectedContact 
                    ? `Message ${selectedContact.name}...`
                    : "Type your encrypted message..."
                }
                className="flex-1 dark:bg-gray-700 dark:border-gray-600"
              />
              <Button
                onClick={() => setIsEncrypted(!isEncrypted)}
                variant={isEncrypted ? "default" : "outline"}
                size="sm"
                className="shrink-0"
              >
                <Shield size={16} className={isEncrypted ? "text-white" : "text-gray-600 dark:text-gray-400"} />
              </Button>
            </div>
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {isEncrypted ? "🔒 Messages are encrypted" : "⚠️ Encryption disabled"} • 
          Gas fee: ~0.001 ETH
          {selectedContact && (
            <> • Sending to {selectedContact.name}</>
          )}
        </p>
      </Card>
    </div>
  );
};

export default ChatInterface;
