import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { polygonWeb3Service } from '@/utils/polygonWeb3Service';

export interface Message {
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

export const useMessageHandling = (walletAddress: string, selectedContactAddress?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-reload messages when contact changes or wallet reconnects
  useEffect(() => {
    if (walletAddress && polygonWeb3Service.isConnected()) {
      loadMessages(selectedContactAddress);
    }
  }, [walletAddress, selectedContactAddress]);

  const loadMessages = async (contactAddress?: string) => {
    try {
      if (contactAddress) {
        // Show loading toast for IPFS content retrieval
        toast({
          title: "Loading Messages",
          description: "Retrieving encrypted content from IPFS...",
        });
        
        // Load conversation with specific contact (PRIVATE MESSAGES ONLY)
        const conversation = await polygonWeb3Service.getConversation(walletAddress, contactAddress);
        const convertedMessages: Message[] = conversation.map(msg => ({
          id: msg.id,
          content: msg.contentHash, // Now contains actual content from IPFS
          sender: msg.sender,
          timestamp: new Date(msg.timestamp * 1000),
          isOwn: msg.sender.toLowerCase() === walletAddress.toLowerCase(),
          isEncrypted: msg.isEncrypted,
          blockchainStatus: 'confirmed' as const,
          transactionHash: msg.transactionHash,
        }));
        
        setMessages(convertedMessages);
        
        // If no conversation exists, show a welcome message for this contact
        if (convertedMessages.length === 0) {
          const welcomeMessage: Message = {
            id: `welcome-${contactAddress}`,
            content: `Start a private conversation with this contact. Your messages will be encrypted, stored on IPFS, and recorded on the blockchain for maximum security and decentralization.`,
            sender: 'system',
            timestamp: new Date(),
            isOwn: false,
            isEncrypted: false,
            blockchainStatus: 'confirmed',
          };
          setMessages([welcomeMessage]);
        }
      } else {
        // Show loading for global chat
        toast({
          title: "Loading Global Chat",
          description: "Retrieving messages from IPFS & blockchain...",
        });
        
        // Load GLOBAL CHAT MESSAGES ONLY (not private messages)
        const globalMessages = await polygonWeb3Service.getGlobalMessages();
        const convertedMessages: Message[] = globalMessages.map(msg => ({
          id: msg.id,
          content: msg.contentHash, // Now contains actual content from IPFS
          sender: msg.sender,
          timestamp: new Date(msg.timestamp * 1000),
          isOwn: msg.sender.toLowerCase() === walletAddress.toLowerCase(),
          isEncrypted: msg.isEncrypted,
          blockchainStatus: 'confirmed' as const,
          transactionHash: msg.transactionHash,
        }));
        setMessages(convertedMessages);
        
        if (convertedMessages.length === 0) {
          const welcomeMessage: Message = {
            id: 'welcome',
            content: 'Welcome to the ChatApp Global Chat Room! This is a decentralized public chat where messages are stored on IPFS and recorded on the Polygon blockchain. Send your first message to get started!',
            sender: 'system',
            timestamp: new Date(),
            isOwn: false,
            isEncrypted: false,
            blockchainStatus: 'confirmed',
          };
          setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
      const errorMessage: Message = {
        id: `error-${contactAddress || 'global'}`,
        content: contactAddress 
          ? `Unable to load conversation history from IPFS/blockchain. You can still send new messages.`
          : 'Unable to load global chat history from IPFS/blockchain. You can still send new messages.',
        sender: 'system',
        timestamp: new Date(),
        isOwn: false,
        isEncrypted: false,
        blockchainStatus: 'failed',
      };
      setMessages([errorMessage]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!polygonWeb3Service.isConnected()) {
      toast({
        title: "Blockchain Not Connected",
        description: "Please connect to Polygon network to send messages.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const recipient = selectedContactAddress;
    
    // Create pending message with IPFS uploading status
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
      console.log('📤 Starting IPFS + Blockchain message flow...');
      
      // Show IPFS upload progress
      toast({
        title: "Uploading to IPFS",
        description: "Storing message content on decentralized storage...",
      });

      // Send message (this now includes IPFS upload + blockchain tx)
      const txHash = await polygonWeb3Service.sendMessage(newMessage, recipient);

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
        title: "Message Sent Successfully",
        description: selectedContactAddress 
          ? `Encrypted message sent via IPFS & blockchain` 
          : "Message stored on IPFS and recorded on Polygon blockchain",
      });

      console.log('✅ Message sent with IPFS + Blockchain integration:', txHash);
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Provide more specific error details
      let errorMessage = "Failed to send message via IPFS & blockchain";
      if (error instanceof Error) {
        console.error('❌ Detailed error:', error.message);
        if (error.message.includes('Smart contract not deployed')) {
          errorMessage = "Smart contract is not deployed. Please deploy the contract first.";
        } else if (error.message.includes('Contract not initialized')) {
          errorMessage = "Wallet connection issue. Please reconnect your wallet.";
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = "Insufficient MATIC for transaction fees.";
        } else if (error.message.includes('user rejected')) {
          errorMessage = "Transaction was rejected in wallet.";
        } else if (error.message.includes('IPFS')) {
          errorMessage = "Failed to upload message to IPFS storage.";
        } else {
          errorMessage = error.message;
        }
      }
      
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
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  const handleVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!polygonWeb3Service.isConnected()) {
      toast({
        title: "Blockchain Not Connected",
        description: "Please connect to Polygon network to send voice messages.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const recipient = selectedContactAddress;
    
    const pendingMessage: Message = {
      id: Date.now().toString(),
      content: 'Voice message',
      sender: walletAddress,
      timestamp: new Date(),
      isOwn: true,
      isEncrypted: true,
      blockchainStatus: 'pending',
      voiceBlob: audioBlob,
      voiceDuration: duration
    };

    setMessages(prev => [...prev, pendingMessage]);

    try {
      console.log('🎙️ Uploading voice message to IPFS & blockchain...');
      
      toast({
        title: "Uploading Voice Message",
        description: "Storing voice content on IPFS and blockchain...",
      });

      // Convert voice blob to base64 for IPFS storage
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const voiceContent = `[VOICE:${duration}s]${base64Audio}`;
      
      // Send voice message to blockchain
      const txHash = await polygonWeb3Service.sendMessage(voiceContent, recipient);

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
        title: "Voice Message Sent",
        description: "Voice message uploaded to IPFS and recorded on blockchain",
      });

    } catch (error) {
      console.error('❌ Failed to send voice message:', error);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === pendingMessage.id 
            ? { ...msg, blockchainStatus: 'failed' as const }
            : msg
        )
      );

      toast({
        title: "Voice Message Failed",
        description: error instanceof Error ? error.message : "Failed to send voice message",
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

  const handleSearchResults = (results: Message[]) => {
    setSearchResults(results);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
  };

  return {
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
  };
};