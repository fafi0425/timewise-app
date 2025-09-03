
'use server';
/**
 * @fileOverview A flow to handle retrieving all users from Firestore using the Admin SDK.
 *
 * - getAllUsers - A function that fetches all user documents with admin privileges.
 * - GetAllUsersOutput - The return type for the getAllUsers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';
import type { User } from '@/lib/types';

// Define your service account credentials directly or use environment variables
const serviceAccount = {
  projectId: process.env.PROJECT_ID,
  clientEmail: process.env.CLIENT_EMAIL,
  privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  projectId: "timewise-8ivr2",
};

// Initialize the app if it's not already initialized
if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig);
}

const db = admin.firestore();

// This flow does not require any input.
const GetAllUsersInputSchema = z.null();

const GetAllUsersOutputSchema = z.object({
  success: z.boolean().describe('Whether the user retrieval was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
  users: z.array(z.any()).optional().describe('An array of user objects.'),
});
export type GetAllUsersOutput = z.infer<typeof GetAllUsersOutputSchema>;

export async function getAllUsers(): Promise<GetAllUsersOutput> {
  return getAllUsersFlow(null);
}

const getAllUsersFlow = ai.defineFlow(
  {
    name: 'getAllUsersFlow',
    inputSchema: GetAllUsersInputSchema,
    outputSchema: GetAllUsersOutputSchema,
  },
  async () => {
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
);
