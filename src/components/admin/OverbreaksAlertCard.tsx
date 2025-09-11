'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ActivityLog, User } from '@/lib/types';
import { AlertTriangle, FileDown } from 'lucide-react';

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

interface OverbreaksAlertCardProps {
    users: User[];
    filteredOverbreaks: ActivityLog[];
    employeeFilter: string;
    setEmployeeFilter: (value: string) => void;
    monthFilter: number;
    setMonthFilter: (value: number) => void;
    yearFilter: number;
    setYearFilter: (value: number) => void;
    onExportPdf: () => void;
}

export default function OverbreaksAlertCard({
    users,
    filteredOverbreaks,
    employeeFilter,
    setEmployeeFilter,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    onExportPdf
}: OverbreaksAlertCardProps) {
    const YEARS = getYears();
    return (
        <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6">
            <CardHeader className="flex flex-row items-start justify-between !p-0 !pb-6 gap-4">
                <div>
                    <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> Overbreaks Alert
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Filter overbreaks by employee and date range.</p>
                </div>
                <Button variant="destructive" onClick={onExportPdf} size="sm">
                    <FileDown className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                    <label htmlFor="overbreak-employee-filter" className="text-sm font-medium text-muted-foreground">Employee</label>
                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                        <SelectTrigger id="overbreak-employee-filter"><SelectValue placeholder="All Employees" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {users.filter(u => u.role !== 'Administrator').map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="overbreak-month-filter" className="text-sm font-medium text-muted-foreground">Month</label>
                    <Select value={String(monthFilter)} onValueChange={(val) => setMonthFilter(Number(val))}>
                        <SelectTrigger id="overbreak-month-filter"><SelectValue placeholder="Select Month" /></SelectTrigger>
                        <SelectContent>
                            {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="overbreak-year-filter" className="text-sm font-medium text-muted-foreground">Year</label>
                    <Select value={String(yearFilter)} onValueChange={(val) => setYearFilter(Number(val))}>
                        <SelectTrigger id="overbreak-year-filter"><SelectValue placeholder="Select Year" /></SelectTrigger>
                        <SelectContent>
                            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <ScrollArea className="h-80 pr-4">
                {filteredOverbreaks.length === 0 ? <p className="text-center py-10 text-green-600">No overbreaks found for the selected filters.</p> :
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Start</TableHead>
                                <TableHead>End</TableHead>
                                <TableHead>Exceeded</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOverbreaks.map(o => (
                                <TableRow key={o.id} className="bg-red-50 border-red-500">
                                    <TableCell className="font-medium text-red-700">{o.employeeName}</TableCell>
                                    <TableCell className="text-red-600">{o.action.replace(' In', '')}</TableCell>
                                    <TableCell className="text-red-600">{o.startTime || 'N/A'}</TableCell>
                                    <TableCell className="text-red-600">{o.endTime || 'N/A'}</TableCell>
                                    <TableCell className="text-red-600 font-bold">{o.duration ? (o.duration - (o.action.includes('Break') ? 15 : 60)) : 0} min</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                }
            </ScrollArea>
        </Card>
    )
}
