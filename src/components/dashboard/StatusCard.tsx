
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { UserState } from '@/lib/types';

interface StatusCardProps {
  status: UserState;
  countdown: {
    display: string;
    progress: number;
    isActive: boolean;
    isWarning: boolean;
    isDanger: boolean;
  };
}

export default function StatusCard({ status, countdown }: StatusCardProps) {
  const getStatusText = () => {
    switch (status.currentState) {
      case 'break':
        return 'On Break';
      case 'lunch':
        return 'At Lunch';
      case 'working':
        return 'Available';
      case 'clocked_out':
        return 'Available';
      default:
        return 'Available';
    }
  };

  const getStatusTime = () => {
    const formatTime = (isoString: string | null) => {
        if (!isoString) return `Started at ${new Date().toLocaleTimeString()}`;
        return `Started at ${new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    switch (status.currentState) {
        case 'break':
            return formatTime(status.breakStartTime);
        case 'lunch':
            return formatTime(status.lunchStartTime);
        case 'working':
            return 'Ready for break or lunch.';
        case 'clocked_out':
            return 'Ready for break or lunch.';
    }
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-semibold text-card-foreground font-headline">Current Status</CardTitle>
        <div
          className={cn(
            'w-4 h-4 rounded-full animate-pulse',
            status.currentState === 'working' ? 'bg-green-500' : 
            status.isClockedIn ? 'bg-yellow-500' : 'bg-green-500' // Show green when not on break/lunch
          )}
        />
      </CardHeader>
      <CardContent className="text-center">
        <div className="text-2xl font-bold text-card-foreground mb-2">{getStatusText()}</div>
        <div className="text-sm text-muted-foreground">{getStatusTime()}</div>
        {countdown.isActive && (
          <div
            className={cn(
              'mt-4 p-3 rounded-lg transition-all',
              countdown.isDanger ? 'bg-red-100' : countdown.isWarning ? 'bg-yellow-100' : 'bg-blue-100'
            )}
          >
            <div
              className={cn(
                'text-3xl font-bold font-code',
                countdown.isDanger ? 'text-red-600' : countdown.isWarning ? 'text-yellow-600' : 'text-primary'
              )}
            >
              {countdown.display}
            </div>
            <div className="text-xs text-muted-foreground">Time Remaining</div>
            <Progress
              value={countdown.progress}
              className={cn('h-2 mt-2',
                countdown.isDanger ? '[&>div]:bg-red-500' : countdown.isWarning ? '[&>div]:bg-yellow-500' : '[&>div]:bg-primary'
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
