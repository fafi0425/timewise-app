
export interface User {
  uid: string;
  name: string;
  email: string;
  department: 'Dealing' | 'CS/KYC' | 'Admin' | string;
  role: 'Manager' | 'Team Leader' | 'HR' | 'Employee' | 'Administrator';
  password?: string;
}

export interface ActivityLog {
  id: string;
  uid: string;
  employeeName: string;
  date: string;
  time: string;
  action: 'Work Started' | 'Break Out' | 'Break In' | 'Lunch Out' | 'Lunch In';
  duration: number | null;
}

export interface UserState {
  currentState: 'working' | 'break' | 'lunch';
  totalBreakMinutes: number;
  totalLunchMinutes: number;
  breakStartTime: string | null;
  lunchStartTime: string | null;
}

export type Shift = 'morning' | 'mid' | 'night';
