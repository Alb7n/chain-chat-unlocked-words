
import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MessageCircle } from 'lucide-react';

interface Contact {
  address: string;
  name: string;
  ensName?: string;
  avatar?: string;
  addedAt: Date;
}

interface ContactListProps {
  contacts: Contact[];
  onContactSelect: (contact: Contact) => void;
  selectedContact?: Contact;
}

const ContactList: React.FC<ContactListProps> = ({ 
  contacts, 
  onContactSelect, 
  selectedContact 
}) => {
  if (contacts.length === 0) {
    return (
      <Card className="p-4 text-center text-gray-500">
        <User size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No contacts yet</p>
        <p className="text-xs">Add contacts to start messaging</p>
      </Card>
    );
  }

  return (
    <Card className="p-2">
      <div className="space-y-1">
        {contacts.map((contact) => (
          <div
            key={contact.address}
            onClick={() => onContactSelect(contact)}
            className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 ${
              selectedContact?.address === contact.address 
                ? 'bg-blue-50 border-blue-200 border' 
                : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={contact.avatar} />
                <AvatarFallback>
                  <User size={16} />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {contact.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {contact.ensName || `${contact.address.slice(0, 6)}...${contact.address.slice(-4)}`}
                </p>
              </div>
              <MessageCircle size={16} className="text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ContactList;
