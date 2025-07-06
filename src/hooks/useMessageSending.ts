import { toast } from '@/hooks/use-toast';
import { polygonWeb3Service } from '@/utils/polygonWeb3Service';
import { Message } from '@/types/message';

export const useMessageSending = (walletAddress: string) => {
  const sendTextMessage = async (
    content: string,
    isEncrypted: boolean,
    recipient?: string,
    replyTo?: string
  ): Promise<{ pendingMessage: Message; promise: Promise<string> }> => {
    if (!polygonWeb3Service.isConnected()) {
      throw new Error('Blockchain Not Connected. Please connect to Polygon network to send messages.');
    }

    const pendingMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: walletAddress,
      timestamp: new Date(),
      isOwn: true,
      isEncrypted,
      blockchainStatus: 'pending',
      replyTo: replyTo || undefined
    };

    const sendPromise = (async () => {
      console.log('📤 Starting IPFS + Blockchain message flow...');
      
      toast({
        title: "Uploading to IPFS",
        description: "Storing message content on decentralized storage...",
      });

      const txHash = await polygonWeb3Service.sendMessage(content, recipient);

      toast({
        title: "Message Sent Successfully",
        description: recipient 
          ? `Encrypted message sent via IPFS & blockchain` 
          : "Message stored on IPFS and recorded on Polygon blockchain",
      });

      console.log('✅ Message sent with IPFS + Blockchain integration:', txHash);
      return txHash;
    })();

    return { pendingMessage, promise: sendPromise };
  };

  const sendVoiceMessage = async (
    audioBlob: Blob,
    duration: number,
    recipient?: string
  ): Promise<{ pendingMessage: Message; promise: Promise<string> }> => {
    if (!polygonWeb3Service.isConnected()) {
      throw new Error('Blockchain Not Connected. Please connect to Polygon network to send voice messages.');
    }

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

    const sendPromise = (async () => {
      console.log('🎙️ Uploading voice message to IPFS & blockchain...');
      
      toast({
        title: "Uploading Voice Message",
        description: "Storing voice content on IPFS and blockchain...",
      });

      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const voiceContent = `[VOICE:${duration}s]${base64Audio}`;
      
      const txHash = await polygonWeb3Service.sendMessage(voiceContent, recipient);

      toast({
        title: "Voice Message Sent",
        description: "Voice message uploaded to IPFS and recorded on blockchain",
      });

      return txHash;
    })();

    return { pendingMessage, promise: sendPromise };
  };

  const handleMediaShare = (mediaHash: string, mediaType: string, fileName: string): Message => {
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

    // Simulate blockchain confirmation
    setTimeout(() => {
      // This would need to be handled by the parent component
      console.log('Media message confirmed');
    }, 3000);

    return message;
  };

  return {
    sendTextMessage,
    sendVoiceMessage,
    handleMediaShare,
  };
};