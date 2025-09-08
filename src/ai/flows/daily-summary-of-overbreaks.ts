
'use server';
/**
 * @fileOverview A daily summary of employees who have exceeded their break or lunch times.
 *
 * - getDailySummaryOfOverbreaks - A function that generates a daily summary of employees who have exceeded their break or lunch times.
 * - DailySummaryOfOverbreaksInput - The input type for the getDailySummaryOfOverbreaks function.
 * - DailySummaryOfOverbreaksOutput - The return type for the getDailySummaryOfOverbreaks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailySummaryOfOverbreaksInputSchema = z.object({
  date: z.string().describe('The date for which to generate the summary.'),
  activityData: z.array(z.any()).describe('The array of all activity log objects for the day.'),
});
export type DailySummaryOfOverbreaksInput = z.infer<typeof DailySummaryOfOverbreaksInputSchema>;

const DailySummaryOfOverbreaksOutputSchema = z.object({
  summary: z.string().describe('A summary of employees who have exceeded their break or lunch times.'),
});
export type DailySummaryOfOverbreaksOutput = z.infer<typeof DailySummaryOfOverbreaksOutputSchema>;

export async function getDailySummaryOfOverbreaks(input: DailySummaryOfOverbreaksInput): Promise<DailySummaryOfOverbreaksOutput> {
  return dailySummaryOfOverbreaksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailySummaryOfOverbreaksPrompt',
  input: {schema: DailySummaryOfOverbreaksInputSchema},
  output: {schema: DailySummaryOfOverbreaksOutputSchema},
  prompt: `You are an AI assistant tasked with generating a daily summary of employees who have exceeded their break or lunch times.

  Date: {{{date}}}

  Activity Data:
  {{#each activityData}}
  - Employee: {{this.employeeName}}, Action: {{this.action}}, Duration: {{this.duration}} minutes
  {{/each}}

  Analyze the activity data and identify employees who have exceeded their allowed break or lunch times.
  Breaks ("Break In" action) should not exceed 15 minutes, and lunches ("Lunch In" action) should not exceed 60 minutes. Provide a concise summary of these violations.
  The summary should include the employee's name, the type of break (break or lunch), the duration of the break, and how much they exceeded the limit.
  If no employees exceeded their break or lunch times, state that clearly.
`,
});

const dailySummaryOfOverbreaksFlow = ai.defineFlow(
  {
    name: 'dailySummaryOfOverbreaksFlow',
    inputSchema: DailySummaryOfOverbreaksInputSchema,
    outputSchema: DailySummaryOfOverbreaksOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('No output from prompt');
      }
      return output;
    } catch (error) {
       console.error(`[DailySummaryFlow] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
       return {
         summary: "The AI summary is temporarily unavailable as the service is currently overloaded. Please try again in a few moments."
       };
    }
  }
);
