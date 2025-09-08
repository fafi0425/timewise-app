'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Utensils } from 'lucide-react';
import type { User, UserState } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

interface OnBreakUser extends User {
    type: 'break' | 'lunch';
    startTime: string | null;
}

export default function OnBreakList() {
  const [onBreakUsers, setOnBreakUsers] = useState<OnBreakUser[]>([]);

  useEffect(() => {
    // Query for users who are on break or lunch
    const statesQuery = query(
      collection(db, "userStates"),
      where('currentState', 'in', ['break', 'lunch'])
    );

    const unsubscribe = onSnapshot(statesQuery, async (statesSnapshot) => {
      if (statesSnapshot.empty) {
        setOnBreakUsers([]);
        return;
      }

      const userIds = statesSnapshot.docs.map(doc => doc.id);
      
      // Get the corresponding user documents
      const usersQuery = query(collection(db, "users"), where('__name__', 'in', userIds));
      const usersSnapshot = await getDocs(usersQuery);

      const usersData = usersSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data() as User;
        return acc;
      }, {} as Record<string, User>);

      const combinedData = statesSnapshot.docs.map(stateDoc => {
        const user = usersData[stateDoc.id];
        const state = stateDoc.data() as UserState;
        if (!user) return null;

        return {
          ...user,
          type: state.currentState as 'break' | 'lunch',
          startTime: state.currentState === 'break' ? state.breakStartTime : state.lunchStartTime,
        };
      }).filter((user): user is OnBreakUser => user !== null);

      setOnBreakUsers(combinedData);
    }, (error) => {
        console.error("Error fetching users on break/lunch:", error);
    });

    // Cleanup the listener when the component unmounts
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
