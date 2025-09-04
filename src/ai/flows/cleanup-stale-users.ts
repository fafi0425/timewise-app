'use server';
/**
 * @fileOverview A flow to handle cleaning up stale or invalid user accounts.
 *
 * - cleanupStaleUsers - A function that identifies and processes users that may be stale.
 * - CleanupStaleUsersInput - The input type for the cleanupStaleUsers function.
 * - CleanupStaleUsersOutput - The return type for the cleanupStaleUsers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { deleteUserFromFirestore, getAllUsersFromAuth, getAllUsersFromFirestore } from '@/lib/firebase-admin';

// This flow currently does not require any specific input from the client.
const CleanupStaleUsersInputSchema = z.object({});
export type CleanupStaleUsersInput = z.infer<typeof CleanupStaleUsersInputSchema>;

const CleanupStaleUsersOutputSchema = z.object({
  success: z.boolean().describe('Whether the cleanup process was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
  cleanedUserIds: z.array(z.string()).optional().describe('A list of user IDs that were cleaned up.'),
});
export type CleanupStaleUsersOutput = z.infer<typeof CleanupStaleUsersOutputSchema>;

export async function cleanupStaleUsers(
  input: CleanupStaleUsersInput
): Promise<CleanupStaleUsersOutput> {
  return cleanupStaleUsersFlow(input);
}

const cleanupStaleUsersFlow = ai.defineFlow(
  {
    name: 'cleanupStaleUsersFlow',
    inputSchema: CleanupStaleUsersInputSchema,
    outputSchema: CleanupStaleUsersOutputSchema,
  },
  async () => {
    try {
      const [authUsersResult, firestoreUsersResult] = await Promise.all([
        getAllUsersFromAuth(),
        getAllUsersFromFirestore()
      ]);
      
      if (!authUsersResult.success || !firestoreUsersResult.success) {
        throw new Error('Failed to fetch users from auth or firestore.');
      }

      const authUids = new Set(authUsersResult.users.map(u => u.uid));
      const staleFirestoreUsers = firestoreUsersResult.users.filter(u => !authUids.has(u.uid));

      if (staleFirestoreUsers.length === 0) {
        return {
          success: true,
          message: 'User database is already synchronized. No stale users found.',
          cleanedUserIds: [],
        };
      }

      const cleanedUserIds: string[] = [];
      for (const user of staleFirestoreUsers) {
        await deleteUserFromFirestore(user.uid);
        cleanedUserIds.push(user.uid);
      }

      return {
        success: true,
        message: `Successfully cleaned up ${cleanedUserIds.length} stale user(s).`,
        cleanedUserIds,
      };

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        success: false,
        message: `Failed to execute user cleanup process: ${errorMessage}`,
        cleanedUserIds: []
      };
    }
  }
);
