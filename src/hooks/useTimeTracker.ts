'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { UserState, ActivityLog } from '@/lib/types';
import { useToast } from './use-toast';

const BREAK_TIME_LIMIT = 15 * 60; // 15 minutes in seconds
const LUNCH_TIME_LIMIT = 60 * 60; // 60 minutes in seconds

export const getActivityLog = (): ActivityLog[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('activityLog') || '[]');
}

const saveActivityLog = (log: ActivityLog[]) => {
    localStorage.setItem('activityLog', JSON.stringify(log));
}

export default function useTimeTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<UserState>({
    currentState: 'working',
    breakStartTime: null,
    lunchStartTime: null,
    totalBreakMinutes: 0,
    totalLunchMinutes: 0,
  });
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [countdown, setCountdown] = useState({
    display: '00:00',
    progress: 100,
    isActive: false,
    isWarning: false,
    isDanger: false,
  });

  const logActivity = useCallback((action: ActivityLog['action'], duration: number | null = null) => {
    if (!user) return;

    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      uid: user.uid,
      employeeName: user.name,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action,
      duration,
    };
    
    setActivityLog(prev => [newLog, ...prev]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const allLogs = getActivityLog();
    const userTodayLogs = allLogs.filter(log => log.uid === user.uid && log.date === new Date().toLocaleDateString());
    setActivityLog(userTodayLogs);

    const savedState: Partial<UserState> = JSON.parse(localStorage.getItem(`userState_${user.email}`) || '{}');
    if (savedState.currentState) {
        setStatus(prev => ({...prev, ...savedState}));
    } else {
        logActivity('Work Started');
    }
  }, [user, logActivity]);
  
  useEffect(() => {
    if(user) {
        localStorage.setItem(`userState_${user.email}`, JSON.stringify(status));
    }
    const allLogs = getActivityLog();
    const otherLogs = allLogs.filter(log => log.id !== activityLog[0]?.id);
    saveActivityLog([...activityLog, ...otherLogs]);

  }, [status, activityLog, user]);

  const startAction = useCallback((type: 'break' | 'lunch') => {
    const now = new Date().toISOString();
    if (type === 'break') {
      setStatus(prev => ({...prev, currentState: 'break', breakStartTime: now}));
      logActivity('Break Out');
    } else {
      setStatus(prev => ({...prev, currentState: 'lunch', lunchStartTime: now}));
      logActivity('Lunch Out');
    }
  }, [logActivity]);

  const endAction = useCallback((type: 'break' | 'lunch') => {
    let duration = 0;
    let startTime = null;

    if (type === 'break' && status.breakStartTime) {
        startTime = new Date(status.breakStartTime);
    } else if (type === 'lunch' && status.lunchStartTime) {
        startTime = new Date(status.lunchStartTime);
    }

    if(startTime) {
        duration = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
    }

    if (type === 'break') {
      logActivity('Break In', duration);
      setStatus(prev => ({
          ...prev,
          currentState: 'working',
          breakStartTime: null,
          totalBreakMinutes: prev.totalBreakMinutes + duration
      }));
      if (duration > BREAK_TIME_LIMIT / 60) {
        toast({ title: "Warning", description: `Break exceeded by ${duration - (BREAK_TIME_LIMIT/60)} minutes!`, variant: "destructive" });
      }
    } else {
      logActivity('Lunch In', duration);
      setStatus(prev => ({
          ...prev,
          currentState: 'working',
          lunchStartTime: null,
          totalLunchMinutes: prev.totalLunchMinutes + duration
      }));
       if (duration > LUNCH_TIME_LIMIT / 60) {
        toast({ title: "Warning", description: `Lunch exceeded by ${duration - (LUNCH_TIME_LIMIT/60)} minutes!`, variant: "destructive" });
      }
    }
  }, [logActivity, status, toast]);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let timeLimit = 0;
    let startTime: Date | null = null;

    if (status.currentState === 'break' && status.breakStartTime) {
        timeLimit = BREAK_TIME_LIMIT;
        startTime = new Date(status.breakStartTime);
    } else if (status.currentState === 'lunch' && status.lunchStartTime) {
        timeLimit = LUNCH_TIME_LIMIT;
        startTime = new Date(status.lunchStartTime);
    }
    
    if (startTime) {
      setCountdown(prev => ({...prev, isActive: true}));
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime!.getTime()) / 1000);
        const remaining = timeLimit - elapsed;
        
        if (remaining <= 0) {
            setCountdown({
                display: '00:00',
                progress: 0,
                isActive: true,
                isWarning: false,
                isDanger: true
            });
            return;
        }

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;

        setCountdown({
            display: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
            progress: (remaining / timeLimit) * 100,
            isActive: true,
            isDanger: remaining <= 60,
            isWarning: remaining > 60 && remaining <= 300,
        });

      }, 1000);
    } else {
        setCountdown({ display: '00:00', progress: 100, isActive: false, isWarning: false, isDanger: false });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.currentState, status.breakStartTime, status.lunchStartTime]);

  const summary = {
    totalBreakTime: status.totalBreakMinutes,
    totalLunchTime: status.totalLunchMinutes,
    totalWorkTime: `${Math.floor((480 - status.totalBreakMinutes - status.totalLunchMinutes) / 60)}h ${ (480 - status.totalBreakMinutes - status.totalLunchMinutes) % 60}m`
  }

  return { status, logActivity, activityLog, summary, countdown, startAction, endAction };
}
