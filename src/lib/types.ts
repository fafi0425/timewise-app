
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
