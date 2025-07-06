import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { polygonWeb3Service } from '@/utils/polygonWeb3Service';
import { Message } from '@/types/message';
import { useMessageLoading } from './useMessageLoading';
import { useMessageSending } from './useMessageSending';
import { useMessageReactions } from './useMessageReactions';
import { useMessageSearch } from './useMessageSearch';

export type { Message } from '@/types/message';

export const useMessageHandling = (walletAddress: string, selectedContactAddress?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { loadMessages: loadMessagesFromService } = useMessageLoading(walletAddress);
  const { sendTextMessage, sendVoiceMessage, handleMediaShare: createMediaMessage } = useMessageSending(walletAddress);
  const { handleReact: reactToMessage, handleReply: replyToMessageId } = useMessageReactions(walletAddress);
  const { searchResults, isSearching, handleSearchResults, handleClearSearch } = useMessageSearch();

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
      const loadedMessages = await loadMessagesFromService(contactAddress);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setIsLoading(true);
      const { pendingMessage, promise } = await sendTextMessage(
        newMessage,
        isEncrypted,
        selectedContactAddress,
        replyToMessage || undefined
      );

      setMessages(prev => [...prev, pendingMessage]);
      setNewMessage('');
      setReplyToMessage(null);

      const txHash = await promise;

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
    const replyId = replyToMessageId(messageId);
    setReplyToMessage(replyId);
  };

  const handleReact = (messageId: string, emoji: string) => {
    const updatedMessages = reactToMessage(messages, messageId, emoji);
    setMessages(updatedMessages);
  };

  const handleVoiceMessage = async (audioBlob: Blob, duration: number) => {
    try {
      setIsLoading(true);
      const { pendingMessage, promise } = await sendVoiceMessage(
        audioBlob,
        duration,
        selectedContactAddress
      );

      setMessages(prev => [...prev, pendingMessage]);

      const txHash = await promise;

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
    } catch (error) {
      console.error('❌ Failed to send voice message:', error);
      
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
    const message = createMediaMessage(mediaHash, mediaType, fileName);
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