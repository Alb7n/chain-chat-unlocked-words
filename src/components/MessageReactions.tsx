import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ThumbsUp, Smile, Frown } from 'lucide-react';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MessageReactionsProps {
  messageId: string;
  reactions?: Reaction[];
  onReact: (messageId: string, emoji: string) => void;
  currentUser: string;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions = [],
  onReact,
  currentUser
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const availableReactions = [
    { emoji: '👍', icon: ThumbsUp },
    { emoji: '❤️', icon: Heart },
    { emoji: '😊', icon: Smile },
    { emoji: '😢', icon: Frown },
  ];

  const handleReact = (emoji: string) => {
    onReact(messageId, emoji);
    setShowReactionPicker(false);
  };

  const hasUserReacted = (reaction: Reaction) => {
    return reaction.users.includes(currentUser);
  };

  return (
    <div className="mt-1">
      {reactions.length > 0 && (
        <div className="flex gap-1 mb-1">
          {reactions.map((reaction, index) => (
            <Button
              key={index}
              variant={hasUserReacted(reaction) ? "default" : "outline"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleReact(reaction.emoji)}
            >
              {reaction.emoji} {reaction.count}
            </Button>
          ))}
        </div>
      )}

      {showReactionPicker ? (
        <div className="flex gap-1 p-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg">
          {availableReactions.map(({ emoji, icon: Icon }) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleReact(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setShowReactionPicker(true)}
        >
          😊+
        </Button>
      )}
    </div>
  );
};

export default MessageReactions;
