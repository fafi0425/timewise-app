'use server';
/**
 * @fileOverview A flow to handle cleaning up old activity logs.
 *
 * This flow is designed to be triggered manually or on a schedule to prevent
 * the activity log from growing indefinitely. It deletes logs older than a
 * specified number of days (e.g., 90 days).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';


const CleanupActivityLogsInputSchema = z.object({
  daysOld: z.number().int().positive().default(90).describe('The age in days of logs to delete.'),
});
export type CleanupActivityLogsInput = z.infer<typeof CleanupActivityLogsInputSchema>;

const CleanupActivityLogsOutputSchema = z.object({
  success: z.boolean().describe('Whether the cleanup process was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
  deletedCount: z.number().optional().describe('The number of logs that were deleted.'),
});
export type CleanupActivityLogsOutput = z.infer<typeof CleanupActivityLogsOutputSchema>;

export async function cleanupActivityLogs(
  input: CleanupActivityLogsInput
): Promise<CleanupActivityLogsOutput> {
  return cleanupActivityLogsFlow(input);
}

const cleanupActivityLogsFlow = ai.defineFlow(
  {
    name: 'cleanupActivityLogsFlow',
    inputSchema: CleanupActivityLogsInputSchema,
    outputSchema: CleanupActivityLogsOutputSchema,
  },
  async ({ daysOld }) => {
    try {
      const db = getFirestore();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const timestampCutoff = cutoffDate.getTime();

      const oldLogsQuery = db.collection('activity').where('timestamp', '<', timestampCutoff);
      const snapshot = await oldLogsQuery.get();

      if (snapshot.empty) {
        return {
          success: true,
          message: `No activity logs older than ${daysOld} days were found.`,
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
