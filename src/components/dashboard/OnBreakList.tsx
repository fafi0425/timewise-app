'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Utensils } from 'lucide-react';
import type { User, UserState } from '@/lib/types';

interface OnBreakUser {
    name: string;
    department: string;
    type: 'break' | 'lunch';
    startTime: string;
}

export default function OnBreakList() {
  const [onBreakUsers, setOnBreakUsers] = useState<OnBreakUser[]>([]);

  useEffect(() => {
    const updateList = () => {
        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const onBreak: OnBreakUser[] = [];
        
        users.forEach(user => {
            const state: Partial<UserState> = JSON.parse(localStorage.getItem(`userState_${user.email}`) || '{}');
            if (state.currentState === 'break' && state.breakStartTime) {
                onBreak.push({ name: user.name, department: user.department, type: 'break', startTime: state.breakStartTime });
            }
            if (state.currentState === 'lunch' && state.lunchStartTime) {
                onBreak.push({ name: user.name, department: user.department, type: 'lunch', startTime: state.lunchStartTime });
            }
        });
        setOnBreakUsers(onBreak);
    };
    
    updateList();
    const interval = setInterval(updateList, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
            <Coffee className="h-5 w-5 mr-2 text-primary"/> Currently On Break
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
        {onBreakUsers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No team members are currently on break or lunch.</p>
          </div>
        ) : (
          onBreakUsers.map((u, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                    <div className="font-medium text-card-foreground">{u.name}</div>
                    <div className="text-sm text-muted-foreground">{u.department}</div>
                    <div className="text-xs text-primary">{u.type === 'break' ? 'Break' : 'Lunch'} started at {new Date(u.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
