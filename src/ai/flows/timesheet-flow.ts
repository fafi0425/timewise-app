'use server';
/**
 * @fileOverview A flow to process raw timesheet data and calculate detailed metrics.
 *
 * - processTimesheet - A function that handles the business logic for timesheet processing.
 * - ProcessTimesheetInput - The input type for the processTimesheet function.
 * - ProcessTimesheetOutput - The return type for the processTimesheet function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Shift, TimesheetEntry } from '@/lib/types';

export const ProcessTimesheetInputSchema = z.object({
  timesheetEntries: z.array(z.any()).describe('An array of raw timesheet entries for a user.'),
  shift: z.custom<Shift>().describe("The user's assigned shift (morning, mid, night, or custom)."),
  shiftStart: z.string().optional().describe('The custom start time for the shift (HH:MM), required if shift is custom.'),
  shiftEnd: z.string().optional().describe('The custom end time for the shift (HH:MM), required if shift is custom.'),
});
export type ProcessTimesheetInput = z.infer<typeof ProcessTimesheetInputSchema>;

export const ProcessedDaySchema = z.object({
    date: z.string(),
    clockIn: z.string(),
    clockOut: z.string(),
    late: z.string(),
    undertime: z.string(),
    regularHours: z.string(),
    otHours: z.string(),
    totalHours: z.string(),
});

export const ProcessTimesheetOutputSchema = z.object({
  processedDays: z.array(ProcessedDaySchema).describe('An array of processed daily timesheet data.'),
});
export type ProcessTimesheetOutput = z.infer<typeof ProcessTimesheetOutputSchema>;


export async function processTimesheet(input: ProcessTimesheetInput): Promise<ProcessTimesheetOutput> {
  return processTimesheetFlow(input);
}


const prompt = ai.definePrompt({
    name: 'timesheetProcessingPrompt',
    input: { schema: ProcessTimesheetInputSchema },
    output: { schema: ProcessTimesheetOutputSchema },
    prompt: `You are an expert HR assistant specializing in payroll and timesheet calculations. Your task is to process a series of clock-in and clock-out events for an employee and calculate their daily work metrics based on their assigned shift.

    **Employee Shift Details:**
    - Shift Type: {{{shift}}}
    {{#if shiftStart}}- Custom Shift Start: {{{shiftStart}}}{{/if}}
    {{#if shiftEnd}}- Custom Shift End: {{{shiftEnd}}}{{/if}}
    
    **Standard Shift Times:**
    - Morning: 05:00 - 14:00 (9 hours total, 8 hours work + 1 hour lunch)
    - Mid: 13:00 - 22:00 (9 hours total, 8 hours work + 1 hour lunch)
    - Night: 21:00 - 06:00 next day (9 hours total, 8 hours work + 1 hour lunch)
    
    **Calculation Rules:**
    1.  **Pairing:** Pair each 'Clock In' with the next available 'Clock Out' for the same date. If a clock out is on the next day, it belongs to the previous day's clock in. Ignore unpaired entries.
    2.  **Total Hours:** Calculate the total duration between each valid clock-in/out pair. Format as "HH:MM".
    3.  **Lateness:** Calculated if the first 'Clock In' of the day is after the official shift start time. Calculate the difference. If on time, this should be "00:00".
    4.  **Regular Hours:** The standard work duration is 8 hours per day. Any work up to 8 hours is considered regular time.
    5.  **Overtime (OT):** Any time worked beyond 8 hours for a given day.
    6.  **Undertime:** If the total hours worked in a day is less than 8 hours, calculate the shortfall. If 8 or more hours are worked, this should be "00:00".
    7.  **Formatting:** All duration fields (Late, Undertime, Regular, OT, Total) must be in "HH:MM" format. Clock In/Out times should be "HH:MM". Dates should be "YYYY-MM-DD".
    8.  **Aggregation:** Aggregate all clock-in/out pairs for a single day into one row in the output. The 'clockIn' should be the earliest clock-in for that day, and 'clockOut' should be the latest.

    **Input Data (Timesheet Entries):**
    \`\`\`json
    {{{JSONstringify timesheetEntries}}}
    \`\`\`
    
    Process the data according to these rules and return the result in the specified JSON format.
    `,
    helpers: {
      JSONstringify: (context: any) => JSON.stringify(context),
    }
});


const processTimesheetFlow = ai.defineFlow(
  {
    name: 'processTimesheetFlow',
    inputSchema: ProcessTimesheetInputSchema,
    outputSchema: ProcessTimesheetOutputSchema,
  },
  async (input) => {
    if (input.timesheetEntries.length === 0) {
        return { processedDays: [] };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
