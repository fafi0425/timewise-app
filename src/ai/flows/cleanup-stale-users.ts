
'use server';
/**
 * @fileOverview A flow to clean up stale users from the online-users collection in Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (getApps().length === 0) {
    initializeApp();
}
const db = getFirestore();

export const cleanupStaleUsersFlow = ai.defineFlow(
  {
    name: 'cleanupStaleUsersFlow',
    inputSchema: z.object({
        timeoutMinutes: z.number().default(5).describe('The number of minutes of inactivity after which a user is considered stale.')
    }),
    outputSchema: z.object({
        deletedCount: z.number().describe('The number of stale users that were deleted.')
    }),
  },
  async ({ timeoutMinutes }) => {
    const staleThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    const onlineUsersRef = db.collection('online-users');
    
    const staleUsersSnapshot = await onlineUsersRef.where('lastSeen', '<', staleThreshold).get();
    
    if (staleUsersSnapshot.empty) {
        return { deletedCount: 0 };
    }

    const batch = db.batch();
    staleUsersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    return { deletedCount: staleUsersSnapshot.size };
  }
);
