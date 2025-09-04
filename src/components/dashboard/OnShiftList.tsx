
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { User, ActivityLog, Shift } from '@/lib/types';
import { SHIFTS } from '@/components/admin/ShiftManager';
import { Users as UsersIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';


interface OnShiftUser {
    uid: string;
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
        const updateList = async () => {
            const shiftFilter = localStorage.getItem('activeShift') as Shift | null;

            const now = new Date();
            const currentHour = now.getHours();
            
            let actualCurrentShift: Shift = 'morning';
            if (shiftFilter === 'custom') {
                actualCurrentShift = 'custom';
            } else {
                const nightShiftEnd = SHIFTS.night.end!;
                const nightShiftStart = SHIFTS.night.start!;
                if (currentHour >= nightShiftStart || currentHour < nightShiftEnd) {
                     actualCurrentShift = 'night';
                } else if (currentHour >= SHIFTS.morning.start! && currentHour < SHIFTS.morning.end!) {
                    actualCurrentShift = 'morning';
                } else if (currentHour >= SHIFTS.mid.start! && currentHour < SHIFTS.mid.end!) {
                    actualCurrentShift = 'mid';
                }
            }
            
            const shiftToDisplay = shiftFilter || actualCurrentShift;
            setActiveShiftFilter(shiftToDisplay);
            setTitle(`${SHIFTS[shiftToDisplay]?.name || 'Custom Shift'} Roster`);

            let usersInShiftQuery;
            if (shiftToDisplay === 'custom') {
                 // For custom shifts, logic might need to be more complex.
                 // For now, let's assume it shows all active non-admin users.
                 usersInShiftQuery = query(collection(db, "users"), where("role", "!=", "Administrator"));
            } else {
                 usersInShiftQuery = query(collection(db, "users"), where("shift", "==", shiftToDisplay), where("role", "!=", "Administrator"));
            }
            
            const usersSnapshot = await getDocs(usersInShiftQuery);
            const usersInShift = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            
            const rosterUsersPromises = usersInShift.map(async (user) => {
                 const activityQuery = query(
                    collection(db, "activity"), 
                    where("uid", "==", user.uid), 
                    orderBy("timestamp", "desc"), 
                    limit(1)
                );
                const activitySnapshot = await getDocs(activityQuery);
                const latestLog = activitySnapshot.docs[0]?.data() as ActivityLog;

                if (!latestLog || latestLog.action === 'Work Ended' || latestLog.date !== new Date().toLocaleDateString()) {
                     return {
                        uid: user.uid,
                        name: user.name,
                        department: user.department,
                        latestAction: 'Logged Out',
                        latestActionTime: latestLog?.time || '',
                    };
                }
                
                return {
                    uid: user.uid,
                    name: user.name,
                    department: user.department,
                    latestAction: latestLog.action,
                    latestActionTime: latestLog.time,
                };
            });

            const rosterUsers = await Promise.all(rosterUsersPromises);
            setOnShiftUsers(rosterUsers);
        };

        updateList();
        const interval = setInterval(updateList, 30000); // Poll for updates every 30s
        window.addEventListener('storage', updateList); // Listen for shift changes from admin
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', updateList);
        }
    }, []);

    const getActionBadgeVariant = (action: string) => {
        if (action.includes('In') || action.includes('Started') || action === 'working') return 'secondary';
        if (action.includes('Out')) return 'default';
        if (action === 'Logged Out') return 'destructive';
        if (action === 'break' || action === 'lunch') return 'default';
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
                                <p>No employees are assigned to or active in this shift.</p>
                            </div>
                        ) : (
                            onShiftUsers.map((u) => (
                                <div key={u.uid} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-card-foreground">{u.name}</div>
                                        <div className="text-sm text-muted-foreground">{u.department}</div>
                                        {(!simpleStatus && u.latestAction !== 'Logged Out') && (
                                            <div className="text-xs text-primary">Last activity at {u.latestActionTime}</div>
                                        )}
                                    </div>
                                    {simpleStatus ? 
                                     <Badge variant={u.latestAction === 'Logged Out' ? 'destructive' : 'secondary'}>
                                        {u.latestAction === 'Logged Out' ? 'Logged Out' : 'Active'}
                                     </Badge> :
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
