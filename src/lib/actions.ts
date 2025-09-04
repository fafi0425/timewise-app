
'use server';
// This is the critical line that was missing. It loads the environment variables.
require('dotenv').config(); 

import * as admin from 'firebase-admin';
import type { User, ActivityLog } from './types';

// Initialize the service account credentials from environment variables
const serviceAccount = {
  projectId: process.env.PROJECT_ID,
  clientEmail: process.env.CLIENT_EMAIL,
  // The private key needs to have its escaped newlines replaced with actual newlines.
  privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize the Firebase Admin app if it's not already initialized.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully for actions.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
  }
}

const db = admin.firestore();


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
