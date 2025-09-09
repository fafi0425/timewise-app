
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Utensils } from 'lucide-react';
import type { User } from '@/lib/types';
import { getUsersOnBreakOrLunch } from '@/lib/firebase-admin';

interface OnBreakUser extends User {
    type: 'break' | 'lunch';
    startTime: string | null;
}

export default function OnBreakList() {
  const [onBreakUsers, setOnBreakUsers] = useState<OnBreakUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOnBreakUsers = useCallback(async () => {
      try {
          setIsLoading(true);
          const result = await getUsersOnBreakOrLunch();
          if (result.success && result.users) {
              setOnBreakUsers(result.users as OnBreakUser[]);
          } else {
              console.error("Could not fetch on-break users:", result.message);
              setOnBreakUsers([]);
          }
      } catch (error) {
          console.error("Error fetching on-break users:", error);
          setOnBreakUsers([]);
      } finally {
          setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchOnBreakUsers();
    const intervalId = setInterval(fetchOnBreakUsers, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchOnBreakUsers]);

  return (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
            <Coffee className="h-5 w-5 mr-2 text-primary"/> Currently On Break
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
        {isLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading...</p>
        ) : onBreakUsers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No team members are currently on break or lunch.</p>
          </div>
        ) : (
          onBreakUsers.map((u) => (
            <div key={u.uid} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                    <div className="font-medium text-card-foreground">{u.name}</div>
                    <div className="text-sm text-muted-foreground">{u.department}</div>
                    {u.startTime && (
                         <div className="text-xs text-primary">{u.type === 'break' ? 'Break' : 'Lunch'} started at {new Date(u.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    )}
                </div>
                <div className="text-xl">
                    {u.type === 'lunch' ? <Utensils className="text-secondary" /> : <Coffee className="text-primary" />}
                </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
