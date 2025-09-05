
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import type { ActivityLog } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const BREAK_LIMIT = 15;
const LUNCH_LIMIT = 60;

export default function TeamOverbreakAlerts() {
  const [overbreaks, setOverbreaks] = useState<ActivityLog[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const q = collection(db, "overbreaks");
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const todayStr = new Date().toLocaleDateString();
        const allOverbreaks: ActivityLog[] = [];
        
        querySnapshot.forEach((doc) => {
            allOverbreaks.push({ id: doc.id, ...doc.data() } as ActivityLog);
        });

        const todaysOverbreaks = allOverbreaks.filter(log => log.date === todayStr);
        todaysOverbreaks.sort((a, b) => b.timestamp - a.timestamp);
        
        setOverbreaks(todaysOverbreaks);
    }, (error) => {
        console.error("Error in TeamOverbreakAlerts snapshot listener:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive"/> Team Overbreak Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
        {overbreaks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-green-600">Great news! No team members have exceeded their break limits today.</p>
          </div>
        ) : (
          overbreaks.map(log => {
            const isBreak = log.action === 'Break In';
            const limit = isBreak ? BREAK_LIMIT : LUNCH_LIMIT;
            const excess = log.duration! - limit;
            const type = isBreak ? 'Break' : 'Lunch';
            const isCurrentUser = user?.uid === log.uid;

            return (
                <div key={log.id} className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${isCurrentUser ? 'bg-orange-100 border-orange-500' : 'bg-red-100 border-red-500'}`}>
                    <div>
                        <div className={`font-medium ${isCurrentUser ? 'text-orange-700' : 'text-red-700'}`}>
                            {isCurrentUser ? 'You' : log.employeeName}
                        </div>
                        <div className={`text-sm ${isCurrentUser ? 'text-orange-600' : 'text-red-600'}`}>
                            {type} exceeded by {excess} minutes ({log.duration}/{limit} min)
                        </div>
                        <div className="text-xs text-gray-500">{log.date} at {log.time}</div>
                    </div>
                    <div className="text-xl">
                        <AlertTriangle className={isCurrentUser ? 'text-orange-500' : 'text-red-500'} />
                    </div>
              </div>
            );
        })
        )}
      </CardContent>
    </Card>
  );
}
