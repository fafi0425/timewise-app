
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, LoaderCircle } from 'lucide-react';
import type { TimesheetEntry, User, ProcessedDay } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { getTimesheetForUserByMonth } from '@/lib/firebase-admin';
import { processTimesheet } from '@/ai/flows/timesheet-flow';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface TimesheetCardProps {
    users: User[];
}

const MONTHS = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
];

const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
        years.push(i);
    }
    return years;
};


export default function TimesheetCard({ users }: TimesheetCardProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [processedData, setProcessedData] = useState<ProcessedDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const YEARS = getYears();
  const { toast } = useToast();

  const handleFetchTimesheet = async () => {
        const user = users.find(u => u.uid === selectedUser);
        if (!user) {
            toast({ title: "Error", description: "Please select an employee.", variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            // 1. Fetch raw timesheet data using the server action
            const result = await getTimesheetForUserByMonth(user.uid, selectedYear, selectedMonth);

            if (!result.success) {
                toast({ title: "Error", description: result.message, variant: 'destructive' });
                setProcessedData([]);
                setIsLoading(false);
                return;
            }
            
            const rawEntries = result.timesheet || [];

            if (rawEntries.length === 0) {
                toast({ title: "No Data", description: `No timesheet entries found for ${user.name} for the selected month.` });
                setProcessedData([]);
                setIsLoading(false);
                return;
            }
            
            // 2. Process data with the AI flow
            const shift = user.shift || 'none';
            let shiftDetails = {};
            if (shift === 'custom') {
                // For admin view, we don't have local storage, this is a limitation.
                // We'll have to rely on a default or enhance this later if custom shifts are per-user.
                shiftDetails = { shiftStart: "09:00", shiftEnd: "17:00" };
            }

            const aiResult = await processTimesheet({
                timesheetEntries: rawEntries,
                shift: shift,
                ...shiftDetails,
            });

            setProcessedData(aiResult.processedDays.reverse());

        } catch (error) {
            console.error("Error fetching or processing timesheet:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({ title: "Error", description: `Failed to process timesheet: ${errorMessage}`, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };


  return (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6">
        <CardHeader className="!p-0 !pb-6">
            <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" /> Employee Timesheet
            </CardTitle>
        </CardHeader>
        <CardContent className="!p-0">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
                 <div>
                    <Label>Employee</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                        <SelectContent>
                            {users.filter(u => u.role !== 'Administrator').map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label>Month</Label>
                    <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                        <SelectTrigger><SelectValue placeholder="Select Month" /></SelectTrigger>
                        <SelectContent>
                            {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Year</Label>
                     <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                        <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                        <SelectContent>
                            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="self-end">
                    <Button onClick={handleFetchTimesheet} disabled={isLoading} className="w-full">
                        {isLoading ? <LoaderCircle className="animate-spin" /> : 'View'}
                    </Button>
                </div>
            </div>
             <ScrollArea className="h-80 pr-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Clock Out</TableHead>
                            <TableHead>Late</TableHead>
                            <TableHead>Undertime</TableHead>
                            <TableHead>Regular</TableHead>
                            <TableHead>OT</TableHead>
                            <TableHead>Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : processedData.length > 0 ? (
                            processedData.map((day) => (
                                <TableRow key={day.date}>
                                    <TableCell>{day.date}</TableCell>
                                    <TableCell>{day.clockIn}</TableCell>
                                    <TableCell>{day.clockOut}</TableCell>
                                    <TableCell className={day.late !== '00:00' ? 'text-orange-500' : ''}>{day.late}</TableCell>
                                    <TableCell className={day.undertime !== '00:00' ? 'text-red-500' : ''}>{day.undertime}</TableCell>
                                    <TableCell>{day.regularHours}</TableCell>
                                    <TableCell className={day.otHours !== '00:00' ? 'text-green-500' : ''}>{day.otHours}</TableCell>
                                    <TableCell className="font-bold">{day.totalHours}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">
                                   {selectedUser ? `No timesheet data for ${users.find(u => u.uid === selectedUser)?.name}.` : 'Please select an employee to view their timesheet.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
