
'use server';
import * as admin from 'firebase-admin';
import type { ActivityLog, User } from './types';
import { checkOverbreaksAndAlert, CheckOverbreaksAndAlertInput } from '@/ai/flows/automated-overbreak-alerts';

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


export async function getOverbreakAlertsAction(activityData: ActivityLog[]) {
  try {
    const input: CheckOverbreaksAndAlertInput = {
      activityData: activityData.map(log => ({
          employeeName: log.employeeName,
          date: log.date,
          time: log.time,
          action: log.action,
          duration: log.duration,
      })),
      breakTimeLimit: 15,
      lunchTimeLimit: 60,
    };
    
    // The AI flow might not find overbreaks that our simple logic does, because it analyzes patterns.
    // We will use the AI response if available.
    const result = await checkOverbreaksAndAlert(input);
    
    if (result && result.overbreaks) {
        return result.overbreaks.map(o => ({...o, id: `overbreak_${Math.random()}`}));
    }

    // Fallback to simple logic if AI fails or returns empty
    return activityData.filter(log => 
        (log.action === 'Break In' && (log.duration || 0) > 15) ||
        (log.action === 'Lunch In' && (log.duration || 0) > 60)
    );

  } catch (error) {
    console.error("Error in getOverbreakAlertsAction:", error);
    // Fallback to simple logic on error
    return activityData.filter(log => 
        (log.action === 'Break In' && (log.duration || 0) > 15) ||
        (log.action === 'Lunch In' && (log.duration || 0) > 60)
    );
  }
}
