
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addUser, deleteUser, updateUser } from '@/lib/auth';
import { getAllUsersAction, getAllActivityAction, getTimesheetForUserByMonth, getOverbreaksAction, getUserStates } from '@/lib/firebase-admin';
import type { User, ActivityLog, Shift, ProcessedDay, TimesheetEntry, UserState } from '@/lib/types';
import { Users, BarChart3, Coffee, Utensils, FileDown, Eye, UserPlus, AlertTriangle, Trash2, Edit2, Clock, LoaderCircle, CheckCircle } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import AuthCheck from '@/components/shared/AuthCheck';
import { ScrollArea } from '@/components/ui/scroll-area';
import OnShiftList from '@/components/dashboard/OnShiftList';
import ShiftManager from '@/components/admin/ShiftManager';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { SHIFTS } from '@/components/admin/ShiftManager';
import { assignUserShift } from '@/ai/flows/assign-user-shift';
import { cleanupStaleUsers } from '@/ai/flows/cleanup-stale-users';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DailySummaryCard from '@/components/admin/DailySummaryCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { processTimesheetData } from '@/lib/timesheet-processor';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
        <CardContent className="pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold text-card-foreground">{value}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-white">
                    {icon}
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function AdminPage() {
    const [stats, setStats] = useState({ totalEmployees: 0, totalActivities: 0, todayBreaks: 0, todayLunches: 0 });
    const [users, setUsers] = useState<User[]>([]);
    const [userStates, setUserStates] = useState<Record<string, UserState>>({});
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [allActivity, setAllActivity] = useState<ActivityLog[]>([]);
    const [overbreaks, setOverbreaks] = useState<ActivityLog[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserDepartment, setNewUserDepartment] = useState('');
    const [newUserRole, setNewUserRole] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserShift, setNewUserShift] = useState<Shift | ''>('');

    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [selectedUserForShift, setSelectedUserForShift] = useState<User | null>(null);
    const [selectedShift, setSelectedShift] = useState<Shift | ''>('');
    
    const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('all');
    const [isCleaning, setIsCleaning] = useState(false);

    // State for timesheet viewer
    const [selectedTimesheetUser, setSelectedTimesheetUser] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [processedData, setProcessedData] = useState<ProcessedDay[]>([]);
    const [isTimesheetLoading, setIsTimesheetLoading] = useState(false);
    const YEARS = getYears();


    const { toast } = useToast();

    const refreshData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const [usersResult, activityResult, overbreaksResult] = await Promise.all([
                getAllUsersAction(),
                getAllActivityAction(),
                getOverbreaksAction(),
            ]);

            if (usersResult.success && usersResult.users) {
                setUsers(usersResult.users);
            } else {
                toast({ title: "Error Fetching Users", description: usersResult.message, variant: "destructive" });
                setUsers([]);
            }

            if (activityResult.success && activityResult.activities) {
                const activities = activityResult.activities;
                setAllActivity(activities);

                const today = new Date().toLocaleDateString();
                const todayActivities = activities.filter(a => a.date === today);
                
                setStats({
                    totalEmployees: usersResult.users?.length || 0,
                    totalActivities: activities.length,
                    todayBreaks: todayActivities.filter(a => a.action === 'Break Out').length,
                    todayLunches: todayActivities.filter(a => a.action === 'Lunch Out').length,
                });

            } else {
                toast({ title: "Error Fetching Activity", description: activityResult.message, variant: "destructive" });
                setAllActivity([]);
            }

             if (overbreaksResult.success && overbreaksResult.overbreaks) {
                setOverbreaks(overbreaksResult.overbreaks);
            } else {
                setOverbreaks([]);
            }

        } catch (error: any) {
             toast({ title: "Error refreshing data", description: error.message, variant: "destructive" });
        } finally {
            setIsLoadingData(false);
            setIsLoadingUsers(false);
        }
    }, [toast]);
    
    // Initial data fetch and real-time listener setup
    useEffect(() => {
        refreshData();
        
        // Real-time listener for user states
        const unsubscribe = onSnapshot(collection(db, 'userStates'), (snapshot) => {
            const states: Record<string, UserState> = {};
            snapshot.forEach(doc => {
                states[doc.id] = doc.data() as UserState;
            });
            setUserStates(states);
        }, (error) => {
            console.error("Error listening to user states:", error);
            toast({ title: "Real-time Error", description: "Could not connect to live status updates.", variant: "destructive" });
        });

        // Polling for overbreaks as they are less frequent
        const overbreaksInterval = setInterval(async () => {
             const overbreaksResult = await getOverbreaksAction();
             if (overbreaksResult.success && overbreaksResult.overbreaks) {
                setOverbreaks(overbreaksResult.overbreaks);
             }
        }, 30000);

        return () => {
            unsubscribe();
            clearInterval(overbreaksInterval);
        };
    }, [refreshData, toast]);


    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName || !newUserEmail || !newUserDepartment || !newUserRole || !newUserPassword || !newUserShift) {
            toast({ title: "Error", description: "Please fill all fields, including shift.", variant: "destructive" });
            return;
        }

        if (newUserPassword.length < 6) {
            toast({ title: "Error", description: "Password must be at least 6 characters long.", variant: "destructive" });
            return;
        }
        
        try {
            const newUser = await addUser({
                name: newUserName,
                email: newUserEmail,
                department: newUserDepartment,
                role: newUserRole as any,
                password: newUserPassword,
                shift: newUserShift as Shift,
            });

            if (newUser) {
                toast({ title: "Success", description: "User added successfully." });
                setNewUserName('');
                setNewUserEmail('');
                setNewUserDepartment('');
                setNewUserRole('');
                setNewUserPassword('');
                setNewUserShift('');
                await refreshData();
            }
        } catch (error: any) {
            let description = "Could not add user.";
            if (error.code === 'auth/email-already-in-use' || error.message.includes('auth/email-already-in-use')) {
                description = "An account with this email already exists.";
            }
            toast({ title: "Error", description, variant: "destructive" });
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (users.find(u => u.uid === uid)?.role === 'Administrator') {
            toast({ title: "Action Forbidden", description: "Cannot delete an administrator account.", variant: "destructive" });
            return;
        }
        await deleteUser(uid);
        toast({ title: "Success", description: "User removed successfully. Note: Firebase Auth entry must be manually deleted from the Firebase Console." });
        await refreshData();
    };

    const openEditShiftModal = (user: User) => {
        setSelectedUserForShift(user);
        setSelectedShift(user.shift || 'none');
        setIsShiftModalOpen(true);
    };

    const openEditUserModal = (user: User) => {
        setEditingUser({ ...user });
        setIsUserEditModalOpen(true);
    };

    const handleUpdateUser = async () => {
        if (editingUser) {
            try {
                await updateUser(editingUser);
                toast({ title: "Success", description: "User details updated." });
                refreshData();
                setIsUserEditModalOpen(false);
                setEditingUser(null);
            } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            }
        }
    };

    const handleUpdateShift = async () => {
        if (!selectedUserForShift || !selectedShift) {
            toast({ title: "Error", description: "Please select a shift.", variant: "destructive" });
            return;
        }

        const originalUsers = [...users];
        
        // Optimistic update
        const updatedUsers = users.map(u => 
            u.uid === selectedUserForShift.uid ? { ...u, shift: selectedShift as Shift } : u
        );
        setUsers(updatedUsers);
        setIsShiftModalOpen(false);
        
        try {
            const result = await assignUserShift({ userId: selectedUserForShift.uid, shift: selectedShift as Shift });

            if (result.success) {
                toast({ title: "Success", description: result.message });
                // No need to refresh all data, the UI is already updated.
            } else {
                // Revert on failure
                setUsers(originalUsers);
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            // Revert on error
            setUsers(originalUsers);
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        }
        
        setSelectedUserForShift(null);
        setSelectedShift('');
    };

    const filterLogs = () => {
        if (!filterFromDate || !filterToDate) {
            toast({ title: "Error", description: "Please select both a start and end date.", variant: "destructive" });
            return false;
        }
        
        const from = new Date(filterFromDate);
        const to = new Date(filterToDate);
        
        const filtered = allActivity.filter(log => {
            const logDate = new Date(log.date);
            const isDateInRange = logDate >= from && logDate <= to;
            const isEmployeeMatch = filterEmployee === 'all' || log.uid === filterEmployee;
            const isBreakOrLunch = log.action === 'Break In' || log.action === 'Lunch In';

            return isDateInRange && isEmployeeMatch && log.duration && isBreakOrLunch;
        });

        if (filtered.length === 0) {
            toast({ title: "No Data", description: "No data found for the selected criteria." });
            return false;
        }

        setFilteredLogs(filtered);
        return true;
    }

    const handlePreviewData = () => {
        if (filterLogs()) {
            setIsPreviewModalOpen(true);
        }
    };

    const handleExportPdf = () => {
        if (filterLogs()) {
            const doc = new jsPDF({ orientation: 'landscape' });
            const tableColumn = ["Employee", "Date", "Time", "Type", "Duration (min)"];
            const tableRows: (string|number|null)[][] = [];

            filteredLogs.forEach(log => {
                const logData = [
                    log.employeeName,
                    log.date,
                    log.time,
                    log.action.replace(' In', ''),
                    log.duration,
                ];
                tableRows.push(logData);
            });

            (doc as any).autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
            });
            doc.text("Break Logs", 14, 15);
            doc.save(`Break_Logs_${filterFromDate}_to_${filterToDate}.pdf`);
        }
    };

    const handleExportOverbreaksPdf = () => {
        if (overbreaks.length === 0) {
            toast({ title: "No Data", description: "There are no overbreaks to export." });
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        const tableColumn = ["Employee", "Date", "Time", "Type", "Exceeded By (min)"];
        const tableRows: (string|number|null)[][] = [];

        overbreaks.forEach(o => {
            const excessTime = o.duration - (o.action.includes('Break') ? 15 : 60);
            const logData = [
                o.employeeName,
                o.date,
                o.time,
                o.action.replace(' In', ''),
                excessTime > 0 ? excessTime : 'N/A'
            ];
            tableRows.push(logData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        doc.text("Overbreak Alerts Report", 14, 15);
        doc.save(`Overbreaks_Report_${new Date().toLocaleDateString()}.pdf`);
    };

    const handleCleanupUsers = async () => {
        setIsCleaning(true);
        const result = await cleanupStaleUsers({});
        toast({
            title: result.success ? "Cleanup Complete" : "Cleanup Failed",
            description: result.message,
            variant: result.success ? "default" : "destructive"
        });
        if (result.success && result.cleanedUserIds && result.cleanedUserIds.length > 0) {
            refreshData();
        }
        setIsCleaning(false);
    };

    const handleFetchTimesheet = async () => {
        const user = users.find(u => u.uid === selectedTimesheetUser);
        if (!user) {
            toast({ title: "Error", description: "Please select an employee.", variant: 'destructive' });
            return;
        }

        setIsTimesheetLoading(true);
        try {
            const result = await getTimesheetForUserByMonth(user.uid, selectedYear, selectedMonth);

            if (!result.success) {
                toast({ title: "Error", description: result.message, variant: 'destructive' });
                setProcessedData([]);
                setIsTimesheetLoading(false);
                return;
            }
            
            const rawEntries = result.timesheet || [];

            if (rawEntries.length === 0) {
                toast({ title: "No Data", description: `No timesheet entries found for ${user.name} for the selected month.` });
                setProcessedData([]);
                setIsTimesheetLoading(false);
                return;
            }
            
            const shift = user.shift || 'none';
            let shiftDetails = {};
            if (shift === 'custom') {
                // For admin view, we don't have local storage, this is a limitation.
                // We'll have to rely on a default or enhance this later if custom shifts are per-user.
                shiftDetails = { shiftStart: "09:00", shiftEnd: "17:00" };
            }

            const clientResult = processTimesheetData({
                timesheetEntries: rawEntries,
                shift: shift,
                ...shiftDetails,
            });

            setProcessedData(clientResult.processedDays.reverse());

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({ title: "Error", description: `Failed to process timesheet: ${errorMessage}`, variant: 'destructive' });
        } finally {
            setIsTimesheetLoading(false);
        }
    };


    if (isLoadingData) {
        return (
            <AuthCheck adminOnly>
                 <AppHeader isAdmin />
                 <div className="flex h-[80vh] w-full items-center justify-center">
                    <LoaderCircle className="h-12 w-12 animate-spin text-white" />
                </div>
            </AuthCheck>
        );
    }

    return (
    <AuthCheck adminOnly>
        <AppHeader isAdmin />
        <main className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 font-headline">Welcome, Administrator!</h2>
                <p className="text-lg text-foreground">Manage employee time tracking and generate reports</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Employees" value={stats.totalEmployees} icon={<Users />} />
                <StatCard title="Total Activities" value={stats.totalActivities} icon={<BarChart3 />} />
                <StatCard title="Today's Breaks" value={stats.todayBreaks} icon={<Coffee />} />
                <StatCard title="Today's Lunches" value={stats.todayLunches} icon={<Utensils />} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-1">
                    <ShiftManager />
                </div>
                <div className="lg:col-span-2">
                     <OnShiftList allUsers={users} userStates={userStates} />
                </div>
            </div>

            <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6 mb-8">
                <CardTitle className="text-xl font-semibold text-card-foreground mb-6 font-headline">Export Break Logs</CardTitle>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <Label>From Date</Label>
                        <Input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} />
                    </div>
                    <div>
                        <Label>To Date</Label>
                        <Input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} />
                    </div>
                     <div>
                        <Label>Employee</Label>
                        <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                            <SelectTrigger><SelectValue placeholder="All Employees" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {users.map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Button variant="destructive" onClick={handleExportPdf}><FileDown className="mr-2 h-4 w-4" /> Export to PDF</Button>
                    <Button onClick={handlePreviewData}><Eye className="mr-2 h-4 w-4" /> Preview Data</Button>
                </div>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6 mb-8">
                <CardHeader className="!p-0 !pb-6">
                    <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
                        <Clock className="mr-2 h-5 w-5 text-primary" /> Employee Timesheet Viewer
                    </CardTitle>
                </CardHeader>
                <CardContent className="!p-0">
                    <div className="flex flex-col gap-4 md:flex-row">
                        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4 flex-grow">
                            <div>
                                <Label>Employee</Label>
                                <Select value={selectedTimesheetUser} onValueChange={setSelectedTimesheetUser}>
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
                        </div>
                        <div className="md:self-end">
                            <Button onClick={handleFetchTimesheet} disabled={isTimesheetLoading} className="w-full">
                                {isTimesheetLoading ? <LoaderCircle className="animate-spin" /> : 'View Timesheet'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

             {processedData.length > 0 && (
                <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6 mb-8">
                     <CardTitle className="text-xl font-semibold text-card-foreground mb-6 font-headline">
                        Timesheet for {users.find(u => u.uid === selectedTimesheetUser)?.name}
                     </CardTitle>
                     <ScrollArea className="h-80">
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
                                {isTimesheetLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24">
                                            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : (
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
                                )}
                            </TableBody>
                        </Table>
                     </ScrollArea>
                </Card>
             )}


            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                 <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                     <CardTitle className="text-xl font-semibold text-card-foreground font-headline">User Management</CardTitle>
                     <Button variant="secondary" onClick={handleCleanupUsers} disabled={isCleaning}>
                         {isCleaning ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                         Cleanup Users
                     </Button>
                    </div>
                     <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                        <div>
                            <h4 className="font-medium text-card-foreground mb-4">Add New User</h4>
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Full Name" required />
                                <Input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} type="email" placeholder="Email" required />
                                <Select value={newUserDepartment} onValueChange={setNewUserDepartment}>
                                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dealing">Dealing</SelectItem>
                                        <SelectItem value="CS/KYC">CS/KYC</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Team Leader">Team Leader</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <Select value={newUserRole} onValueChange={setNewUserRole}>
                                    <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Manager">Manager</SelectItem>
                                        <SelectItem value="Team Leader">Team Leader</SelectItem>
                                        <SelectItem value="HR">HR</SelectItem>
                                        <SelectItem value="Employee">Employee</SelectItem>
                                        <SelectItem value="Administrator">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={newUserShift} onValueChange={(val) => setNewUserShift(val as Shift)}>
                                    <SelectTrigger><SelectValue placeholder="Select Shift" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Shift</SelectItem>
                                        {Object.entries(SHIFTS).map(([key, {name}]) => (
                                            <SelectItem key={key} value={key}>{name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="password" placeholder="Password" required />
                                <Button type="submit" className="w-full" variant="secondary"><UserPlus className="mr-2 h-4 w-4"/>Add User</Button>
                            </form>
                        </div>
                         <div>
                            <h4 className="font-medium text-card-foreground mb-4">Registered Users</h4>
                            <ScrollArea className="h-72 pr-4">
                            {isLoadingUsers ? (
                                <div className="flex justify-center items-center h-full">
                                    <LoaderCircle className="animate-spin text-primary" />
                                </div>
                            ) : (
                            <div className="space-y-2">
                               {users.map(user => (
                                   <div key={user.uid} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                       <div className="flex items-center gap-3">
                                           <Avatar>
                                                <AvatarImage src={user.photoURL} alt={user.name} />
                                                <AvatarFallback>
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                           <div>
                                               <div className="font-medium text-card-foreground">{user.name}</div>
                                               <div className="text-sm text-muted-foreground">{user.email}</div>
                                                <div className="text-xs text-muted-foreground mt-1 space-x-1">
                                                    <span className="bg-primary/80 text-primary-foreground px-2 py-0.5 rounded-full text-xs">{user.department}</span>
                                                    <span className="bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded-full text-xs">{user.role}</span>
                                                    {user.shift && user.shift !== 'none' && user.role !== 'Administrator' && <span className="bg-accent/80 text-accent-foreground px-2 py-0.5 rounded-full text-xs">{SHIFTS[user.shift as Exclude<Shift, 'custom' | 'none'>]?.name}</span>}
                                                </div>
                                           </div>
                                       </div>
                                        <div className="flex items-center gap-1">
                                         <Button variant="outline" size="icon" onClick={() => openEditShiftModal(user)} className="text-primary hover:bg-primary/10" disabled={user.role === 'Administrator'}>
                                            <Clock className="h-4 w-4" />
                                         </Button>
                                         <Button variant="outline" size="icon" onClick={() => openEditUserModal(user)} className="text-primary hover:bg-primary/10">
                                            <Edit2 className="h-4 w-4" />
                                         </Button>
                                         <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.uid)} className="text-destructive hover:bg-destructive/10" disabled={user.role === 'Administrator'}>
                                             <Trash2 className="h-4 w-4" />
                                         </Button>
                                        </div>
                                   </div>
                               ))}
                            </div>
                            )}
                            </ScrollArea>
                        </div>
                     </div>
                </Card>

                <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6">
                    <CardHeader className="flex flex-row items-center justify-between !p-0 !pb-6">
                        <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
                            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> Overbreaks Alert
                        </CardTitle>
                        <Button variant="destructive" onClick={handleExportOverbreaksPdf} size="sm">
                            <FileDown className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </CardHeader>
                    <ScrollArea className="h-80 pr-4">
                        <div className="space-y-3">
                            {overbreaks.length === 0 ? <p className="text-green-600">No overbreaks detected.</p> :
                            overbreaks.map(o => (
                                <div key={o.id} className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                                    <div>
                                        <div className="font-medium text-red-700">{o.employeeName}</div>
                                        <div className="text-sm text-red-600">{o.action.replace(' In', '')} exceeded by {o.duration - (o.action.includes('Break') ? 15 : 60)} mins</div>
                                        <div className="text-xs text-gray-500">{o.date} at {o.time}</div>
                                    </div>
                                    <div className="text-red-500 text-xl">⚠️</div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                 <DailySummaryCard activityLogs={allActivity} />
                 <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6">
                    <CardTitle className="text-xl font-semibold text-card-foreground mb-6 font-headline">Recent Activity Log</CardTitle>
                     <ScrollArea className="h-80 pr-4">
                        <div className="space-y-3">
                            {allActivity.slice(0, 20).map((a, index) => (
                               <div key={`${a.id}-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                   <div>
                                       <p className="font-medium text-card-foreground">{a.employeeName} <span className="text-sm text-muted-foreground">{a.action}</span></p>
                                        <p className="text-xs text-muted-foreground">{a.date} {a.time}</p>
                                   </div>
                               </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            </div>


            
            <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Shift for {selectedUserForShift?.name}</DialogTitle>
                  <DialogDescription>
                    Select the new shift schedule for this user. This will determine when they appear on the "On Shift" roster.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Select value={selectedShift} onValueChange={(val) => setSelectedShift(val as Shift)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shift" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Shift</SelectItem>
                       {Object.entries(SHIFTS).map(([key, { name }]) => (
                         <SelectItem key={key} value={key}>
                           {name}
                         </SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleUpdateShift}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isUserEditModalOpen} onOpenChange={setIsUserEditModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User: {editingUser?.name}</DialogTitle>
                  <DialogDescription>
                    Update the user's details below.
                  </DialogDescription>
                </DialogHeader>
                {editingUser && (
                <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input id="edit-name" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                    </div>
                     <div>
                        <Label htmlFor="edit-photo">Photo URL</Label>
                        <Input id="edit-photo" value={editingUser.photoURL} onChange={e => setEditingUser({...editingUser, photoURL: e.target.value})} />
                    </div>
                    <div>
                        <Label htmlFor="edit-department">Department</Label>
                        <Select value={editingUser.department} onValueChange={val => setEditingUser({...editingUser, department: val})}>
                            <SelectTrigger id="edit-department"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Dealing">Dealing</SelectItem>
                                <SelectItem value="CS/KYC">CS/KYC</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Team Leader">Team Leader</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="edit-role">Role</Label>
                        <Select value={editingUser.role} onValueChange={val => setEditingUser({...editingUser, role: val as User['role']})}>
                            <SelectTrigger id="edit-role"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Manager">Manager</SelectItem>
                                <SelectItem value="Team Leader">Team Leader</SelectItem>
                                <SelectItem value="HR">HR</SelectItem>
                                <SelectItem value="Employee">Employee</SelectItem>
                                <SelectItem value="Administrator">Administrator</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                )}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleUpdateUser}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Break Log Preview</DialogTitle>
                        <DialogDescription>
                           Break and lunch logs from {filterFromDate} to {filterToDate} 
                           for {users.find(u=>u.uid === filterEmployee)?.name || 'All Employees'}.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Duration (min)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell>{log.employeeName}</TableCell>
                                            <TableCell>{log.date}</TableCell>
                                            <TableCell>{log.action.replace(' In', '')}</TableCell>
                                            <TableCell>{log.duration}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No data found for the selected criteria.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </main>
    </AuthCheck>
    );
}
