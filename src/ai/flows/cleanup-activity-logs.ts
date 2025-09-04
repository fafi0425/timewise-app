
'use server';
/**
 * @fileOverview A flow to handle deleting old activity logs.
 *
 * - cleanupActivityLogs - A function that deletes activity logs older than 90 days.
 * - CleanupActivityLogsOutput - The return type for the cleanupActivityLogs function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

const CleanupActivityLogsOutputSchema = z.object({
  success: z.boolean().describe('Whether the cleanup process was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
  deletedCount: z.number().optional().describe('The number of logs that were deleted.'),
});
export type CleanupActivityLogsOutput = z.infer<typeof CleanupActivityLogsOutputSchema>;

export async function cleanupActivityLogs(): Promise<CleanupActivityLogsOutput> {
  return cleanupActivityLogsFlow();
}

const cleanupActivityLogsFlow = ai.defineFlow(
  {
    name: 'cleanupActivityLogsFlow',
    outputSchema: CleanupActivityLogsOutputSchema,
  },
  async () => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const timestampCutoff = ninetyDaysAgo.getTime();

      const oldLogsQuery = db.collection('activity').where('timestamp', '<', timestampCutoff);
      const snapshot = await oldLogsQuery.get();

      if (snapshot.empty) {
        return {
          success: true,
          message: 'No activity logs older than 90 days were found.',
          deletedCount: 0,
        };
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return {
        success: true,
        message: `Successfully deleted ${snapshot.size} old activity logs.`,
        deletedCount: snapshot.size,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error cleaning up activity logs:', errorMessage);
      return {
        success: false,
        message: `Failed to cleanup activity logs: ${errorMessage}`,
      };
    }
  }
);
