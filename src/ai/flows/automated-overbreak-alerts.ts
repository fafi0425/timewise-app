'use server';

/**
 * @fileOverview A flow that checks for overbreaks and generates alerts for administrators.
 *
 * - checkOverbreaksAndAlert - A function that checks for overbreaks and generates alerts.
 * - CheckOverbreaksAndAlertInput - The input type for the checkOverbreaksAndAlert function.
 * - CheckOverbreaksAndAlertOutput - The return type for the checkOverbreaksAndAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckOverbreaksAndAlertInputSchema = z.object({
  activityData: z
    .array(z.any())
    .describe('Array of employee activity data including name, date, time, action, and duration.'),
  breakTimeLimit: z
    .number()
    .default(15)
    .describe('The maximum allowed break time in minutes.'),
  lunchTimeLimit: z
    .number()
    .default(60)
    .describe('The maximum allowed lunch time in minutes.'),
});
export type CheckOverbreaksAndAlertInput = z.infer<
  typeof CheckOverbreaksAndAlertInputSchema
>;

const CheckOverbreaksAndAlertOutputSchema = z.object({
  overbreaks: z
    .array(z.any())
    .describe('Array of overbreak incidents, each including employee name, date, time, action, duration, and excess time.'),
  alertMessage: z
    .string()
    .describe('A message summarizing the overbreak incidents, to be displayed to the administrator.'),
});
export type CheckOverbreaksAndAlertOutput = z.infer<
  typeof CheckOverbreaksAndAlertOutputSchema
>;

export async function checkOverbreaksAndAlert(
  input: CheckOverbreaksAndAlertInput
): Promise<CheckOverbreaksAndAlertOutput> {
  return checkOverbreaksAndAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkOverbreaksAndAlertPrompt',
  input: {schema: CheckOverbreaksAndAlertInputSchema},
  output: {schema: CheckOverbreaksAndAlertOutputSchema},
  prompt: `You are a helpful assistant that analyzes employee activity data to identify overbreak incidents and generate alerts for administrators.

Given the following employee activity data:
{{#each activityData}}
- Employee: {{this.employeeName}}, Date: {{this.date}}, Time: {{this.time}}, Action: {{this.action}}, Duration: {{this.duration}} minutes\n{{/each}}

Considering the break time limit of {{breakTimeLimit}} minutes and lunch time limit of {{lunchTimeLimit}} minutes, identify any instances where employees have exceeded these limits.

Generate an alert message summarizing the overbreak incidents, including the employee name, activity type, duration, and excess time. Also, return a structured array of overbreak objects that contain the details of each overbreak incident.
`,
});

const checkOverbreaksAndAlertFlow = ai.defineFlow(
  {
    name: 'checkOverbreaksAndAlertFlow',
    inputSchema: CheckOverbreaksAndAlertInputSchema,
    outputSchema: CheckOverbreaksAndAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
