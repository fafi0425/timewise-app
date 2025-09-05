
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { User, UserState, Shift } from '@/lib/types';
import { SHIFTS } from '@/components/admin/ShiftManager';
import { Users as UsersIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, Query } from 'firebase/firestore';


interface OnShiftUser extends User {
    status: 'Working' | 'On Break' | 'On Lunch' | 'Logged Out';
}

interface OnShiftListProps {
    simpleStatus?: boolean;
}

const getOverlappingShift = (hour: number): Shift | null => {
    // Morning (5-14) & Mid (13-22) -> Overlap 13:00-13:59
    if (hour === 13) return 'mid';
    // Mid (13-22) & Night (21-6) -> Overlap 21:00-21:59
    if (hour === 21) return 'night';
    // Night (21-6) & Morning (5-14) -> Overlap 5:00-5:59
    if (hour === 5) return 'morning';
    return null;
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
            const nightShiftEnd = SHIFTS.night.end!;
            const nightShiftStart = SHIFTS.night.start!;
            if (currentHour >= nightShiftStart || currentHour < nightShiftEnd) {
                 actualCurrentShift = 'night';
            } else if (currentHour >= SHIFTS.morning.start! && currentHour < SHIFTS.morning.end!) {
                actualCurrentShift = 'morning';
            } else if (currentHour >= SHIFTS.mid.start! && currentHour < SHIFTS.mid.end!) {
                actualCurrentShift = 'mid';
            }
            
            const shiftToDisplay = shiftFilter || actualCurrentShift;
            setActiveShiftFilter(shiftToDisplay);

            const overlappingShift = getOverlappingShift(currentHour);
            const shiftsToQuery: Shift[] = [shiftToDisplay];
            
            let rosterTitle = `${SHIFTS[shiftToDisplay]?.name || 'Custom Shift'} Roster`;
            if (overlappingShift && !shiftFilter) { // Only show overlap if no specific shift is manually selected
                shiftsToQuery.push(overlappingShift);
                const overlapTitle = SHIFTS[overlappingShift]?.name;
                rosterTitle += ` & ${overlapTitle} Overlap`;
            }
            setTitle(rosterTitle);

            let usersInShiftQuery: Query;
            if (shiftsToQuery.includes('custom')) {
                 usersInShiftQuery = query(collection(db, "users"), where("role", "!=", "Administrator"));
            } else {
                 usersInShiftQuery = query(collection(db, "users"), where("shift", "in", shiftsToQuery), where("role", "!=", "Administrator"));
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

        const interval = setInterval(updateList, 60000);
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

    const getShiftBadgeVariant = (shift: Shift | undefined) => {
        switch(shift) {
            case 'morning': return 'bg-yellow-200 text-yellow-800';
            case 'mid': return 'bg-blue-200 text-blue-800';
            case 'night': return 'bg-indigo-200 text-indigo-800';
            default: return 'bg-gray-200 text-gray-800';
        }
    }

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
                                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                            <span>{u.department}</span>
                                            {u.shift && u.shift !== 'none' && (
                                                <Badge className={`font-normal ${getShiftBadgeVariant(u.shift)}`}>
                                                    {SHIFTS[u.shift]?.name || 'Custom'}
                                                </Badge>
                                            )}
                                        </div>
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
