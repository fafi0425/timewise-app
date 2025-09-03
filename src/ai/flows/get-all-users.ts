'use server';
/**
 * @fileOverview A flow to handle retrieving all users from Firestore.
 *
 * - getAllUsers - A function that fetches all user documents.
 * - GetAllUsersOutput - The return type for the getAllUsers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

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
      const usersCol = collection(db, 'users');
      const userSnapshot = await getDocs(usersCol);
      const userList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as User[];
      
      return {
        success: true,
        message: 'Users retrieved successfully.',
        users: userList,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error("Error fetching users from Firestore:", errorMessage);
      return {
        success: false,
        message: `Failed to retrieve users: ${errorMessage}`,
        users: [],
      };
    }
  }
);
