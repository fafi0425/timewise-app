
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { User, ActivityLog, Shift } from '@/lib/types';
import { SHIFTS } from '@/components/admin/ShiftManager';
import { Users as UsersIcon } from 'lucide-react';

interface OnShiftUser {
    name: string;
    department: string;
    latestAction: string;
    latestActionTime: string;
}

interface OnShiftListProps {
    simpleStatus?: boolean;
}

export default function OnShiftList({ simpleStatus = false }: OnShiftListProps) {
    const [onShiftUsers, setOnShiftUsers] = useState<OnShiftUser[]>([]);
    const [activeShiftFilter, setActiveShiftFilter] = useState<Shift>('morning');
    const [title, setTitle] = useState('Current Shift Roster');

    useEffect(() => {
        const updateList = () => {
            const allUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
            const logs: ActivityLog[] = JSON.parse(localStorage.getItem('activityLog') || '[]');
            const shiftFilter = localStorage.getItem('activeShift') as Shift | null;

            const now = new Date();
            const currentHour = now.getHours();
            
            // Determine the actual current shift based on time
            let actualCurrentShift: Shift = 'night';
            if (currentHour >= SHIFTS.morning.start && currentHour < SHIFTS.mid.start) {
                actualCurrentShift = 'morning';
            } else if (currentHour >= SHIFTS.mid.start && currentHour < SHIFTS.night.start) {
                actualCurrentShift = 'mid';
            }
            
            // Use the admin's filter if set, otherwise default to the actual current shift
            const shiftToDisplay = shiftFilter || actualCurrentShift;
            setActiveShiftFilter(shiftToDisplay);
            setTitle(`${SHIFTS[shiftToDisplay].name} Roster`);

            const todayStr = now.toLocaleDateString();
            const onShift: OnShiftUser[] = [];
            
            allUsers.forEach(user => {
                // Check if the user is assigned to the shift being displayed
                if (user.shift !== shiftToDisplay) return;

                const userLogsToday = logs.filter(l => l.uid === user.uid && l.date === todayStr);
                if (userLogsToday.length === 0) return;

                const hasStartedWork = userLogsToday.some(l => l.action === 'Work Started');

                if (hasStartedWork) {
                    const latestLog = userLogsToday[0]; // Logs are prepended
                     onShift.push({
                        name: user.name,
                        department: user.department,
                        latestAction: latestLog.action,
                        latestActionTime: latestLog.time,
                    });
                }
            });
            
            setOnShiftUsers(onShift);
        };

        updateList();
        const interval = setInterval(updateList, 5000); // Poll for updates
        window.addEventListener('storage', updateList); // Listen for shift changes from admin
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', updateList);
        }
    }, []);

    const getActionBadgeVariant = (action: string) => {
        if (action.includes('In') || action.includes('Started')) return 'secondary';
        if (action.includes('Out')) return 'default';
        return 'outline';
    };

    return (
        <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
                    <UsersIcon className="h-5 w-5 mr-2 text-primary" /> 
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                    <div className="space-y-3">
                        {onShiftUsers.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>No employees from this shift are currently logged in.</p>
                            </div>
                        ) : (
                            onShiftUsers.map((u, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-card-foreground">{u.name}</div>
                                        <div className="text-sm text-muted-foreground">{u.department}</div>
                                        {!simpleStatus && (
                                            <div className="text-xs text-primary">Last activity at {u.latestActionTime}</div>
                                        )}
                                    </div>
                                    {simpleStatus ? 
                                     <Badge variant="secondary">Logged In</Badge> :
                                     <Badge variant={getActionBadgeVariant(u.latestAction)}>{u.latestAction}</Badge>
                                    }
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
