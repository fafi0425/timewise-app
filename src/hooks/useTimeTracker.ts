
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
  onSnapshot
} from 'firebase/firestore';

const logTimesheetEvent = async (user: User, action: TimesheetAction) => {
    if (!user) {
        console.error("User not authenticated, cannot log timesheet event.");
        return;
    }
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

  const logActivity = useCallback(async (action: ActivityLog['action'], duration: number | null = null): Promise<Omit<ActivityLog, 'id'>> => {
    if (!user) {
        console.error("User not authenticated, cannot log activity.");
        throw new Error("User not found for logging activity");
    }

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
  
  const updateUserStateInFirestore = useCallback(async (newState: UserState) => {
    if (user) {
      const stateDocRef = doc(db, 'userStates', user.uid);
      await setDoc(stateDocRef, newState, { merge: true });
    }
  }, [user]);


  useEffect(() => {
    if (!user) return;
    
    const stateDocRef = doc(db, 'userStates', user.uid);
    
    const unsubscribe = onSnapshot(stateDocRef, (stateDocSnap) => {
        if (stateDocSnap.exists()) {
            setStatus(stateDocSnap.data() as UserState);
        } else {
             const defaultState: UserState = {
                currentState: 'clocked_out',
                isClockedIn: false,
                breakStartTime: null,
                lunchStartTime: null,
                totalBreakMinutes: 0,
                totalLunchMinutes: 0,
             };
             setStatus(defaultState);
             setDoc(stateDocRef, defaultState);
        }
    }, (error) => {
        console.error("Error in user state listener:", error);
    });

    return () => unsubscribe();

  }, [user]);

  const clockIn = useCallback(() => {
    if (!user) return;

    // Optimistic update
    const newState: UserState = {...status, isClockedIn: true, currentState: 'working'};
    setStatus(newState);
    
    toast({ title: "Clocked In", description: "Your work session has started." });

    // Background tasks
    logTimesheetEvent(user, 'Clock In');
    updateUserStateInFirestore(newState);
  }, [user, status, toast, updateUserStateInFirestore]);

  const clockOut = useCallback(() => {
    if (!user) return;
    if (status.currentState === 'break' || status.currentState === 'lunch') {
        toast({ title: "Action Required", description: "Please end your break/lunch before clocking out.", variant: "destructive" });
        return;
    }
    // Optimistic update
    const clockedOutState: UserState = {
        currentState: 'clocked_out',
        isClockedIn: false,
        breakStartTime: null,
        lunchStartTime: null,
        totalBreakMinutes: 0,
        totalLunchMinutes: 0,
    };
    setStatus(clockedOutState);
    
    toast({ title: "Clocked Out", description: "Your work session has ended." });
    
    // Background tasks
    logTimesheetEvent(user, 'Clock Out');
    updateUserStateInFirestore(clockedOutState);
  }, [user, toast, status.currentState, updateUserStateInFirestore]);


  const startAction = useCallback((type: 'break' | 'lunch') => {
    const now = new Date().toISOString();
    let newState: UserState;

    if (type === 'break') {
      newState = {...status, currentState: 'break', breakStartTime: now};
      setStatus(newState);
      logActivity('Break Out');
    } else {
      newState = {...status, currentState: 'lunch', lunchStartTime: now};
      setStatus(newState);
      logActivity('Lunch Out');
    }
    
    updateUserStateInFirestore(newState);

  }, [status, logActivity, updateUserStateInFirestore]);

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
        return;
    }

    duration = Math.round((new Date().getTime() - (startTime?.getTime() ?? 0)) / 60000);
    
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
    const logData = await logActivity(actionText, duration);
    if (duration > timeLimit) {
        toast({ title: "Warning", description: `${actionText.replace(' In', '')} exceeded by ${duration - timeLimit} minutes!`, variant: "destructive" });
        await logOverbreak(logData);
    }
    
    await updateUserStateInFirestore(newState);

  }, [status, user, toast, logActivity, updateUserStateInFirestore]);


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
