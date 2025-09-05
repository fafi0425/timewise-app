
'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { getAllActivityAction } from '@/lib/firebase-admin';
import type { ActivityLog } from '@/lib/types';
import { BarChart, Clock, Coffee, Utensils } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatisticsModal({ isOpen, onClose }: StatisticsModalProps) {
  const { user } = useAuth();
  const [userActivities, setUserActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      const fetchActivities = async () => {
        const result = await getAllActivityAction();
        if (result.success && result.activities) {
          setUserActivities(result.activities.filter(a => a.uid === user.uid));
        }
      };
      fetchActivities();
    }
  }, [user, isOpen]);

  if (!user) return null;

  const totalBreakOuts = userActivities.filter((a) => a.action === 'Break Out').length;
  const totalLunchOuts = userActivities.filter((a) => a.action === 'Lunch Out').length;

  const breakDurations = userActivities
    .filter((a) => a.action === 'Break In' && a.duration)
    .map((a) => a.duration!);
  const avgBreakTime =
    breakDurations.length > 0
      ? Math.round(breakDurations.reduce((sum, d) => sum + d, 0) / breakDurations.length)
      : 0;

  const lunchDurations = userActivities
    .filter((a) => a.action === 'Lunch In' && a.duration)
    .map((a) => a.duration!);
  const avgLunchTime =
    lunchDurations.length > 0
      ? Math.round(lunchDurations.reduce((sum, d) => sum + d, 0) / lunchDurations.length)
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Employee Statistics</DialogTitle>
          <DialogDescription>Your activity summary.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <Clock className="mx-auto h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Total Activities</p>
                    <p className="text-2xl font-bold text-card-foreground">{userActivities.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                    <Coffee className="mx-auto h-8 w-8 text-secondary mb-2" />
                    <p className="text-sm text-muted-foreground">Total Breaks</p>
                    <p className="text-2xl font-bold text-card-foreground">{totalBreakOuts}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <Utensils className="mx-auto h-8 w-8 text-orange-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Total Lunches</p>
                    <p className="text-2xl font-bold text-card-foreground">{totalLunchOuts}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <BarChart className="mx-auto h-8 w-8 text-purple-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Avg. Break</p>
                    <p className="text-2xl font-bold text-card-foreground">{avgBreakTime} min</p>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
