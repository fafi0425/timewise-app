
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { User, UserState, Shift } from '@/lib/types';
import { SHIFTS } from '@/components/admin/ShiftManager';
import { Users as UsersIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';


interface OnShiftUser extends User {
    status: 'Working' | 'On Break' | 'On Lunch' | 'Logged Out';
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
                 usersInShiftQuery = query(collection(db, "users"), where("role", "!=", "Administrator"));
            } else {
                 usersInShiftQuery = query(collection(db, "users"), where("shift", "==", shiftToDisplay), where("role", "!=", "Administrator"));
            }
            
            const usersSnapshot = await getDocs(usersInShiftQuery);
            const usersInShift = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));

            if (usersInShift.length === 0) {
                setOnShiftUsers([]);
                return;
            }
            
            const uids = usersInShift.map(u => u.uid);
            const statesQuery = query(collection(db, 'userStates'), where('__name__', 'in', uids));

            const unsubscribe = onSnapshot(statesQuery, (statesSnapshot) => {
                const userStates = statesSnapshot.docs.reduce((acc, doc) => {
                    acc[doc.id] = doc.data() as UserState;
                    return acc;
                }, {} as Record<string, UserState>);

                const rosterUsers = usersInShift.map(user => {
                    const state = userStates[user.uid];
                    let status: OnShiftUser['status'] = 'Logged Out';
                    if (state?.isClockedIn) {
                        switch(state.currentState) {
                            case 'working': status = 'Working'; break;
                            case 'break': status = 'On Break'; break;
                            case 'lunch': status = 'On Lunch'; break;
                            default: status = 'Logged Out';
                        }
                    }
                    return { ...user, status };
                });
                setOnShiftUsers(rosterUsers);
            });

            return unsubscribe;
        };

        const unsubscribePromise = updateList();

        const interval = setInterval(updateList, 60000); // Poll for shift changes every 60s
        window.addEventListener('storage', updateList);
        
        return () => {
            unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
            clearInterval(interval);
            window.removeEventListener('storage', updateList);
        }
    }, []);

    const getActionBadgeVariant = (action: string) => {
        if (action === 'Working') return 'secondary';
        if (action === 'On Break' || action === 'On Lunch') return 'default';
        if (action === 'Logged Out') return 'destructive';
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
                                    </div>
                                     <Badge variant={getActionBadgeVariant(u.status)}>{u.status}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
