import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { polygonWeb3Service, BlockchainContact } from '@/utils/polygonWeb3Service';

export interface Contact {
  address: string;
  name: string;
  ensName?: string;
  avatar?: string;
  addedAt: Date;
}

export const useContactManagement = (walletAddress: string) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactList, setShowContactList] = useState(false);

  const loadContacts = async () => {
    try {
      console.log('📥 Loading contacts...');
      
      const blockchainContacts = await polygonWeb3Service.getUserContacts(walletAddress);
      const convertedContacts: Contact[] = blockchainContacts.map(contact => ({
        address: contact.address,
        name: contact.name,
        ensName: contact.ensName || undefined,
        avatar: contact.avatar || undefined,
        addedAt: new Date(contact.addedAt * 1000),
      }));
      setContacts(convertedContacts);
      
      console.log('✅ Loaded', convertedContacts.length, 'contacts');
    } catch (error) {
      console.error('❌ Failed to load contacts:', error);
      toast({
        title: "Contact Loading Failed",
        description: "Could not load your contacts from blockchain.",
        variant: "destructive",
      });
    }
  };

  const handleContactAdded = async (contact: Contact) => {
    try {
      console.log('👤 Adding contact to blockchain...');
      
      const txHash = await polygonWeb3Service.addContact(
        contact.address,
        contact.name,
        contact.ensName || '',
        contact.avatar || ''
      );
      
      setContacts(prev => [...prev, contact]);
      
      toast({
        title: "Contact Added",
        description: `${contact.name} has been added to your contacts and saved on blockchain.`,
      });
      
      console.log('✅ Contact added with transaction:', txHash);
    } catch (error) {
      console.error('❌ Failed to add contact:', error);
      toast({
        title: "Failed to Add Contact",
        description: error instanceof Error ? error.message : "Could not add contact to blockchain",
        variant: "destructive",
      });
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactList(false);
    
    toast({
      title: "Private Chat Opened",
      description: `Starting private conversation with ${contact.name}`,
    });
  };

  return {
    contacts,
    selectedContact,
    showContactList,
    setShowContactList,
    setSelectedContact,
    loadContacts,
    handleContactAdded,
    handleContactSelect,
  };
};