
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { User, UserState, Shift } from '@/lib/types';
import { SHIFTS } from '@/components/admin/ShiftManager';
import { Users as UsersIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, Query, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';


interface OnShiftUser extends User {
    status: 'Working' | 'On Break' | 'On Lunch' | 'Logged Out';
}

interface OnShiftListProps {
    simpleStatus?: boolean;
}

const getOverlappingShift = (hour: number): Shift | null => {
    if (hour === 13) return 'mid';
    if (hour === 21) return 'night';
    if (hour === 5) return 'morning';
    return null;
}

const getUserStatus = (state: UserState | undefined): OnShiftUser['status'] => {
    if (state?.isClockedIn) {
        switch (state.currentState) {
            case 'working': return 'Working';
            case 'break': return 'On Break';
            case 'lunch': return 'On Lunch';
            default: return 'Logged Out';
        }
    }
    return 'Logged Out';
};


export default function OnShiftList({ simpleStatus = false }: OnShiftListProps) {
    const { user: currentUser } = useAuth();
    const [onShiftUsers, setOnShiftUsers] = useState<OnShiftUser[]>([]);
    const [activeShiftFilter, setActiveShiftFilter] = useState<Shift>('morning');
    const [title, setTitle] = useState('Current Shift Roster');

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;
        
        const updateList = async () => {
            if (!currentUser) return;
            // Clean up previous listener
            if (unsubscribe) unsubscribe();

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
            if (overlappingShift && !shiftFilter) {
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
            
            const otherUserUids = usersInShift.filter(u => u.uid !== currentUser.uid).map(u => u.uid);
            let otherUserStates: Record<string, UserState> = {};
            
            if (otherUserUids.length > 0) {
                const statesQuery = query(collection(db, 'userStates'), where('__name__', 'in', otherUserUids));
                const statesSnapshot = await getDocs(statesQuery);
                 statesSnapshot.forEach(doc => {
                    otherUserStates[doc.id] = doc.data() as UserState;
                });
            }
           
            const updateRoster = (currentUserState?: UserState) => {
                 const rosterUsers = usersInShift.map(user => {
                    const state = user.uid === currentUser.uid ? currentUserState : otherUserStates[user.uid];
                    const status = getUserStatus(state);
                    return { ...user, status };
                });
                setOnShiftUsers(rosterUsers);
            };

            const currentUserStateRef = doc(db, 'userStates', currentUser.uid);
            unsubscribe = onSnapshot(currentUserStateRef, (stateDoc) => {
                const currentUserState = stateDoc.data() as UserState | undefined;
                updateRoster(currentUserState);
            }, (error) => {
                console.error("Error on user state snapshot:", error);
                // On error, just show the roster without real-time updates for current user.
                updateRoster(undefined);
            });
        };

        updateList();

        const interval = setInterval(updateList, 60000);
        window.addEventListener('storage', updateList);
        
        return () => {
            if (unsubscribe) unsubscribe();
            clearInterval(interval);
            window.removeEventListener('storage', updateList);
        }
    }, [currentUser]);

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
                                                    {SHIFTS[u.shift as Exclude<Shift, 'custom' | 'none'>]?.name || 'Custom'}
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
