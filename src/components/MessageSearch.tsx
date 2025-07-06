
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { Message } from '@/types/message';

interface MessageSearchProps {
  messages: Message[];
  onSearchResults: (results: Message[]) => void;
  onClearSearch: () => void;
}

const MessageSearch: React.FC<MessageSearchProps> = ({ 
  messages, 
  onSearchResults, 
  onClearSearch 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setIsSearching(false);
      onClearSearch();
      return;
    }

    setIsSearching(true);
    const results = messages.filter(message =>
      message.content.toLowerCase().includes(term.toLowerCase())
    );
    onSearchResults(results);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    onClearSearch();
  };

  return (
    <div className="p-4 border-b bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search messages..."
            className="pl-10"
          />
        </div>
        {isSearching && (
          <Button variant="ghost" size="sm" onClick={clearSearch}>
            <X size={16} />
          </Button>
        )}
      </div>
      {isSearching && (
        <p className="text-xs text-gray-500 mt-2">
          Found {messages.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase())).length} messages
        </p>
      )}
    </div>
  );
};

export default MessageSearch;
