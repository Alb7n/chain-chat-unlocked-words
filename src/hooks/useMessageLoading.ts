import { toast } from '@/hooks/use-toast';
import { polygonWeb3Service } from '@/utils/polygonWeb3Service';
import { Message } from '@/types/message';

export const useMessageLoading = (walletAddress: string) => {
  const loadMessages = async (contactAddress?: string): Promise<Message[]> => {
    try {
      if (contactAddress) {
        toast({
          title: "Loading Messages",
          description: "Retrieving encrypted content from IPFS...",
        });
        
        const conversation = await polygonWeb3Service.getConversation(walletAddress, contactAddress);
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
          return [welcomeMessage];
        }
        
        return convertedMessages;
      } else {
        toast({
          title: "Loading Global Chat",
          description: "Retrieving messages from IPFS & blockchain...",
        });
        
        const globalMessages = await polygonWeb3Service.getGlobalMessages();
        const convertedMessages: Message[] = globalMessages.map(msg => ({
          id: msg.id,
          content: msg.contentHash,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp * 1000),
          isOwn: msg.sender.toLowerCase() === walletAddress.toLowerCase(),
          isEncrypted: msg.isEncrypted,
          blockchainStatus: 'confirmed' as const,
          transactionHash: msg.transactionHash,
        }));
        
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
          return [welcomeMessage];
        }
        
        return convertedMessages;
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
      return [errorMessage];
    }
  };

  return { loadMessages };
};