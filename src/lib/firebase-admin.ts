
'use server';
import 'server-only';
import admin from 'firebase-admin';
import type { User, ActivityLog, Shift, TimesheetEntry, UserState } from './types';
import { getDb, getAdminAuth } from './firebase-admin-util';

export async function getAllUsersAction(): Promise<{ success: boolean, message: string, users?: User[] }> {
  try {
    const firestoreUsers = await getAllUsersFromFirestore();
    return {
      success: true,
      message: 'Users retrieved successfully.',
      users: firestoreUsers.users,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    console.error("Error fetching users with Admin SDK:", errorMessage);
    return {
      success: false,
      message: `Failed to retrieve users: ${errorMessage}`,
      users: [],
    };
  }
}

export async function getAllActivityAction(): Promise<{ success: boolean, message: string, activities?: ActivityLog[] }> {
  try {
    const db = getDb();
    const activityCol = db.collection('activity').orderBy('timestamp', 'desc');
    const activitySnapshot = await activityCol.get();

    if (activitySnapshot.empty) {
        return { success: true, message: 'No activity found.', activities: [] };
    }

    const activityList = activitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));

    return { success: true, message: 'Activity logs retrieved.', activities: activityList };
  } catch (error) {
     const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    console.error("Error fetching activity with Admin SDK:", errorMessage);
    return {
      success: false,
      message: `Failed to retrieve activity logs: ${errorMessage}`,
      activities: [],
    };
  }
}

export async function getOverbreaksAction(): Promise<{ success: boolean, message: string, overbreaks?: ActivityLog[] }> {
    try {
        const db = getDb();
        
        const overbreaksCol = db.collection('overbreaks').orderBy('timestamp', 'desc');
            
        const overbreaksSnapshot = await overbreaksCol.get();

        if (overbreaksSnapshot.empty) {
            return { success: true, message: 'No overbreaks found.', overbreaks: [] };
        }

        const overbreaksList = overbreaksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
        return { success: true, message: 'Overbreaks retrieved successfully.', overbreaks: overbreaksList };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error fetching overbreaks with Admin SDK:", errorMessage);
        return {
            success: false,
            message: `Failed to retrieve overbreaks: ${errorMessage}`,
            overbreaks: [],
        };
    }
}

export async function getAllUsersFromFirestore(): Promise<{ success: boolean, users: User[] }> {
    const db = getDb();
    const usersCol = db.collection('users');
    const userSnapshot = await usersCol.get();
    const users = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    return { success: true, users };
}

export async function getAllUsersFromAuth(): Promise<{ success: boolean, users: admin.auth.UserRecord[] }> {
    const auth = getAdminAuth();
    const userRecords = await auth.listUsers();
    const users = userRecords.users;
    return { success: true, users };
}

export async function deleteUserFromFirestore(uid: string): Promise<void> {
    const db = getDb();
    console.log(`Deleting user ${uid} from Firestore collections.`);
    try {
        await db.collection('users').doc(uid).delete();
        await db.collection('userStates').doc(uid).delete();
    } catch (e) {
        console.error(`Error deleting user ${uid} from Firestore:`, e);
        throw e;
    }
}

export async function updateUserShiftInFirestore(userId: string, shift: Shift): Promise<void> {
    const db = getDb();
    const userRef = db.collection('users').doc(userId);
    console.log(`Updating shift for user ${userId} to ${shift} in Firestore.`);
    try {
        await userRef.update({ shift: shift });
    } catch (error) {
        console.error(`Error updating shift for user ${userId} in Firestore:`, error);
        throw error;
    }
}


export async function getUsersOnBreakOrLunch() {
    try {
        const db = getDb();
        const statesQuery = db.collection("userStates").where('currentState', 'in', ['break', 'lunch']);
        const statesSnapshot = await statesQuery.get();

        if (statesSnapshot.empty) {
            return { success: true, users: [] };
        }

        const userIds = statesSnapshot.docs.map(doc => doc.id);
        if (userIds.length === 0) {
            return { success: true, users: [] };
        }
        
        const usersQuery = db.collection("users").where(admin.firestore.FieldPath.documentId(), "in", userIds);
        const usersSnapshot = await usersQuery.get();
        const usersData = usersSnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data() as User;
            return acc;
        }, {} as Record<string, User>);

        const combinedData = statesSnapshot.docs.map(stateDoc => {
            const user = usersData[stateDoc.id];
            const state = stateDoc.data() as UserState;
            if (!user) return null;

            return {
                ...user,
                type: state.currentState as 'break' | 'lunch',
                startTime: state.currentState === 'break' ? state.breakStartTime : state.lunchStartTime,
            };
        }).filter(Boolean);

        return { success: true, users: combinedData };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error fetching users on break/lunch:", errorMessage);
        return { success: false, message: `Failed to retrieve users: ${errorMessage}`, users: [] };
    }
}

export async function getUserStates(uids: string[]): Promise<{ success: boolean; states?: Record<string, UserState>; message?: string }> {
  if (uids.length === 0) {
    return { success: true, states: {} };
  }
  try {
    const db = getDb();
    const statesQuery = uids.map(uid => db.collection('userStates').doc(uid));
    const statesSnapshot = await db.getAll(...statesQuery);
    
    const states = statesSnapshot.reduce((acc, doc) => {
      if (doc.exists) {
        acc[doc.id] = doc.data() as UserState;
      }
      return acc;
    }, {} as Record<string, UserState>);
    
    return { success: true, states };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to retrieve user states: ${errorMessage}` };
  }
}
