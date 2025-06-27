
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Shield, User, ArrowLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MediaShare from './MediaShare';
import NotificationCenter from './NotificationCenter';
import AddContact from './AddContact';
import ContactList from './ContactList';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const recipient = selectedContact?.address || 'general';
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: walletAddress,
      timestamp: new Date(),
      isOwn: true,
      isEncrypted,
      blockchainStatus: 'pending',
      transactionHash: `0x${Math.random().toString(16).substr(2, 16)}`
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

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
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
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
                <h3 className="font-semibold text-gray-900">Contacts</h3>
                <p className="text-sm text-gray-600">
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
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {selectedContact ? selectedContact.name : 'Blockchain Chat'}
              </h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="m-4 p-4">
        <div className="space-y-3">
          <MediaShare onMediaShare={handleMediaShare} />
          
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
                className="flex-1"
              />
              <Button
                onClick={() => setIsEncrypted(!isEncrypted)}
                variant={isEncrypted ? "default" : "outline"}
                size="sm"
                className="shrink-0"
              >
                <Shield size={16} className={isEncrypted ? "text-white" : "text-gray-600"} />
              </Button>
            </div>
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
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
