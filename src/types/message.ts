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