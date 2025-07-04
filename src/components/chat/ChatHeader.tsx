import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Shield, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationCenter from '@/components/NotificationCenter';
import { Contact } from '@/hooks/useContactManagement';

interface ChatHeaderProps {
  selectedContact: Contact | null;
  contactsCount: number;
  onShowContactList: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedContact,
  contactsCount,
  onShowContactList,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
            <User size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {selectedContact ? `Chat with ${selectedContact.name}` : 'ChatApp Global Chat Room'}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Shield size={12} className="text-green-500" />
              {selectedContact 
                ? `Private encrypted conversation • ${selectedContact.ensName || `${selectedContact.address.slice(0, 6)}...${selectedContact.address.slice(-4)}`}`
                : 'Public blockchain chat • All messages visible to everyone'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="hover:bg-accent"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <NotificationCenter />
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShowContactList}
            className="border-border hover:bg-accent"
          >
            <User size={16} className="mr-1" />
            Contacts ({contactsCount})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;