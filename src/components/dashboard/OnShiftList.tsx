
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

export default function OnShiftList() {
    const [onShiftUsers, setOnShiftUsers] = useState<OnShiftUser[]>([]);
    const [activeShift, setActiveShift] = useState<Shift>('morning');

    useEffect(() => {
        const updateList = () => {
            const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
            const logs: ActivityLog[] = JSON.parse(localStorage.getItem('activityLog') || '[]');
            const currentShiftKey = localStorage.getItem('activeShift') as Shift || 'morning';
            setActiveShift(currentShiftKey);
            const shiftDetails = SHIFTS[currentShiftKey];
            
            const now = new Date();
            const currentHour = now.getHours();
            
            let isWithinShiftTime;
            if (shiftDetails.start < shiftDetails.end) {
                // Same-day shift (e.g., 7 AM - 3 PM)
                isWithinShiftTime = currentHour >= shiftDetails.start && currentHour < shiftDetails.end;
            } else {
                // Overnight shift (e.g., 11 PM - 7 AM)
                isWithinShiftTime = currentHour >= shiftDetails.start || currentHour < shiftDetails.end;
            }

            if (!isWithinShiftTime) {
                setOnShiftUsers([]);
                return;
            }
            
            const todayStr = now.toLocaleDateString();
            const onShift: OnShiftUser[] = [];
            
            users.forEach(user => {
                const userLogsToday = logs.filter(l => l.uid === user.uid && l.date === todayStr);
                if (userLogsToday.length === 0) return;

                const latestLog = userLogsToday[0]; // Logs are prepended, so the first is the latest

                // User is considered on shift if their last action wasn't a "sign out" equivalent
                // and they have started work. We'll check for 'Work Started' as a baseline.
                const hasStartedWork = userLogsToday.some(l => l.action === 'Work Started');

                if (hasStartedWork) {
                    // For simplicity, we are showing anyone who has clocked in today on the shift.
                    // A more complex implementation could check if the last action was 'Clock Out'
                    // but we don't have that action yet.
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
        return () => clearInterval(interval);
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
                    {SHIFTS[activeShift]?.name || 'Current Shift'} Roster
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                    <div className="space-y-3">
                        {onShiftUsers.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>No employees currently on shift.</p>
                            </div>
                        ) : (
                            onShiftUsers.map((u, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-card-foreground">{u.name}</div>
                                        <div className="text-sm text-muted-foreground">{u.department}</div>
                                        <div className="text-xs text-primary">Last activity at {u.latestActionTime}</div>
                                    </div>
                                    <Badge variant={getActionBadgeVariant(u.latestAction)}>{u.latestAction}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
