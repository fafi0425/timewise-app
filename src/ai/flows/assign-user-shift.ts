'use server';
/**
 * @fileOverview A flow to handle assigning a shift to a user.
 *
 * - assignUserShift - A function that handles the business logic for assigning a shift.
 * - AssignUserShiftInput - The input type for the assignUserShift function.
 * - AssignUserShiftOutput - The return type for the assignUserShift function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { updateUserShift } from '@/lib/auth';
import type { Shift } from '@/lib/types';

export const AssignUserShiftInputSchema = z.object({
  userId: z.string().describe('The unique identifier of the user.'),
  shift: z.enum(['morning', 'mid', 'night']).describe('The shift to assign to the user.'),
});
export type AssignUserShiftInput = z.infer<typeof AssignUserShiftInputSchema>;

export const AssignUserShiftOutputSchema = z.object({
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
      updateUserShift(userId, shift as Shift);
      return {
        success: true,
        message: 'User shift updated successfully.',
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
