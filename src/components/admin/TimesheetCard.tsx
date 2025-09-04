
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';
import type { TimesheetEntry } from '@/lib/types';
import { Badge } from '../ui/badge';

interface TimesheetCardProps {
    timesheet: TimesheetEntry[];
}

const getActionBadgeVariant = (action: TimesheetEntry['action']) => {
    switch (action) {
      case 'Clock In':
        return 'secondary';
      case 'Clock Out':
        return 'destructive';
      default:
        return 'outline';
    }
  };

export default function TimesheetCard({ timesheet }: TimesheetCardProps) {
  return (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6">
        <CardHeader className="!p-0 !pb-6">
            <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" /> Employee Timesheet
            </CardTitle>
        </CardHeader>
        <ScrollArea className="h-80 pr-4">
            <div className="space-y-3">
                {timesheet.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No timesheet entries found.</p>
                ) : (
                    timesheet.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div>
                                <p className="font-medium text-card-foreground">{entry.employeeName}</p>
                                <p className="text-xs text-muted-foreground">{entry.date} at {entry.time}</p>
                            </div>
                            <Badge variant={getActionBadgeVariant(entry.action)}>{entry.action}</Badge>
                        </div>
                    ))
                )}
            </div>
        </ScrollArea>
    </Card>
  );
}
