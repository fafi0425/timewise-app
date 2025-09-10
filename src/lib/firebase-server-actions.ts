
'use server';
import 'server-only';
import { getFirestore } from 'firebase-admin/firestore';
import type { UserState, ActivityLog, User, TimesheetAction } from './types';
import { getDb } from './firebase-admin-util';

export async function getUserState(uid: string): Promise<UserState | null> {
  const db = getDb();
  const stateDocRef = db.collection('userStates').doc(uid);
  const stateDocSnap = await stateDocRef.get();
  if (stateDocSnap.exists) {
    return stateDocSnap.data() as UserState;
  }
  return null;
}

export async function updateUserStateInFirestore(uid: string, newState: UserState): Promise<void> {
  const db = getDb();
  const stateDocRef = db.collection('userStates').doc(uid);
  await stateDocRef.set(newState, { merge: true });
}

export async function logActivity(
    user: User, 
    action: ActivityLog['action'], 
    duration: number | null = null,
    startTime?: string,
    endTime?: string
): Promise<Omit<ActivityLog, 'id'> | null> {
  if (!user) {
    console.error("User not provided, cannot log activity.");
    return null;
  }
  const db = getDb();
  const newLog: Omit<ActivityLog, 'id'> = {
    uid: user.uid,
    employeeName: user.name,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    action,
    duration,
    timestamp: Date.now(),
    startTime: startTime ?? null,
    endTime: endTime ?? null,
  };
  await db.collection('activity').add(newLog);
  return newLog;
}

export async function logTimesheetEvent(user: User, action: TimesheetAction) {
    if (!user) {
        console.error("User not authenticated, cannot log timesheet event.");
        return;
    }
    const db = getDb();
    const newEntry = {
      uid: user.uid,
      employeeName: user.name,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action,
      timestamp: Date.now()
    };
    await db.collection('timesheet').add(newEntry);
}

export async function logOverbreak(logData: Omit<ActivityLog, 'id'>) {
    const db = getDb();
    await db.collection('overbreaks').add(logData);
}
