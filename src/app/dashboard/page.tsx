
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useTimeTracker from '@/hooks/useTimeTracker';
import AppHeader from '@/components/shared/AppHeader';
import AuthCheck from '@/components/shared/AuthCheck';
import ActionCard from '@/components/dashboard/ActionCard';
import StatusCard from '@/components/dashboard/StatusCard';
import SummaryCard from '@/components/dashboard/SummaryCard';
import OnBreakList from '@/components/dashboard/OnBreakList';
import TeamOverbreakAlerts from '@/components/dashboard/TeamOverbreakAlerts';
import StatisticsModal from '@/components/dashboard/StatisticsModal';
import { Button } from '@/components/ui/button';
import { BarChart2, Clock } from 'lucide-react';
import OnShiftList from '@/components/dashboard/OnShiftList';
import { Card, CardContent } from '@/components/ui/card';
import { getAllUsersAction } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import OverbreakAlert from '@/components/dashboard/OverbreakAlert';

export default function DashboardPage() {
  const { user } = useAuth();
  const { status, summary, countdown, startAction, endAction, isOverbreakAlertOpen, setOverbreakAlertOpen } = useTimeTracker();
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    const usersResult = await getAllUsersAction();
    if (usersResult.success && usersResult.users) {
        setAllUsers(usersResult.users);
    } else {
       toast({ title: "Error", description: "Could not load user data.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <AuthCheck>
      <AppHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-headline">
                    Welcome back, {user?.name.split(' ')[0]}!
                </h2>
                <p className="text-lg text-foreground">
                    Ready for another productive day? Let's get to it.
                </p>
            </div>
            <Button onClick={() => setIsStatsModalOpen(true)}>
                <BarChart2 className="mr-2" />
                View My Stats
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <StatusCard status={status} countdown={countdown} />
             <div className="grid sm:grid-cols-2 gap-8">
              <ActionCard
                type="break"
                onStart={() => startAction('break')}
                onEnd={() => endAction('break')}
                disabled={status.currentState !== 'working'}
                isActive={status.currentState === 'break'}
              />
              <ActionCard
                type="lunch"
                onStart={() => startAction('lunch')}
                onEnd={() => endAction('lunch')}
                disabled={status.currentState !== 'working'}
                isActive={status.currentState === 'lunch'}
              />
            </div>
            <div className="space-y-8">
                <TeamOverbreakAlerts />
                <OnShiftList allUsers={allUsers} />
            </div>
          </div>
          
          <div className="space-y-8">
            <SummaryCard summary={summary} />
            <OnBreakList />
          </div>
        </div>
        
         <StatisticsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} />
         <OverbreakAlert isOpen={isOverbreakAlertOpen} onAcknowledge={() => setOverbreakAlertOpen(false)} />
      </main>
    </AuthCheck>
  );
}
