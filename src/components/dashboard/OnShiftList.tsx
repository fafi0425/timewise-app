
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { User, UserState, Shift } from '@/lib/types';
import { SHIFTS } from '@/components/admin/ShiftManager';
import { Users as UsersIcon, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getAllUsersAction } from '@/lib/firebase-admin';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';


interface OnShiftUser extends User {
    status: 'Working' | 'On Break' | 'On Lunch' | 'Logged Out';
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

interface OnShiftListProps {
  simpleStatus?: boolean;
}

export default function OnShiftList({ simpleStatus = false }: OnShiftListProps) {
    const { user: currentUser } = useAuth();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [userStates, setUserStates] = useState<Record<string, UserState>>({});
    const [onShiftUsers, setOnShiftUsers] = useState<OnShiftUser[]>([]);
    const [title, setTitle] = useState('Current Shift Roster');
    const [isLoading, setIsLoading] = useState(true);

    const fetchAllUsers = useCallback(async () => {
        setIsLoading(true);
        const usersResult = await getAllUsersAction();
        if (usersResult.success && usersResult.users) {
            setAllUsers(usersResult.users);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]);

    useEffect(() => {
        if (allUsers.length === 0) return;

        const uids = allUsers.map(u => u.uid);
        // Firestore 'in' queries are limited to 30 items. If there are more users, we need multiple listeners.
        const chunk = <T,>(arr: T[], size: number) => 
            Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
                arr.slice(i * size, i * size + size)
            );

        const uidChunks = chunk(uids, 30);

        const unsubscribers = uidChunks.map(uidChunk => {
            const q = query(collection(db, "userStates"), where("__name__", "in", uidChunk));
            return onSnapshot(q, (snapshot) => {
                const states: Record<string, UserState> = {};
                snapshot.forEach(doc => {
                    states[doc.id] = doc.data() as UserState;
                });

                setUserStates(prevStates => ({ ...prevStates, ...states }));
            }, (error) => {
                console.error("Error fetching real-time user states:", error);
            });
        });

        return () => unsubscribers.forEach(unsub => unsub());

    }, [allUsers]);

    const updateOnShiftList = useCallback(() => {
        if (!currentUser || allUsers.length === 0) return;

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
        const overlappingShift = getOverlappingShift(currentHour);
        const shiftsToQuery: Shift[] = [shiftToDisplay];
        
        let rosterTitle = `${SHIFTS[shiftToDisplay]?.name || 'Custom Shift'} Roster`;
        if (overlappingShift && !shiftFilter) {
            shiftsToQuery.push(overlappingShift);
            const overlapTitle = SHIFTS[overlappingShift]?.name;
            rosterTitle += ` & ${overlapTitle} Overlap`;
        }
        setTitle(rosterTitle);

        const usersInShift = allUsers.filter(u => u.role !== 'Administrator' && u.shift && shiftsToQuery.includes(u.shift));

        const rosterUsers = usersInShift.map(user => ({
            ...user,
            status: getUserStatus(userStates[user.uid]),
        })).sort((a,b) => a.name.localeCompare(b.name));

        setOnShiftUsers(rosterUsers);

    }, [currentUser, allUsers, userStates]);

     useEffect(() => {
        updateOnShiftList();

        const handleStorageChange = () => {
             updateOnShiftList();
        };

        window.addEventListener('storage', handleStorageChange);
        const intervalId = setInterval(updateOnShiftList, 60000); // Also refresh periodically for time-based shifts

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('storage', handleStorageChange);
        }
    }, [updateOnShiftList]);

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
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full py-10">
                                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : onShiftUsers.length === 0 ? (
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
