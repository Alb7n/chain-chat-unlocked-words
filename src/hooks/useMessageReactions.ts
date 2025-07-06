import { Message } from '@/types/message';

export const useMessageReactions = (walletAddress: string) => {
  const handleReact = (
    messages: Message[],
    messageId: string,
    emoji: string
  ): Message[] => {
    return messages.map(msg => {
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
    });
  };

  const handleReply = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    messageElement?.scrollIntoView({ behavior: 'smooth' });
    return messageId;
  };

  return {
    handleReact,
    handleReply,
  };
};