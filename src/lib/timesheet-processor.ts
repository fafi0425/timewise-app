import type { TimesheetEntry, Shift, ProcessedDay, ProcessTimesheetInput, ProcessTimesheetOutput } from './types';
import { SHIFTS as SHIFT_DEFINITIONS } from '@/components/admin/ShiftManager';

// Helper to convert HH:MM string to total minutes from midnight
const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper to convert total minutes to HH:MM format
const minutesToHHMM = (totalMinutes: number): string => {
    if (totalMinutes < 0) totalMinutes = 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const processTimesheetData = (input: ProcessTimesheetInput): ProcessTimesheetOutput => {
    const { timesheetEntries, shift, shiftStart, shiftEnd } = input;

    if (timesheetEntries.length === 0) {
        return { processedDays: [] };
    }

    // 1. Group entries by date
    const entriesByDate = timesheetEntries.reduce((acc, entry) => {
        const date = new Date(entry.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
    }, {} as Record<string, TimesheetEntry[]>);

    const processedDays: ProcessedDay[] = [];

    // 2. Process each day
    for (const date in entriesByDate) {
        const dayEntries = entriesByDate[date].sort((a, b) => a.timestamp - b.timestamp);
        
        const clockIns = dayEntries.filter(e => e.action === 'Clock In');
        const clockOuts = dayEntries.filter(e => e.action === 'Clock Out');

        if (clockIns.length === 0) continue;

        const firstClockIn = new Date(clockIns[0].timestamp);
        const lastClockOut = clockOuts.length > 0 ? new Date(clockOuts[clockOuts.length - 1].timestamp) : null;

        // Calculate Total Hours
        let totalMinutesWorked = 0;
        if (lastClockOut) {
            totalMinutesWorked = (lastClockOut.getTime() - firstClockIn.getTime()) / (1000 * 60);
        }

        // Determine Shift Times
        let actualShiftStart: string | undefined;
        if (shift === 'custom' && shiftStart) {
            actualShiftStart = shiftStart;
        } else if (shift !== 'none' && shift !== 'custom') {
            const shiftInfo = SHIFT_DEFINITIONS[shift];
            // Reconstruct a full time string for parsing
            const startHour = String(shiftInfo.start).padStart(2,'0');
            actualShiftStart = `${startHour}:00`;
        }

        // Calculate Lateness
        let lateMinutes = 0;
        if (actualShiftStart) {
            const shiftStartMinutes = timeToMinutes(actualShiftStart);
            const employeeStartMinutes = firstClockIn.getHours() * 60 + firstClockIn.getMinutes();
            if (employeeStartMinutes > shiftStartMinutes) {
                lateMinutes = employeeStartMinutes - shiftStartMinutes;
            }
        }
        
        // Calculate Regular, OT, and Undertime
        const standardWorkMinutes = 8 * 60; // 480 minutes
        let regularMinutes = 0;
        let otMinutes = 0;
        let undertimeMinutes = 0;

        if (totalMinutesWorked >= standardWorkMinutes) {
            regularMinutes = standardWorkMinutes;
            otMinutes = totalMinutesWorked - standardWorkMinutes;
        } else {
            regularMinutes = totalMinutesWorked;
            undertimeMinutes = standardWorkMinutes - totalMinutesWorked;
        }

        processedDays.push({
            date: date,
            clockIn: firstClockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            clockOut: lastClockOut ? lastClockOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            totalHours: minutesToHHMM(totalMinutesWorked),
            late: minutesToHHMM(lateMinutes),
            regularHours: minutesToHHMM(regularMinutes),
            otHours: minutesToHHMM(otMinutes),
            undertime: minutesToHHMM(undertimeMinutes),
        });
    }

    return { processedDays: processedDays.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) };
};
