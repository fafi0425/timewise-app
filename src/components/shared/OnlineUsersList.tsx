
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Wifi } from 'lucide-react';
import type { User } from '@/lib/types';

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`;
  }
  return names[0].substring(0, 2);
};

export default function OnlineUsersList() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    const updateList = () => {
        const users: User[] = JSON.parse(localStorage.getItem('onlineUsers') || '[]');
        setOnlineUsers(users);
    };
    
    updateList();
    const interval = setInterval(updateList, 3000); // Poll every 3 seconds
    
    // Also listen for storage events to update immediately from other tabs
    window.addEventListener('storage', updateList);

    return () => {
        clearInterval(interval);
        window.removeEventListener('storage', updateList);
    };
  }, []);

  return (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
            <Wifi className="h-5 w-5 mr-2 text-green-500"/> Users Online ({onlineUsers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No users are currently online.</p>
          </div>
        ) : (
          onlineUsers.map((u) => (
            <div key={u.uid} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${u.email}`} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium text-card-foreground">{u.name}</div>
                        <div className="text-sm text-muted-foreground">{u.department} - {u.role}</div>
                    </div>
                </div>
                <div className="text-xl">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
