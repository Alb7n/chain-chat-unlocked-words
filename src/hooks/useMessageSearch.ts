import { useState } from 'react';
import { Message } from '@/types/message';

export const useMessageSearch = () => {
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchResults = (results: Message[]) => {
    setSearchResults(results);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
  };

  return {
    searchResults,
    isSearching,
    handleSearchResults,
    handleClearSearch,
  };
};