
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Image, Upload, File, Download, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MediaShareProps {
  onMediaShare: (mediaHash: string, mediaType: string, fileName: string) => void;
}

const MediaShare: React.FC<MediaShareProps> = ({ onMediaShare }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB for demo)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    // Simulate IPFS upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Generate mock IPFS hash
    return `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const ipfsHash = await uploadToIPFS(selectedFile);
      const mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      
      onMediaShare(ipfsHash, mediaType, selectedFile.name);
      
      toast({
        title: "Media Uploaded",
        description: "Your file has been uploaded to IPFS and shared",
      });
      
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload file to IPFS",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      
      {selectedFile ? (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedFile.type.startsWith('image/') ? (
                <Image size={16} className="text-blue-600" />
              ) : (
                <File size={16} className="text-blue-600" />
              )}
              <div>
                <p className="text-sm font-medium truncate max-w-[150px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={isUploading}
                className="h-8"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={12} className="mr-1" />
                    Share
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemoveFile}
                className="h-8 w-8 p-0"
              >
                <X size={12} />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <Upload size={14} className="mr-2" />
          Attach Media
        </Button>
      )}
    </div>
  );
};

export default MediaShare;
