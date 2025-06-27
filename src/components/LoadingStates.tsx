
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export const MessageSkeleton: React.FC = () => (
  <div className="flex mb-4 animate-pulse">
    <div className="max-w-xs lg:max-w-md">
      <Skeleton className="h-20 w-64 rounded-2xl mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
);

export const ContactSkeleton: React.FC = () => (
  <Card className="p-2">
    <div className="space-y-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

export const ChatLoadingSkeleton: React.FC = () => (
  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
    <MessageSkeleton />
    <div className="flex justify-end">
      <MessageSkeleton />
    </div>
    <MessageSkeleton />
  </div>
);
