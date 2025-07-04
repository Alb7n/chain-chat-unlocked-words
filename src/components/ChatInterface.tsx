import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import MessageSearch from './MessageSearch';
import ConnectionStatus from './ConnectionStatus';
import ChatHeader from './chat/ChatHeader';
import ContactListView from './chat/ContactListView';
import MessageList from './chat/MessageList';
import MessageInput from './chat/MessageInput';
import { useMessageHandling } from '@/hooks/useMessageHandling';
import { useContactManagement, Contact } from '@/hooks/useContactManagement';
import { toast } from '@/hooks/use-toast';
import { polygonWeb3Service } from '@/utils/polygonWeb3Service';


interface ChatInterfaceProps {
  walletAddress: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ walletAddress }) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [blockchainConnected, setBlockchainConnected] = useState(false);

  const contactManagement = useContactManagement(walletAddress);
  
  const {
    contacts,
    selectedContact,
    showContactList,
    setShowContactList,
    setSelectedContact,
    loadContacts,
    handleContactAdded,
    handleContactSelect,
  } = contactManagement;

  const messageHandling = useMessageHandling(walletAddress, selectedContact?.address);

  const {
    messages,
    newMessage,
    setNewMessage,
    isEncrypted,
    setIsEncrypted,
    isLoading,
    searchResults,
    isSearching,
    replyToMessage,
    setReplyToMessage,
    messagesEndRef,
    loadMessages,
    sendMessage,
    handleReply,
    handleReact,
    handleVoiceMessage,
    handleMediaShare,
    handleSearchResults,
    handleClearSearch,
  } = messageHandling;


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
      
      // Load contacts and messages
      await Promise.all([
        loadContacts(),
        loadMessages()
      ]);
      
    } catch (error) {
      console.error('❌ Failed to load blockchain data:', error);
      toast({
        title: "Data Loading Failed",
        description: "Could not load your messages and contacts from blockchain.",
        variant: "destructive",
      });
    }
  };


  const handleContactSelectLocal = async (contact: Contact) => {
    handleContactSelect(contact);
    // Load messages for the selected contact
    await loadMessages(contact.address);
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
      <ContactListView
        contacts={contacts}
        selectedContact={selectedContact}
        onBack={() => setShowContactList(false)}
        onContactAdded={handleContactAdded}
        onContactSelect={handleContactSelectLocal}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <ChatHeader
        selectedContact={selectedContact}
        contactsCount={contacts.length}
        onShowContactList={() => setShowContactList(true)}
      />

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
      <MessageList
        messages={isSearching ? searchResults : messages}
        currentUser={walletAddress}
        onReply={handleReply}
        onReact={handleReact}
        referencedMessage={replyToMessage ? messages.find(m => m.id === replyToMessage) : undefined}
        messagesEndRef={messagesEndRef}
      />

      {/* Input */}
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        isEncrypted={isEncrypted}
        setIsEncrypted={setIsEncrypted}
        isLoading={isLoading}
        selectedContact={selectedContact}
        replyToMessage={replyToMessage}
        setReplyToMessage={setReplyToMessage}
        messages={messages}
        onSendMessage={sendMessage}
        onVoiceMessage={handleVoiceMessage}
        onMediaShare={handleMediaShare}
      />
    </div>
  );
};

export default ChatInterface;
