'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ActivityLog as ActivityLogType } from '@/lib/types';

const getActionBadgeVariant = (action: ActivityLogType['action']) => {
  switch (action) {
    case 'Work Started':
    case 'Break In':
    case 'Lunch In':
      return 'secondary';
    case 'Break Out':
    case 'Lunch Out':
      return 'default';
    default:
      return 'outline';
  }
};

export default function ActivityLog({ log }: { log: ActivityLogType[] }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-card-foreground font-headline">Today's Activity Log</h3>
        {/* Export button can be added here if needed */}
      </div>
      <ScrollArea className="h-64">
        <div className="space-y-4">
          {log.length > 0 ? (
            log.slice().reverse().map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">
                    {item.action}
                    {item.duration && <span className="text-muted-foreground text-xs"> ({item.duration} min)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.time}
                  </p>
                </div>
                <Badge variant={getActionBadgeVariant(item.action)}>{item.action.split(' ')[0]}</Badge>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-10">No activity recorded today.</div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
