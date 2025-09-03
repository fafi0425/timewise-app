
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/shared/AppHeader';
import AuthCheck from '@/components/shared/AuthCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { List, Mail, Building, Briefcase, Clock, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { getActivityLog } from '@/hooks/useTimeTracker';
import type { ActivityLog } from '@/lib/types';
import { SHIFTS } from '@/components/admin/ShiftManager';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | undefined }) => (
    <div className="flex items-center text-sm">
        <div className="w-6 mr-4 text-primary">{icon}</div>
        <div className="text-muted-foreground mr-2">{label}:</div>
        <div className="font-medium text-card-foreground">{value || 'N/A'}</div>
    </div>
);

export default function ProfilePage() {
    const { user } = useAuth();
    const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

    useEffect(() => {
        if (user) {
            const allLogs = getActivityLog();
            const userLogs = allLogs.filter(log => log.uid === user.uid);
            setRecentActivity(userLogs.slice(0, 10));
        }
    }, [user]);

    if (!user) return null;
    
    const userShift = user.shift ? SHIFTS[user.shift]?.name : 'Not Assigned';

    return (
        <AuthCheck>
            <AppHeader />
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-white font-headline">My Profile</h2>
                    <p className="text-lg text-foreground mt-2">View your account details and recent activity.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
                                        <AvatarFallback className="text-3xl bg-secondary text-secondary-foreground">
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="text-2xl font-bold text-card-foreground font-headline">{user.name}</h3>
                                    <p className="text-muted-foreground">{user.email}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-2">
                        <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-center"><UserIcon className="mr-2 h-5 w-5 text-primary" /> User Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <InfoRow icon={<Mail />} label="Email" value={user.email} />
                               <InfoRow icon={<Building />} label="Department" value={user.department} />
                               <InfoRow icon={<Briefcase />} label="Role" value={user.role} />
                               <InfoRow icon={<Clock />} label="Shift" value={userShift} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card className="mt-8 bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center"><List className="mr-2 h-5 w-5 text-primary" />Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? recentActivity.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-card-foreground">{log.action}</p>
                                        <p className="text-sm text-muted-foreground">{log.date} at {log.time}</p>
                                    </div>
                                    {log.duration && <Badge variant="secondary">{log.duration} min</Badge>}
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-4">No recent activity to display.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <Button asChild>
                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                    </Button>
                </div>
            </main>
        </AuthCheck>
    );
}
