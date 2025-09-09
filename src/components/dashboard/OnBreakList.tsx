
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Utensils } from 'lucide-react';
import type { User, ActivityLog } from '@/lib/types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAllUsersAction } from '@/lib/firebase-admin';

interface OnBreakUser extends User {
    type: 'break' | 'lunch';
    startTime: string | null;
}

export default function OnBreakList() {
  const [onBreakUsers, setOnBreakUsers] = useState<OnBreakUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
        const result = await getAllUsersAction();
        if (result.success && result.users) {
            setAllUsers(result.users);
        }
    }
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (allUsers.length === 0) return;

    const q = query(collection(db, "userStates"), where('currentState', 'in', ['break', 'lunch']));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const usersOnBreak: OnBreakUser[] = [];
        snapshot.forEach(doc => {
            const state = doc.data();
            const user = allUsers.find(u => u.uid === doc.id);
            if (user) {
                usersOnBreak.push({
                    ...user,
                    type: state.currentState as 'break' | 'lunch',
                    startTime: state.currentState === 'break' ? state.breakStartTime : state.lunchStartTime
                });
            }
        });
        setOnBreakUsers(usersOnBreak);
    }, (error) => {
        console.error("Error fetching on-break users:", error);
    });

    return () => unsubscribe();
  }, [allUsers]);

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
