
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import type { ActivityLog } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { getOverbreaksAction } from '@/lib/firebase-admin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';

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
      <CardContent>
        <ScrollArea className="h-64">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading alerts...</div>
        ) : overbreaks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-green-600">Great news! No team members have exceeded their break limits today.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Exceeded</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {overbreaks.map(log => {
                const isBreak = log.action === 'Break In';
                const limit = isBreak ? 15 : 60;
                const excess = log.duration! - limit;
                const type = isBreak ? 'Break' : 'Lunch';
                const isCurrentUser = user?.uid === log.uid;
                const rowClass = isCurrentUser ? 'bg-orange-100 border-orange-500 hover:bg-orange-100/80' : 'bg-red-100 border-red-500 hover:bg-red-100/80';
                const textClass = isCurrentUser ? 'text-orange-700' : 'text-red-700';

                return (
                    <TableRow key={log.id} className={rowClass}>
                        <TableCell className={`font-medium ${textClass}`}>{isCurrentUser ? 'You' : log.employeeName}</TableCell>
                        <TableCell className={textClass}>{type}</TableCell>
                        <TableCell className={textClass}>{log.startTime || 'N/A'}</TableCell>
                        <TableCell className={textClass}>{log.endTime || 'N/A'}</TableCell>
                        <TableCell className={`${textClass} font-bold`}>{excess} min</TableCell>
                    </TableRow>
                );
            })}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
      </CardContent>
    </Card>
  );
}
