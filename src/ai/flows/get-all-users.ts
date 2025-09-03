
'use server';
/**
 * @fileOverview A server-side function to handle retrieving all users from Firestore using the Admin SDK.
 * This file is NOT a Genkit flow, but a standard server function that will be converted into a Next.js Server Action.
 *
 * - getAllUsers - A function that fetches all user documents with admin privileges.
 */

import { z } from 'genkit';
import * as admin from 'firebase-admin';
import type { User } from '@/lib/types';

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
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
  }
}

const db = admin.firestore();

// This function is intended to be used as a Server Action.
// It will be moved to `lib/actions.ts` to formalize this pattern.
export async function getAllUsers(): Promise<{ success: boolean; message: string; users: User[] }> {
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
