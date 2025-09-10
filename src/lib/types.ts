
import { z } from 'zod';

export interface User {
  uid: string;
  name: string;
  email: string;
  department: 'Dealing' | 'CS/KYC' | 'Admin' | 'Team Leader' | string;
  role: 'Manager' | 'Team Leader' | 'HR' | 'Employee' | 'Administrator';
  password?: string;
  shift?: Shift;
  photoURL?: string;
}

export type TimesheetAction = 'Clock In' | 'Clock Out';

export interface TimesheetEntry {
  id?: string; // Made optional as it's not present on creation
  uid: string;
  employeeName: string;
  date: string;
  time: string;
  action: TimesheetAction;
  timestamp: number;
}


export interface ActivityLog {
  id: string;
  uid: string;
  employeeName: string;
  date: string;
  time: string;
  action: 'Break Out' | 'Break In' | 'Lunch Out' | 'Lunch In';
  duration: number | null;
  timestamp: number;
  startTime?: string;
  endTime?: string;
}

export interface UserState {
  currentState: 'working' | 'break' | 'lunch' | 'clocked_out';
  isClockedIn: boolean;
  totalBreakMinutes: number;
  totalLunchMinutes: number;
  breakStartTime: string | null;
  lunchStartTime: string | null;
}

export type Shift = 'morning' | 'mid' | 'night' | 'custom' | 'none' | 'unpaid_leave' | 'sick_leave' | 'vacation_leave';


// Schemas for Timesheet Processing
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
export type ProcessedDay = z.infer<typeof ProcessedDaySchema>;


export const ProcessTimesheetOutputSchema = z.object({
  processedDays: z.array(ProcessedDaySchema).describe('An array of processed daily timesheet data.'),
});
export type ProcessTimesheetOutput = z.infer<typeof ProcessTimesheetOutputSchema>;
