'use server';
import 'server-only';
import admin from 'firebase-admin';
import type { User, ActivityLog, Shift, TimesheetEntry } from './types';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { dotprompt } from '@genkit-ai/dotprompt';
import path from 'path';
import fs from 'fs';

let app: admin.app.App;

const initializeAdmin = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    
    try {
        const serviceAccount = {
            projectId: process.env.PROJECT_ID,
            clientEmail: process.env.CLIENT_EMAIL,
            privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        return app;
    } catch (error: any) {
        console.error("Firebase Admin SDK initialization error:", error.message);
        throw new Error("Failed to initialize Firebase Admin SDK: " + error.message);
    }
};

const getDb = () => {
    initializeAdmin();
    return getFirestore();
};

const getAdminAuth = () => {
    initializeAdmin();
    return getAuth();
};


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

export async function getAllTimesheetAction(): Promise<{ success: boolean, message: string, timesheet?: TimesheetEntry[] }> {
    try {
      const db = getDb();
      const timesheetCol = db.collection('timesheet').orderBy('timestamp', 'desc');
      const timesheetSnapshot = await timesheetCol.get();
  
      if (timesheetSnapshot.empty) {
          return { success: true, message: 'No timesheet entries found.', timesheet: [] };
      }
  
      const timesheetList = timesheetSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimesheetEntry));
  
      return { success: true, message: 'Timesheet entries retrieved.', timesheet: timesheetList };
    } catch (error) {
       const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error("Error fetching timesheet with Admin SDK:", errorMessage);
      return {
        success: false,
        message: `Failed to retrieve timesheet entries: ${errorMessage}`,
        timesheet: [],
      };
    }
  }

export async function getTimesheetForUserByMonth(uid: string, year: number, month: number): Promise<{ success: boolean, message: string, timesheet?: TimesheetEntry[] }> {
    try {
        const db = getDb();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime();

        const timesheetRef = db.collection('timesheet');
        const q = timesheetRef
            .where('uid', '==', uid)
            .where('timestamp', '>=', startTimestamp)
            .where('timestamp', '<=', endTimestamp)
            .orderBy('timestamp', 'asc');

        const querySnapshot = await q.get();
        if (querySnapshot.empty) {
            return { success: true, message: 'No entries found for this period.', timesheet: [] };
        }

        const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimesheetEntry));
        return { success: true, message: 'Entries retrieved.', timesheet: entries };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error fetching timesheet with Admin SDK:", errorMessage);
        return {
            success: false,
            message: `Failed to retrieve timesheet entries: ${errorMessage}`,
            timesheet: [],
        };
    }
}

// New function to get all users from Firestore
export async function getAllUsersFromFirestore(): Promise<{ success: boolean, users: User[] }> {
    const db = getDb();
    const usersCol = db.collection('users');
    const userSnapshot = await usersCol.get();
    const users = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    return { success: true, users };
}

// New function to get all users from Firebase Auth
export async function getAllUsersFromAuth(): Promise<{ success: boolean, users: admin.auth.UserRecord[] }> {
    const auth = getAdminAuth();
    const userRecords = await auth.listUsers();
    const users = userRecords.users;
    return { success: true, users };
}

// New function to delete a user only from Firestore
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
