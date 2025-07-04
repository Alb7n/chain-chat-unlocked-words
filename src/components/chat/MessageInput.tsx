import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Shield, Loader2 } from 'lucide-react';
import MediaShare from '@/components/MediaShare';
import VoiceMessage from '@/components/VoiceMessage';
import { polygonWeb3Service } from '@/utils/polygonWeb3Service';
import { Contact } from '@/hooks/useContactManagement';
import { Message } from '@/hooks/useMessageHandling';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  isEncrypted: boolean;
  setIsEncrypted: (encrypted: boolean) => void;
  isLoading: boolean;
  selectedContact: Contact | null;
  replyToMessage: string | null;
  setReplyToMessage: (messageId: string | null) => void;
  messages: Message[];
  onSendMessage: () => void;
  onVoiceMessage: (audioBlob: Blob, duration: number) => void;
  onMediaShare: (mediaHash: string, mediaType: string, fileName: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  isEncrypted,
  setIsEncrypted,
  isLoading,
  selectedContact,
  replyToMessage,
  setReplyToMessage,
  messages,
  onSendMessage,
  onVoiceMessage,
  onMediaShare,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div>
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
            <MediaShare onMediaShare={onMediaShare} />
            <VoiceMessage onVoiceMessage={onVoiceMessage} />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedContact 
                  ? `Message ${selectedContact.name}...` 
                  : "Type your message to the global chat room..."
                }
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
              onClick={onSendMessage}
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

export default MessageInput;