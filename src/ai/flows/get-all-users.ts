'use server';
/**
 * @fileOverview A secure flow for administrators to fetch all user data.
 *
 * - getAllUsers - Fetches all users from the Firestore database.
 * - GetAllUsersOutput - The return type for the getAllUsers function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

// No input is needed for this flow.
const GetAllUsersInputSchema = z.null();

const UserSchema = z.object({
  uid: z.string(),
  name: z.string(),
  email: z.string(),
  department: z.string(),
  role: z.string(),
  shift: z.string().optional().default('none'),
});

const GetAllUsersOutputSchema = z.object({
  users: z.array(UserSchema),
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
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(
        (doc) => ({ uid: doc.id, ...doc.data() } as User)
      );

      // We need to ensure the data matches the Zod schema before returning.
      const validatedUsers = userList.map(user => ({
          uid: user.uid,
          name: user.name,
          email: user.email,
          department: user.department,
          role: user.role,
          shift: user.shift || 'none'
      }));

      return { users: validatedUsers };
    } catch (e) {
      console.error('Error fetching users from Firestore in flow:', e);
      return { users: [] };
    }
  }
);
