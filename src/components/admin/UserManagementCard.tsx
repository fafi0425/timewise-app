'use client';

import type { User, Shift } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SHIFTS } from '@/components/admin/ShiftManager';
import { Clock, Edit2, Trash2, UserPlus, LoaderCircle } from 'lucide-react';

interface UserManagementCardProps {
    users: User[];
    newUserName: string;
    setNewUserName: (name: string) => void;
    newUserEmail: string;
    setNewUserEmail: (email: string) => void;
    newUserDepartment: string;
    setNewUserDepartment: (dept: string) => void;
    newUserRole: string;
    setNewUserRole: (role: string) => void;
    newUserShift: Shift | '';
    setNewUserShift: (shift: Shift | '') => void;
    newUserPassword: string;
    setNewUserPassword: (password: string) => void;
    handleAddUser: (e: React.FormEvent) => void;
    handleDeleteUser: (uid: string) => void;
    openEditShiftModal: (user: User) => void;
    openEditUserModal: (user: User) => void;
}

export default function UserManagementCard({
    users,
    newUserName,
    setNewUserName,
    newUserEmail,
    setNewUserEmail,
    newUserDepartment,
    setNewUserDepartment,
    newUserRole,
    setNewUserRole,
    newUserShift,
    setNewUserShift,
    newUserPassword,
    setNewUserPassword,
    handleAddUser,
    handleDeleteUser,
    openEditShiftModal,
    openEditUserModal
}: UserManagementCardProps) {
    return (
        <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6">
            <CardHeader className="flex flex-row items-center justify-between !p-0 !pb-6">
                <CardTitle className="text-xl font-semibold text-card-foreground font-headline">User Management</CardTitle>
            </CardHeader>
            <CardContent className="!p-0">
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
                                    {Object.entries(SHIFTS).map(([key, { name }]) => (
                                        <SelectItem key={key} value={key}>{name}</SelectItem>
                                    ))}
                                    <Separator className="my-2" />
                                    <SelectItem value="unpaid_leave">Unpaid Leave</SelectItem>
                                    <SelectItem value="sick_leave">Sick Leave</SelectItem>
                                    <SelectItem value="vacation_leave">Vacation Leave</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="password" placeholder="Password" required />
                            <Button type="submit" className="w-full" variant="secondary"><UserPlus className="mr-2 h-4 w-4" />Add User</Button>
                        </form>
                    </div>
                    <div>
                        <h4 className="font-medium text-card-foreground mb-4">Registered Users</h4>
                        <ScrollArea className="h-72 pr-4">
                            {users.length === 0 ? (
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
                                                        {user.shift && user.shift !== 'none' && user.role !== 'Administrator' &&
                                                            <span className={`px-2 py-0.5 rounded-full text-xs ${user.shift.includes('leave') ? 'bg-pantone-blue-2 text-white' : 'bg-accent/80 text-accent-foreground'}`}>
                                                                {(SHIFTS[user.shift as Exclude<Shift, 'custom' | 'none' | 'unpaid_leave' | 'sick_leave' | 'vacation_leave'>] as any)?.name || user.shift.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                            </span>
                                                        }
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
            </CardContent>
        </Card>
    );
}
