
'use server';
import * as admin from 'firebase-admin';
import type { User, ActivityLog } from './types';


// This function ensures the Firebase Admin SDK is initialized, but only once.
const initializeAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    const serviceAccount = {
      projectId: process.env.PROJECT_ID,
      clientEmail: process.env.CLIENT_EMAIL,
      // The private key needs to have its newlines restored.
      privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
    // Throw the error to prevent the app from continuing with a misconfigured state.
    throw new Error("Failed to initialize Firebase Admin SDK: " + error.message);
  }
};

initializeAdmin();

export const db = admin.firestore();
export const adminAuth = admin.auth();


export async function getAllUsersAction(): Promise<{ success: boolean, message: string, users?: User[] }> {
  try {
    const usersCol = db.collection('users');
    const userSnapshot = await usersCol.get();
    
    if (userSnapshot.empty) {
      return {
        success: true,
        message: 'No users found.',
        users: [],
      };
    }
    
    const userList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as User[];
    
    return {
      success: true,
      message: 'Users retrieved successfully.',
      users: userList,
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
