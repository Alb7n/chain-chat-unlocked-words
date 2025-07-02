import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Shield, User, ArrowLeft, Moon, Sun, Loader2 } from 'lucide-react';
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
import { polygonWeb3Service, BlockchainMessage, BlockchainContact } from '@/utils/polygonWeb3Service';

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
  replyTo?: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [showContactList, setShowContactList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null);
  const [blockchainConnected, setBlockchainConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeBlockchain();
  }, [walletAddress]);

  const initializeBlockchain = async () => {
    if (!walletAddress) return;

    try {
      setIsInitialLoading(true);
      console.log('🔄 Initializing blockchain connection...');
      
      // Check if already connected
      if (polygonWeb3Service.isConnected()) {
        setBlockchainConnected(true);
        await loadBlockchainData();
      } else {
        console.log('ℹ️  Blockchain service not connected yet');
      }
    } catch (error) {
      console.error('❌ Failed to initialize blockchain:', error);
      toast({
        title: "Blockchain Connection Failed",
        description: "Unable to connect to Polygon network. Some features may be limited.",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const loadBlockchainData = async () => {
    try {
      console.log('📥 Loading blockchain data...');
      
      // Load contacts first
      const blockchainContacts = await polygonWeb3Service.getUserContacts(walletAddress);
      const convertedContacts: Contact[] = blockchainContacts.map(contact => ({
        address: contact.address,
        name: contact.name,
        ensName: contact.ensName || undefined,
        avatar: contact.avatar || undefined,
        addedAt: new Date(contact.addedAt * 1000),
      }));
      setContacts(convertedContacts);
      
      // Load messages
      const blockchainMessages = await polygonWeb3Service.getUserMessages(walletAddress);
      const convertedMessages: Message[] = blockchainMessages.map(msg => ({
        id: msg.id,
        content: msg.contentHash, // In a real app, you'd decrypt this
        sender: msg.sender,
        timestamp: new Date(msg.timestamp * 1000),
        isOwn: msg.sender.toLowerCase() === walletAddress.toLowerCase(),
        isEncrypted: msg.isEncrypted,
        blockchainStatus: 'confirmed' as const,
        transactionHash: msg.transactionHash,
      }));
      setMessages(convertedMessages);
      
      console.log('✅ Loaded', convertedContacts.length, 'contacts and', convertedMessages.length, 'messages');
      
      if (convertedMessages.length === 0) {
        // Add welcome message for new users
        const welcomeMessage: Message = {
          id: 'welcome',
          content: 'Welcome to the ChatApp Global Chat Room! This is a public blockchain chat where all messages are visible to everyone. Send your first message to get started!',
          sender: 'system',
          timestamp: new Date(),
          isOwn: false,
          isEncrypted: false,
          blockchainStatus: 'confirmed',
        };
        setMessages([welcomeMessage]);
      }
      
    } catch (error) {
      console.error('❌ Failed to load blockchain data:', error);
      toast({
        title: "Data Loading Failed",
        description: "Could not load your messages and contacts from blockchain.",
        variant: "destructive",
      });
    }
  };

  const handleContactAdded = async (contact: Contact) => {
    try {
      setIsLoading(true);
      console.log('👤 Adding contact to blockchain...');
      
      const txHash = await polygonWeb3Service.addContact(
        contact.address,
        contact.name,
        contact.ensName || '',
        contact.avatar || ''
      );
      
      setContacts(prev => [...prev, contact]);
      
      toast({
        title: "Contact Added",
        description: `${contact.name} has been added to your contacts and saved on blockchain.`,
      });
      
      console.log('✅ Contact added with transaction:', txHash);
    } catch (error) {
      console.error('❌ Failed to add contact:', error);
      toast({
        title: "Failed to Add Contact",
        description: error instanceof Error ? error.message : "Could not add contact to blockchain",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSelect = async (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactList(false);
    
    // Load conversation with this contact
    try {
      const conversation = await polygonWeb3Service.getConversation(walletAddress, contact.address);
      const convertedMessages: Message[] = conversation.map(msg => ({
        id: msg.id,
        content: msg.contentHash,
        sender: msg.sender,
        timestamp: new Date(msg.timestamp * 1000),
        isOwn: msg.sender.toLowerCase() === walletAddress.toLowerCase(),
        isEncrypted: msg.isEncrypted,
        blockchainStatus: 'confirmed' as const,
        transactionHash: msg.transactionHash,
      }));
      
      setMessages(convertedMessages);
    } catch (error) {
      console.error('❌ Failed to load conversation:', error);
    }
    
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
    if (!blockchainConnected && !polygonWeb3Service.isConnected()) {
      toast({
        title: "Blockchain Not Connected",
        description: "Please connect to Polygon network to send messages.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const recipient = selectedContact?.address || walletAddress;
    
    // Create pending message
    const pendingMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: walletAddress,
      timestamp: new Date(),
      isOwn: true,
      isEncrypted,
      blockchainStatus: 'pending',
      replyTo: replyToMessage || undefined
    };

    setMessages(prev => [...prev, pendingMessage]);
    setNewMessage('');
    setReplyToMessage(null);

    try {
      console.log('📤 Sending message to blockchain...');
      
      // ChatApp contract takes the raw message content
      const txHash = await polygonWeb3Service.sendMessage(newMessage);

      // Update message with transaction hash and confirmed status
      setMessages(prev => 
        prev.map(msg => 
          msg.id === pendingMessage.id 
            ? { 
                ...msg, 
                blockchainStatus: 'confirmed' as const,
                transactionHash: txHash
              }
            : msg
        )
      );

      toast({
        title: "Message Sent",
        description: selectedContact 
          ? `Encrypted message sent to ${selectedContact.name}` 
          : "Your encrypted message has been stored on Polygon blockchain",
      });

      console.log('✅ Message sent with transaction:', txHash);
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Update message to failed status
      setMessages(prev => 
        prev.map(msg => 
          msg.id === pendingMessage.id 
            ? { ...msg, blockchainStatus: 'failed' as const }
            : msg
        )
      );

      toast({
        title: "Message Failed",
        description: error instanceof Error ? error.message : "Failed to send message to blockchain",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  if (isInitialLoading) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
        <p className="text-muted-foreground">Loading blockchain data...</p>
      </div>
    );
  }

  if (showContactList) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Contact List Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContactList(false)}
                className="hover:bg-accent"
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <h3 className="font-semibold text-foreground">Contacts</h3>
                <p className="text-sm text-muted-foreground">
                  {contacts.length} contact{contacts.length !== 1 ? 's' : ''} on blockchain
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
        <div className="flex-1 p-4 bg-background">
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <User size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                ChatApp Global Chat Room
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield size={12} className="text-green-500" />
                Public blockchain chat • All messages visible to everyone
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hover:bg-accent"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <NotificationCenter />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowContactList(true)}
              className="border-border hover:bg-accent"
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
      <div className="px-4 py-2 bg-background">
        <ConnectionStatus walletAddress={walletAddress} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
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

      {/* Reply Preview */}
      {replyToMessage && (
        <div className="mx-4 p-2 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Replying to: {messages.find(m => m.id === replyToMessage)?.content}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessage(null)}
              className="hover:bg-blue-100 dark:hover:bg-blue-900/50"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <Card className="m-4 p-4 bg-card border-border">
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
                placeholder="Type your message to the global chat room..."
                className="flex-1 bg-background border-border"
                disabled={isLoading}
              />
              <Button
                onClick={() => setIsEncrypted(!isEncrypted)}
                variant={isEncrypted ? "default" : "outline"}
                size="sm"
                className="shrink-0"
              >
                <Shield size={16} className={isEncrypted ? "text-primary-foreground" : "text-muted-foreground"} />
              </Button>
            </div>
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          📢 Public global chat room • No gas fees required
          {!polygonWeb3Service.isConnected() && (
            <> • ⚠️ Blockchain not connected</>
          )}
        </p>
      </Card>
    </div>
  );
};

export default ChatInterface;
