
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Edit3, Shield, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DIDProfileProps {
  walletAddress: string;
}

const DIDProfile: React.FC<DIDProfileProps> = ({ walletAddress }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    username: 'Anonymous User',
    avatar: '',
    bio: 'Blockchain enthusiast'
  });
  const [tempProfile, setTempProfile] = useState(profile);

  const handleSave = async () => {
    try {
      // Simulate DID update transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProfile(tempProfile);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your decentralized identity has been updated on-chain",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update your DID profile",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Shield size={16} className="text-purple-600" />
          Decentralized Identity
        </h4>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 size={14} className="mr-1" />
            Edit
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.avatar} />
          <AvatarFallback>
            <User size={20} />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={tempProfile.username}
                onChange={(e) => setTempProfile({...tempProfile, username: e.target.value})}
                placeholder="Username"
                className="text-sm"
              />
              <Input
                value={tempProfile.bio}
                onChange={(e) => setTempProfile({...tempProfile, bio: e.target.value})}
                placeholder="Bio"
                className="text-sm"
              />
            </div>
          ) : (
            <div>
              <p className="font-medium text-gray-900">{profile.username}</p>
              <p className="text-xs text-gray-600">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        DID: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
      </div>

      {isEditing && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="flex-1">
            <Check size={14} className="mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X size={14} className="mr-1" />
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
};

export default DIDProfile;
