
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/shared/AppHeader';
import AuthCheck from '@/components/shared/AuthCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoaderCircle } from 'lucide-react';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TimesheetEntry } from '@/lib/types';
import { processTimesheet, type ProcessedDay } from '@/ai/flows/timesheet-flow';
import { SHIFTS } from '@/components/admin/ShiftManager';

export default function TimesheetPage() {
    const { user } = useAuth();
    const [processedData, setProcessedData] = useState<ProcessedDay[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchAndProcessTimesheet = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch raw timesheet data
                const timesheetRef = collection(db, 'timesheet');
                const q = query(
                    timesheetRef,
                    where('uid', '==', user.uid),
                    orderBy('timestamp', 'asc')
                );
                const querySnapshot = await getDocs(q);
                const rawEntries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimesheetEntry));

                if (rawEntries.length === 0) {
                    setProcessedData([]);
                    setIsLoading(false);
                    return;
                }
                
                // 2. Process data with the AI flow
                const shift = user.shift || 'none';
                let shiftDetails = {};
                if (shift === 'custom') {
                    // This assumes custom shift times are stored somewhere accessible.
                    // For this example, we'll use defaults if not found.
                    const customStartTime = localStorage.getItem('customShiftStart') || '09:00';
                    const customEndTime = localStorage.getItem('customShiftEnd') || '17:00';
                    shiftDetails = { shiftStart: customStartTime, shiftEnd: customEndTime };
                }

                const result = await processTimesheet({
                    timesheetEntries: rawEntries,
                    shift: shift,
                    ...shiftDetails,
                });

                setProcessedData(result.processedDays.reverse()); // Show most recent first

            } catch (error) {
                console.error("Error fetching or processing timesheet:", error);
                // Handle error appropriately in UI
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndProcessTimesheet();
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
                        <CardTitle>Daily Breakdown</CardTitle>
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
                                                No timesheet entries found.
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
