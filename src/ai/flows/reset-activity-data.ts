'use server';
/**
 * @fileOverview A flow to reset all user activity data.
 *
 * This flow deletes all documents from the 'activity' and 'overbreaks' collections.
 * It is a destructive operation and should be used with caution.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';

const ResetActivityDataInputSchema = z.object({});
export type ResetActivityDataInput = z.infer<typeof ResetActivityDataInputSchema>;

const ResetActivityDataOutputSchema = z.object({
  success: z.boolean().describe('Whether the data reset was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
  deletedActivityCount: z.number().optional().describe('The number of activity logs deleted.'),
  deletedOverbreakCount: z.number().optional().describe('The number of overbreak logs deleted.'),
});
export type ResetActivityDataOutput = z.infer<typeof ResetActivityDataOutputSchema>;

export async function resetActivityData(
  input: ResetActivityDataInput
): Promise<ResetActivityDataOutput> {
  return resetActivityDataFlow(input);
}

const deleteCollection = async (db: FirebaseFirestore.Firestore, collectionPath: string, batchSize: number = 100) => {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.limit(batchSize);
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve, reject, deletedCount);
    });
}

const deleteQueryBatch = async (db: FirebaseFirestore.Firestore, query: FirebaseFirestore.Query, resolve: (value: unknown) => void, reject: (reason?: any) => void, deletedCount: number) => {
    try {
        const snapshot = await query.get();
        if (snapshot.size === 0) {
            resolve(deletedCount);
            return;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        deletedCount += snapshot.size;

        process.nextTick(() => {
            deleteQueryBatch(db, query, resolve, reject, deletedCount);
        });

    } catch(err) {
        reject(err);
    }
}

const resetActivityDataFlow = ai.defineFlow(
  {
    name: 'resetActivityDataFlow',
    inputSchema: ResetActivityDataInputSchema,
    outputSchema: ResetActivityDataOutputSchema,
  },
  async () => {
    try {
      const db = getFirestore();
      
      const [deletedActivityCount, deletedOverbreakCount] = await Promise.all([
          deleteCollection(db, 'activity'),
          deleteCollection(db, 'overbreaks')
      ]);

      return {
        success: true,
        message: `Successfully deleted ${deletedActivityCount} activity logs and ${deletedOverbreakCount} overbreak logs.`,
        deletedActivityCount: deletedActivityCount as number,
        deletedOverbreakCount: deletedOverbreakCount as number,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error resetting activity data:', errorMessage);
      return {
        success: false,
        message: `Failed to reset activity data: ${errorMessage}`,
      };
    }
  }
);
