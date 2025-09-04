
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Utensils } from 'lucide-react';
import type { User, UserState } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

interface OnBreakUser extends User {
    type: 'break' | 'lunch';
    startTime: string;
}

export default function OnBreakList() {
  const [onBreakUsers, setOnBreakUsers] = useState<OnBreakUser[]>([]);

  useEffect(() => {
    const statesQuery = query(collection(db, "userStates"), where("currentState", "in", ["break", "lunch"]));
    
    const unsubscribe = onSnapshot(statesQuery, async (querySnapshot) => {
        const usersOnBreak: OnBreakUser[] = [];
        if (querySnapshot.empty) {
            setOnBreakUsers([]);
            return;
        }

        const userIds = querySnapshot.docs.map(doc => doc.id);
        if (userIds.length === 0) {
            setOnBreakUsers([]);
            return;
        }

        const usersQuery = query(collection(db, "users"), where("uid", "in", userIds));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data() as User;
            return acc;
        }, {} as Record<string, User>);

        querySnapshot.forEach(doc => {
            const state = doc.data() as UserState;
            const user = usersData[doc.id];
            
            if (user) {
                if (state.currentState === 'break' && state.breakStartTime) {
                    usersOnBreak.push({ ...user, type: 'break', startTime: state.breakStartTime });
                } else if (state.currentState === 'lunch' && state.lunchStartTime) {
                     usersOnBreak.push({ ...user, type: 'lunch', startTime: state.lunchStartTime });
                }
            }
        });
        setOnBreakUsers(usersOnBreak);
    }, (error) => {
        console.error("Error with onBreak snapshot listener:", error);
    });

    return () => unsubscribe();
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
