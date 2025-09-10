
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { UserState, ActivityLog, User, TimesheetEntry, TimesheetAction } from '@/lib/types';
import { useToast } from './use-toast';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { getUserState, updateUserStateInFirestore, logActivity as logActivityServer, logTimesheetEvent as logTimesheetEventServer, logOverbreak as logOverbreakServer } from '@/lib/firebase-server-actions';

export default function useTimeTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<UserState>({
    currentState: 'clocked_out',
    isClockedIn: false,
    breakStartTime: null,
    lunchStartTime: null,
    totalBreakMinutes: 0,
    totalLunchMinutes: 0,
  });
  const [countdown, setCountdown] = useState({
    display: '00:00',
    progress: 100,
    isActive: false,
    isWarning: false,
    isDanger: false,
  });

  const fetchUserState = useCallback(async () => {
    if (user) {
      const state = await getUserState(user.uid);
      if (state) {
        setStatus(state);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchUserState();
  }, [fetchUserState]);

  const clockIn = useCallback(async () => {
    if (!user) return;

    const newState: UserState = {
        ...status, 
        isClockedIn: true, 
        currentState: 'working',
        // Reset summary stats on new clock-in
        totalBreakMinutes: 0,
        totalLunchMinutes: 0,
        breakStartTime: null,
        lunchStartTime: null,
    };
    setStatus(newState); // Optimistic update
    toast({ title: "Clocked In", description: "Your work session has started." });

    await logTimesheetEventServer(user, 'Clock In');
    await updateUserStateInFirestore(user.uid, newState);
  }, [user, status, toast]);

  const clockOut = useCallback(async () => {
    if (!user) return;
    if (status.currentState === 'break' || status.currentState === 'lunch') {
        toast({ title: "Action Required", description: "Please end your break/lunch before clocking out.", variant: "destructive" });
        return;
    }
    const clockedOutState: UserState = {
        currentState: 'clocked_out',
        isClockedIn: false,
        breakStartTime: null,
        lunchStartTime: null,
        totalBreakMinutes: 0,
        totalLunchMinutes: 0,
    };
    setStatus(clockedOutState); // Optimistic update
    toast({ title: "Clocked Out", description: "Your work session has ended." });

    await logTimesheetEventServer(user, 'Clock Out');
    await updateUserStateInFirestore(user.uid, clockedOutState);
  }, [user, toast, status.currentState]);


  const startAction = useCallback(async (type: 'break' | 'lunch') => {
    if (!user) return;
    const now = new Date().toISOString();
    let newState: UserState;

    if (type === 'break') {
      newState = {...status, currentState: 'break', breakStartTime: now};
      setStatus(newState); // Optimistic update
      await logActivityServer(user, 'Break Out');
    } else {
      newState = {...status, currentState: 'lunch', lunchStartTime: now};
      setStatus(newState); // Optimistic update
      await logActivityServer(user, 'Lunch Out');
    }
    
    await updateUserStateInFirestore(user.uid, newState);

  }, [status, user]);

  const endAction = useCallback(async (type: 'break' | 'lunch') => {
    if (!user) return;

    let duration = 0;
    let startTime: Date | null = null;
    let actionText: 'Break In' | 'Lunch In';
    let timeLimit = 0;
    
    if (type === 'break' && status.breakStartTime) {
        startTime = new Date(status.breakStartTime);
        actionText = 'Break In';
        timeLimit = 15;
    } else if (type === 'lunch' && status.lunchStartTime) {
        startTime = new Date(status.lunchStartTime);
        actionText = 'Lunch In';
        timeLimit = 60;
    } else {
        return; // Should not happen if UI is disabled correctly
    }
    
    const endTime = new Date();
    duration = Math.round((endTime.getTime() - (startTime?.getTime() ?? 0)) / 60000);
    
    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Optimistic UI Update first
    let newState: UserState;
    if (type === 'break') {
         newState = ({
            ...status,
            currentState: 'working',
            breakStartTime: null,
            totalBreakMinutes: status.totalBreakMinutes + duration
        });
    } else {
         newState = ({
            ...status,
            currentState: 'working',
            lunchStartTime: null,
            totalLunchMinutes: status.totalLunchMinutes + duration
        });
    }
    setStatus(newState);

    // Background logging and state sync
    const logData = await logActivityServer(
        user, 
        actionText, 
        duration, 
        formatTime(startTime),
        formatTime(endTime)
    );

    if (duration > timeLimit) {
        toast({ title: "Warning", description: `${actionText.replace(' In', '')} exceeded by ${duration - timeLimit} minutes!`, variant: "destructive" });
        if (logData) {
            await logOverbreakServer(logData);
        }
    }
    
    await updateUserStateInFirestore(user.uid, newState);

  }, [status, user, toast]);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const BREAK_TIME_LIMIT_SECS = 15 * 60;
    const LUNCH_TIME_LIMIT_SECS = 60 * 60;
    let timeLimit = 0;
    let startTime: Date | null = null;

    if (status.currentState === 'break' && status.breakStartTime) {
        timeLimit = BREAK_TIME_LIMIT_SECS;
        startTime = new Date(status.breakStartTime);
    } else if (status.currentState === 'lunch' && status.lunchStartTime) {
        timeLimit = LUNCH_TIME_LIMIT_SECS;
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

  return { status, summary, countdown, startAction, endAction, clockIn, clockOut };
}
