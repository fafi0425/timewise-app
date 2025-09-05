'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/shared/AppHeader';
import AuthCheck from '@/components/shared/AuthCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoaderCircle } from 'lucide-react';
import type { TimesheetEntry, ProcessedDay } from '@/lib/types';
import { processTimesheet } from '@/ai/flows/timesheet-flow';
import { getTimesheetForUserByMonth } from '@/lib/firebase-admin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

export default function TimesheetPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [processedData, setProcessedData] = useState<ProcessedDay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const YEARS = getYears();

    const fetchAndProcessTimesheet = async () => {
        if (!user) return;

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
                setProcessedData([]);
                setIsLoading(false);
                return;
            }
            
            // 2. Process data with the AI flow
            const shift = user.shift || 'none';
            let shiftDetails = {};
            if (shift === 'custom') {
                const customStartTime = localStorage.getItem('customShiftStart') || '09:00';
                const customEndTime = localStorage.getItem('customShiftEnd') || '17:00';
                shiftDetails = { shiftStart: customStartTime, shiftEnd: customEndTime };
            }

            const aiResult = await processTimesheet({
                timesheetEntries: rawEntries,
                shift: shift,
                ...shiftDetails,
            });

            setProcessedData(aiResult.processedDays.reverse()); // Show most recent first

        } catch (error) {
            console.error("Error fetching or processing timesheet:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({ title: "Error", description: `Failed to process timesheet: ${errorMessage}`, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAndProcessTimesheet();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <AuthCheck>
            <AppHeader />
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-white font-headline">My Timesheet</h2>
                    <p className="text-lg text-foreground mt-2">A detailed summary of your work hours.</p>
                </div>
                
                <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle>Daily Breakdown</CardTitle>
                            <div className="flex gap-4 items-center">
                                <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                                     <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button onClick={fetchAndProcessTimesheet} disabled={isLoading}>
                                    {isLoading ? <LoaderCircle className="animate-spin" /> : 'View'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                                <p className="ml-4 text-muted-foreground">Processing your timesheet...</p>
                            </div>
                        ) : (
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
                                    {processedData.length > 0 ? (
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
                                                No timesheet entries found for {MONTHS.find(m => m.value === selectedMonth)?.name} {selectedYear}.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </AuthCheck>
    );
}
