
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getUsers, addUser, deleteUser } from '@/lib/auth';
import { getOverbreakAlertsAction } from '@/lib/actions';
import type { User, ActivityLog } from '@/lib/types';
import { Users, BarChart3, Coffee, Utensils, FileDown, Eye, UserPlus, AlertTriangle, Trash2 } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import AuthCheck from '@/components/shared/AuthCheck';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getActivityLog } from '@/hooks/useTimeTracker';

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
    const [allActivity, setAllActivity] = useState<ActivityLog[]>([]);
    const [overbreaks, setOverbreaks] = useState<any[]>([]);
    const [isLoadingOverbreaks, setIsLoadingOverbreaks] = useState(false);
    
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserDepartment, setNewUserDepartment] = useState('');
    const [newUserRole, setNewUserRole] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');

    const { toast } = useToast();

    const refreshData = async () => {
        const allUsers = getUsers();
        setUsers(allUsers);

        const activityData: ActivityLog[] = getActivityLog();
        setAllActivity(activityData);
        
        const today = new Date().toLocaleDateString();
        const todayActivities = activityData.filter(a => a.date === today);

        setStats({
            totalEmployees: allUsers.length,
            totalActivities: activityData.length,
            todayBreaks: todayActivities.filter(a => a.action === 'Break Out').length,
            todayLunches: todayActivities.filter(a => a.action === 'Lunch Out').length,
        });

        await fetchOverbreaks();
    };

    const fetchOverbreaks = async () => {
        setIsLoadingOverbreaks(true);
        const activityData: ActivityLog[] = getActivityLog();
        const result = await getOverbreakAlertsAction(activityData);
        setOverbreaks(result);
        setIsLoadingOverbreaks(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName || !newUserEmail || !newUserDepartment || !newUserRole || !newUserPassword) {
            toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
            return;
        }
        
        const newUser = await addUser({
            name: newUserName,
            email: newUserEmail,
            department: newUserDepartment,
            role: newUserRole as any,
            password: newUserPassword,
        });

        if (newUser) {
            toast({ title: "Success", description: "User added successfully." });
            setNewUserName('');
            setNewUserEmail('');
            setNewUserDepartment('');
            setNewUserRole('');
            setNewUserPassword('');
            await refreshData();
        } else {
            toast({ title: "Error", description: "Could not add user.", variant: "destructive" });
        }
    };

    const handleDeleteUser = async (uid: string) => {
        await deleteUser(uid);
        toast({ title: "Success", description: "User removed successfully." });
        await refreshData();
    };


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

            <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6 mb-8">
                <CardTitle className="text-xl font-semibold text-card-foreground mb-6 font-headline">Export Break Logs</CardTitle>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <Label>From Date</Label>
                        <Input type="date" />
                    </div>
                    <div>
                        <Label>To Date</Label>
                        <Input type="date" />
                    </div>
                     <div>
                        <Label>Employee</Label>
                        <Select>
                            <SelectTrigger><SelectValue placeholder="All Employees" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {users.map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Button variant="secondary"><FileDown className="mr-2 h-4 w-4" /> Export to Excel</Button>
                    <Button variant="destructive"><FileDown className="mr-2 h-4 w-4" /> Export to PDF</Button>
                    <Button><Eye className="mr-2 h-4 w-4" /> Preview Data</Button>
                </div>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6 mb-8">
                 <CardTitle className="text-xl font-semibold text-card-foreground mb-6 font-headline">User Management</CardTitle>
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
                                </SelectContent>
                            </Select>
                             <Select value={newUserRole} onValueChange={setNewUserRole}>
                                <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Manager">Manager</SelectItem>
                                    <SelectItem value="Team Leader">Team Leader</SelectItem>
                                    <SelectItem value="HR">HR</SelectItem>
                                    <SelectItem value="Employee">Employee</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="password" placeholder="Password" required />
                            <Button type="submit" className="w-full" variant="secondary"><UserPlus className="mr-2 h-4 w-4"/>Add User</Button>
                        </form>
                    </div>
                     <div>
                        <h4 className="font-medium text-card-foreground mb-4">Registered Users</h4>
                        <ScrollArea className="h-72 pr-4">
                        <div className="space-y-2">
                           {users.map(user => (
                               <div key={user.uid} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                   <div>
                                       <div className="font-medium text-card-foreground">{user.name}</div>
                                       <div className="text-sm text-muted-foreground">{user.email}</div>
                                       <div className="text-sm text-muted-foreground">Password: {user.password}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            <span className="bg-primary/80 text-primary-foreground px-2 py-0.5 rounded-full text-xs">{user.department}</span>
                                            <span className="bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded-full text-xs ml-1">{user.role}</span>
                                        </div>
                                   </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.uid)} className="text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                               </div>
                           ))}
                        </div>
                        </ScrollArea>
                    </div>
                 </div>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6">
                    <CardTitle className="text-xl font-semibold text-card-foreground mb-6 font-headline flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-destructive" /> Overbreaks Alert
                    </CardTitle>
                    <ScrollArea className="h-80 pr-4">
                        <div className="space-y-3">
                            {isLoadingOverbreaks ? <p>Loading alerts...</p> : 
                            overbreaks.length === 0 ? <p className="text-green-600">No overbreaks detected.</p> :
                            overbreaks.map(o => (
                                <div key={o.id} className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                                    <div>
                                        <div className="font-medium text-red-700">{o.employeeName}</div>
                                        <div className="text-sm text-red-600">{o.action.replace('In', '')} exceeded by {o.duration - (o.action.includes('Break') ? 15 : 60)} mins</div>
                                        <div className="text-xs text-gray-500">{o.date} at {o.time}</div>
                                    </div>
                                    <div className="text-red-500 text-xl">⚠️</div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
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
            
        </main>
    </AuthCheck>
    );
}
