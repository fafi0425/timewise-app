
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
import type { User } from '@/lib/types';
import { getAllUsersAction } from '@/lib/firebase-admin';

export default function DashboardPage() {
  const { user } = useAuth();
  const { status, summary, countdown, startAction, endAction, clockIn, clockOut } = useTimeTracker();
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const fetchUsers = useCallback(async () => {
    const usersResult = await getAllUsersAction();
    if (usersResult.success && usersResult.users) {
      setAllUsers(usersResult.users);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 60000); // Periodically refresh user list
    return () => clearInterval(interval);
  }, [fetchUsers]);

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
             <div className="grid sm:grid-cols-3 gap-8">
               <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
                <CardContent className="text-center pt-6">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                     <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-4 font-headline">Time Clock</h3>
                  <div className="space-y-3">
                     <Button
                        onClick={clockIn}
                        className="w-full font-semibold py-6 rounded-xl transition-all duration-300 transform hover:scale-105 bg-accent hover:bg-accent/90"
                        disabled={status.isClockedIn}
                     >
                        Clock In
                     </Button>
                     <Button
                        onClick={clockOut}
                        variant="outline"
                        className="w-full font-semibold py-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                        disabled={!status.isClockedIn || status.currentState !== 'working'}
                     >
                        Clock Out
                     </Button>
                  </div>
                </CardContent>
               </Card>
              <ActionCard
                type="break"
                onStart={() => startAction('break')}
                onEnd={() => endAction('break')}
                disabled={!status.isClockedIn || status.currentState !== 'working'}
                isActive={status.currentState === 'break'}
              />
              <ActionCard
                type="lunch"
                onStart={() => startAction('lunch')}
                onEnd={() => endAction('lunch')}
                disabled={!status.isClockedIn || status.currentState !== 'working'}
                isActive={status.currentState === 'lunch'}
              />
            </div>
            <div className="space-y-8">
                <TeamOverbreakAlerts />
                <OnShiftList allUsers={allUsers} />
            </div>
          </div>
          
          <div className="space-y-8">
            <StatusCard status={status} countdown={countdown} />
            <SummaryCard summary={summary} />
            <OnBreakList />
          </div>
        </div>
        
         <StatisticsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} />
      </main>
    </AuthCheck>
  );
}
