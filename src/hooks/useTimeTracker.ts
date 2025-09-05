
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { UserState, ActivityLog, User, TimesheetEntry, TimesheetAction } from '@/lib/types';
import { useToast } from './use-toast';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

const logTimesheetEvent = async (user: User, action: TimesheetAction) => {
    const newEntry: Omit<TimesheetEntry, 'id'> = {
      uid: user.uid,
      employeeName: user.name,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action,
      timestamp: Date.now()
    };
    await addDoc(collection(db, 'timesheet'), newEntry);
}

export const endWorkSession = async (sessionUser: User) => {
    const newLog: Omit<ActivityLog, 'id'> = {
      uid: sessionUser.uid,
      employeeName: sessionUser.name,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Work Ended',
      duration: null,
      timestamp: Date.now()
    };
    await addDoc(collection(db, 'activity'), newLog);
};

const logOverbreak = async (logData: Omit<ActivityLog, 'id'>) => {
    await addDoc(collection(db, 'overbreaks'), logData);
};

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

  const logActivity = useCallback(async (action: ActivityLog['action'], duration: number | null = null) => {
    if (!user) return;

    const newLog: Omit<ActivityLog, 'id'> = {
      uid: user.uid,
      employeeName: user.name,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action,
      duration,
      timestamp: Date.now()
    };
    
    await addDoc(collection(db, 'activity'), newLog);
    return newLog;

  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const fetchInitialData = async () => {
        const stateDocRef = doc(db, 'userStates', user.uid);
        const stateDocSnap = await getDoc(stateDocRef);
        
        let initialState = status;

        if (stateDocSnap.exists()) {
            initialState = stateDocSnap.data() as UserState;
        }

        const timesheetRef = collection(db, 'timesheet');
        const q = query(
            timesheetRef, 
            where('uid', '==', user.uid), 
            where('date', '==', new Date().toLocaleDateString())
        );
        const timesheetSnapshot = await getDocs(q);
        
        const sortedEntries = timesheetSnapshot.docs
            .map(doc => doc.data() as TimesheetEntry)
            .sort((a, b) => b.timestamp - a.timestamp);

        const latestTimesheetEntry = sortedEntries[0];
        
        if (latestTimesheetEntry && latestTimesheetEntry.action === 'Clock In') {
             setStatus(prev => ({...prev, ...initialState, isClockedIn: true, currentState: 'working'}));
        } else {
             setStatus(prev => ({...prev, ...initialState, isClockedIn: false, currentState: 'clocked_out'}));
        }
    };
    
    fetchInitialData();

  }, [user]);
  
  useEffect(() => {
    if(user) {
        const stateDocRef = doc(db, 'userStates', user.uid);
        setDoc(stateDocRef, status, { merge: true });
    }
  }, [status, user]);

  const clockIn = useCallback(() => {
    if (!user) return;
    setStatus(prev => ({...prev, isClockedIn: true, currentState: 'working'}));
    logTimesheetEvent(user, 'Clock In');
    toast({ title: "Clocked In", description: "Your work session has started." });
  }, [user, toast]);

  const clockOut = useCallback(() => {
    if (!user) return;
    if (status.currentState === 'break' || status.currentState === 'lunch') {
        toast({ title: "Action Required", description: "Please end your break/lunch before clocking out.", variant: "destructive" });
        return;
    }
    setStatus(prev => ({...prev, isClockedIn: false, currentState: 'clocked_out'}));
    logTimesheetEvent(user, 'Clock Out');
    toast({ title: "Clocked Out", description: "Your work session has ended." });
  }, [user, toast, status.currentState]);


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

  const endAction = useCallback(async (type: 'break' | 'lunch') => {
    if (!user) return;

    let duration = 0;
    let startTime = null;
    let actionText: 'Break In' | 'Lunch In';

    if (type === 'break' && status.breakStartTime) {
        startTime = new Date(status.breakStartTime);
        actionText = 'Break In';
    } else if (type === 'lunch' && status.lunchStartTime) {
        startTime = new Date(status.lunchStartTime);
        actionText = 'Lunch In';
    } else {
        return; // No start time found, can't end action
    }

    if(startTime) {
        duration = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
    }
    
    const logData = await logActivity(actionText, duration);

    const BREAK_TIME_LIMIT_MINS = 15;
    const LUNCH_TIME_LIMIT_MINS = 60;

    if (type === 'break') {
      if (duration > BREAK_TIME_LIMIT_MINS) {
        toast({ title: "Warning", description: `Break exceeded by ${duration - BREAK_TIME_LIMIT_MINS} minutes!`, variant: "destructive" });
        await logOverbreak(logData);
      }
      setStatus(prev => ({
          ...prev,
          currentState: 'working',
          breakStartTime: null,
          totalBreakMinutes: prev.totalBreakMinutes + duration
      }));
    } else { // Lunch
       if (duration > LUNCH_TIME_LIMIT_MINS) {
        toast({ title: "Warning", description: `Lunch exceeded by ${duration - LUNCH_TIME_LIMIT_MINS} minutes!`, variant: "destructive" });
        await logOverbreak(logData);
      }
      setStatus(prev => ({
          ...prev,
          currentState: 'working',
          lunchStartTime: null,
          totalLunchMinutes: prev.totalLunchMinutes + duration
      }));
    }
  }, [status, user, toast, logActivity]);


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
