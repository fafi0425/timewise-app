
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Utensils } from 'lucide-react';
import type { User, UserState } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, getDocs, where } from 'firebase/firestore';

interface OnBreakUser extends User {
    type: 'break' | 'lunch';
    startTime: string;
}

export default function OnBreakList() {
  const [onBreakUsers, setOnBreakUsers] = useState<OnBreakUser[]>([]);

  useEffect(() => {
    // This query now specifically asks for users on break or lunch.
    // The security rules must allow this specific query.
    const statesQuery = query(collection(db, "userStates"), where("currentState", "in", ["break", "lunch"]));
    
    const unsubscribe = onSnapshot(statesQuery, async (querySnapshot) => {
        const userStates: {id: string, data: UserState}[] = [];
        querySnapshot.forEach(doc => {
            userStates.push({ id: doc.id, data: doc.data() as UserState });
        });

        const usersOnBreakOrLunchStates = userStates.filter(
            (s) => s.data.currentState === 'break' || s.data.currentState === 'lunch'
        );

        if (usersOnBreakOrLunchStates.length === 0) {
            setOnBreakUsers([]);
            return;
        }

        const userIds = usersOnBreakOrLunchStates.map(doc => doc.id);
        
        // Ensure userIds is not empty before querying, as "in" queries with empty arrays are invalid.
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

        const finalUsersList = usersOnBreakOrLunchStates.map(stateDoc => {
            const user = usersData[stateDoc.id];
            if (!user) return null;

            if (stateDoc.data.currentState === 'break' && stateDoc.data.breakStartTime) {
                return { ...user, type: 'break', startTime: stateDoc.data.breakStartTime };
            } else if (stateDoc.data.currentState === 'lunch' && stateDoc.data.lunchStartTime) {
                return { ...user, type: 'lunch', startTime: stateDoc.data.lunchStartTime };
            }
            return null;
        }).filter(Boolean) as OnBreakUser[];
        
        setOnBreakUsers(finalUsersList);

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
