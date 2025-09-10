
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import type { ActivityLog } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { getOverbreaksAction } from '@/lib/firebase-admin';

export default function TeamOverbreakAlerts() {
  const [overbreaks, setOverbreaks] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchOverbreaks = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getOverbreaksAction();
      if (result.success && result.overbreaks) {
        setOverbreaks(result.overbreaks);
      } else {
        console.error("Failed to fetch overbreaks:", result.message);
        setOverbreaks([]);
      }
    } catch (error) {
      console.error("Error fetching overbreaks:", error);
      setOverbreaks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverbreaks();
    const interval = setInterval(fetchOverbreaks, 30000); // Poll for new overbreaks
    return () => clearInterval(interval);
  }, [fetchOverbreaks]);

  return (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive"/> Team Overbreak Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading alerts...</div>
        ) : overbreaks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-green-600">Great news! No team members have exceeded their break limits today.</p>
          </div>
        ) : (
          overbreaks.map(log => {
            const isBreak = log.action === 'Break In';
            const limit = isBreak ? 15 : 60;
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
                         {log.startTime && log.endTime && (
                             <div className="text-xs text-gray-500">From: {log.startTime} To: {log.endTime}</div>
                        )}
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
