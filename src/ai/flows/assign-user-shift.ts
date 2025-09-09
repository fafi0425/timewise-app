
'use server';
/**
 * @fileOverview A flow to handle assigning a shift to a user.
 *
 * - assignUserShift - A function that handles the business logic for assigning a shift.
 * - AssignUserShiftInput - The input type for the assignUserShift function.
 * - AssignUserShiftOutput - The return type for the assignUsershift function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { updateUserShiftInFirestore } from '@/lib/firebase-admin';

const AssignUserShiftInputSchema = z.object({
  userId: z.string().describe('The unique identifier of the user.'),
  shift: z.enum(['morning', 'mid', 'night', 'custom', 'none', 'unpaid_leave', 'sick_leave', 'vacation_leave']).describe('The shift to assign to the user.'),
});
export type AssignUserShiftInput = z.infer<typeof AssignUserShiftInputSchema>;

const AssignUserShiftOutputSchema = z.object({
  success: z.boolean().describe('Whether the shift assignment was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
});
export type AssignUserShiftOutput = z.infer<typeof AssignUserShiftOutputSchema>;

export async function assignUserShift(
  input: AssignUserShiftInput
): Promise<AssignUserShiftOutput> {
  return assignUserShiftFlow(input);
}

const assignUserShiftFlow = ai.defineFlow(
  {
    name: 'assignUserShiftFlow',
    inputSchema: AssignUserShiftInputSchema,
    outputSchema: AssignUserShiftOutputSchema,
  },
  async ({ userId, shift }) => {
    try {
      await updateUserShiftInFirestore(userId, shift);
      return {
        success: true,
        message: 'User shift updated successfully.',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error updating shift for user ${userId}:`, errorMessage);
      return {
        success: false,
        message: `Failed to update user shift: ${errorMessage}`,
      };
    }
  }
);
