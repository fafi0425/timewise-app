
'use server';
/**
 * @fileOverview A server-side function to handle retrieving all users from Firestore using the Admin SDK.
 *
 * - getAllUsers - A function that fetches all user documents with admin privileges.
 * - GetAllUsersOutput - The return type for the getAllUsers function.
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
// This is the correct way to ensure it only happens once.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "timewise-8ivr2",
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
  }
}

const db = admin.firestore();

const GetAllUsersOutputSchema = z.object({
  success: z.boolean().describe('Whether the user retrieval was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
  users: z.array(z.any()).optional().describe('An array of user objects.'),
});
export type GetAllUsersOutput = z.infer<typeof GetAllUsersOutputSchema>;

export async function getAllUsers(): Promise<GetAllUsersOutput> {
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
