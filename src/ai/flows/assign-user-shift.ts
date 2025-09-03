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
import type { Shift } from '@/lib/types';

const AssignUserShiftInputSchema = z.object({
  userId: z.string().describe('The unique identifier of the user.'),
  shift: z.enum(['morning', 'mid', 'night']).describe('The shift to assign to the user.'),
});
export type AssignUserShiftInput = z.infer<typeof AssignUserShiftInputSchema>;

// The output will now include the userId and shift to be handled by the client.
const AssignUserShiftOutputSchema = z.object({
  success: z.boolean().describe('Whether the shift assignment was successful.'),
  message: z.string().describe('A message indicating the result of the operation.'),
  userId: z.string().optional().describe('The unique identifier of the user.'),
  shift: z.enum(['morning', 'mid', 'night']).optional().describe('The shift assigned to the user.'),
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
    // This flow will now simply validate and pass the data back to the client.
    // The client will be responsible for the actual localStorage update.
    // This avoids server-side code trying to interact with client-side storage.
    try {
      return {
        success: true,
        message: 'User shift updated successfully.',
        userId: userId,
        shift: shift,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        success: false,
        message: `Failed to update user shift: ${errorMessage}`,
      };
    }
  }
);
