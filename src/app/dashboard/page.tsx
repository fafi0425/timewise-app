'use client';
import AuthCheck from '@/components/shared/AuthCheck';
import AppHeader from '@/components/shared/AppHeader';
import StatusCard from '@/components/dashboard/StatusCard';
import SummaryCard from '@/components/dashboard/SummaryCard';
import ActionCard from '@/components/dashboard/ActionCard';
import OnBreakList from '@/components/dashboard/OnBreakList';
import TeamOverbreakAlerts from '@/components/dashboard/TeamOverbreakAlerts';
import ActivityLog from '@/components/dashboard/ActivityLog';
import StatisticsModal from '@/components/dashboard/StatisticsModal';
import { useAuth } from '@/hooks/useAuth';
import useTimeTracker from '@/hooks/useTimeTracker';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    status,
    logActivity,
    activityLog,
    summary,
    countdown,
    startAction,
    endAction,
  } = useTimeTracker();

  const [statsModalOpen, setStatsModalOpen] = useState(false);

  if (!user) return null;

  return (
    <AuthCheck>
        <AppHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 font-headline">
                Welcome Back, <span className="text-accent">{user.name}</span>!
              </h2>
              <p className="text-lg text-foreground">
                Track your breaks and lunch times efficiently
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <StatusCard status={status} countdown={countdown} />
              <SummaryCard summary={summary} />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <ActionCard 
                    type="break"
                    onStart={() => startAction('break')}
                    onEnd={() => endAction('break')}
                    disabled={status.currentState === 'lunch' || (status.currentState === 'break' && !status.breakStartTime)}
                    isActive={status.currentState === 'break'}
                />
                <ActionCard 
                    type="lunch"
                    onStart={() => startAction('lunch')}
                    onEnd={() => endAction('lunch')}
                    disabled={status.currentState === 'break' || (status.currentState === 'lunch' && !status.lunchStartTime)}
                    isActive={status.currentState === 'lunch'}
                />
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <OnBreakList />
                <TeamOverbreakAlerts />
            </div>

            <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 card-shadow mb-8">
              <ActivityLog log={activityLog} />
            </div>
            
            <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 card-shadow text-center">
              <h3 className="text-xl font-semibold text-card-foreground mb-4 font-headline">Personal Statistics</h3>
              <Button onClick={() => setStatsModalOpen(true)}>
                  <BarChart className="mr-2 h-4 w-4" />
                  View My Statistics
              </Button>
            </div>
        </main>
        <StatisticsModal 
            isOpen={statsModalOpen} 
            onClose={() => setStatsModalOpen(false)} 
        />
    </AuthCheck>
  );
}
