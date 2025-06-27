
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, User, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { web3Service } from '@/utils/web3Service';

interface Contact {
  address: string;
  name: string;
  ensName?: string;
  avatar?: string;
  addedAt: Date;
}

interface AddContactProps {
  onContactAdded: (contact: Contact) => void;
  existingContacts: Contact[];
}

const AddContact: React.FC<AddContactProps> = ({ onContactAdded, existingContacts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const validateAddress = async (input: string) => {
    if (!input.trim()) {
      setValidationStatus('idle');
      return;
    }

    setIsValidating(true);
    try {
      // Check if it's a valid Ethereum address (42 characters, starts with 0x)
      const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(input);
      
      // Check if it's an ENS name (ends with .eth)
      const isENS = input.endsWith('.eth');

      if (isValidAddress || isENS) {
        // For demo purposes, we'll assume it's valid
        // In a real app, you'd resolve ENS names and verify addresses exist
        setValidationStatus('valid');
      } else {
        setValidationStatus('invalid');
      }
    } catch (error) {
      setValidationStatus('invalid');
    } finally {
      setIsValidating(false);
    }
  };

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateAddress(addressInput);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [addressInput]);

  const handleAddContact = async () => {
    if (validationStatus !== 'valid' || !addressInput.trim()) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address or ENS name",
        variant: "destructive",
      });
      return;
    }

    // Check if contact already exists
    const exists = existingContacts.some(
      contact => contact.address.toLowerCase() === addressInput.toLowerCase()
    );

    if (exists) {
      toast({
        title: "Contact Exists",
        description: "This contact is already in your list",
        variant: "destructive",
      });
      return;
    }

    const newContact: Contact = {
      address: addressInput,
      name: nameInput.trim() || `User ${addressInput.slice(0, 6)}...${addressInput.slice(-4)}`,
      ensName: addressInput.endsWith('.eth') ? addressInput : undefined,
      addedAt: new Date()
    };

    onContactAdded(newContact);

    toast({
      title: "Contact Added",
      description: `${newContact.name} has been added to your contacts`,
    });

    // Reset form
    setAddressInput('');
    setNameInput('');
    setValidationStatus('idle');
    setIsOpen(false);
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />;
    }
    if (validationStatus === 'valid') {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    if (validationStatus === 'invalid') {
      return <AlertCircle size={16} className="text-red-500" />;
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus size={16} className="mr-1" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User size={20} className="text-blue-600" />
            Add New Contact
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="address">Wallet Address or ENS Name</Label>
            <div className="relative">
              <Input
                id="address"
                placeholder="0x... or name.eth"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className={`pr-10 ${
                  validationStatus === 'valid' ? 'border-green-500' : 
                  validationStatus === 'invalid' ? 'border-red-500' : ''
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getValidationIcon()}
              </div>
            </div>
            {validationStatus === 'invalid' && (
              <p className="text-sm text-red-500">
                Please enter a valid Ethereum address (0x...) or ENS name (.eth)
              </p>
            )}
            {validationStatus === 'valid' && (
              <p className="text-sm text-green-500">
                Valid address format
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display Name (optional)</Label>
            <Input
              id="name"
              placeholder="Enter a friendly name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </div>

          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Adding contacts on blockchain</p>
                <p className="text-xs">
                  Contact information is stored locally for privacy. Messages will be sent 
                  directly to their wallet address on the blockchain.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleAddContact}
              disabled={validationStatus !== 'valid' || !addressInput.trim()}
              className="flex-1"
            >
              Add Contact
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddContact;
