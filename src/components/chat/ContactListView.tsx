import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AddContact from '@/components/AddContact';
import ContactList from '@/components/ContactList';
import { Contact } from '@/hooks/useContactManagement';

interface ContactListViewProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onBack: () => void;
  onContactAdded: (contact: Contact) => void;
  onContactSelect: (contact: Contact) => void;
}

const ContactListView: React.FC<ContactListViewProps> = ({
  contacts,
  selectedContact,
  onBack,
  onContactAdded,
  onContactSelect,
}) => {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Contact List Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-accent"
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h3 className="font-semibold text-foreground">Contacts</h3>
              <p className="text-sm text-muted-foreground">
                {contacts.length} contact{contacts.length !== 1 ? 's' : ''} on blockchain
              </p>
            </div>
          </div>
          <AddContact 
            onContactAdded={onContactAdded}
            existingContacts={contacts}
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 p-4 bg-background">
        <ContactList
          contacts={contacts}
          onContactSelect={onContactSelect}
          selectedContact={selectedContact}
        />
      </div>
    </div>
  );
};

export default ContactListView;