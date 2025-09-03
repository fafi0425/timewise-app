
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Clock, Sunrise, Sunset, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Shift } from '@/lib/types';
import { Input } from '../ui/input';

export const SHIFTS: Record<Shift, { name: string, start?: number, end?: number, icon: React.ReactNode }> = {
    morning: { name: 'Morning Shift', start: 5, end: 14, icon: <Sunrise className="h-5 w-5" /> }, // 5 AM to 2 PM
    mid: { name: 'Mid Shift', start: 13, end: 22, icon: <Sunset className="h-5 w-5" /> },   // 1 PM to 10 PM
    night: { name: 'Night Shift', start: 21, end: 6, icon: <Moon className="h-5 w-5" /> },    // 9 PM to 6 AM
    custom: { name: 'Custom Shift', icon: <Clock className="h-5 w-5" /> }
};

export default function ShiftManager() {
    const [currentShift, setCurrentShift] = useState<Shift>('morning');
    const [customStartTime, setCustomStartTime] = useState('09:00');
    const [customEndTime, setCustomEndTime] = useState('17:00');
    const { toast } = useToast();

    useEffect(() => {
        const savedShift = localStorage.getItem('activeShift') as Shift | null;
        const savedCustomStart = localStorage.getItem('customShiftStart');
        const savedCustomEnd = localStorage.getItem('customShiftEnd');

        if (savedShift && SHIFTS[savedShift]) {
            setCurrentShift(savedShift);
        } else {
             // Set initial shift based on current time
            const hour = new Date().getHours();
            if (SHIFTS.night.start! <= hour || hour < SHIFTS.night.end!) {
                setCurrentShift('night');
            } else if (hour >= SHIFTS.morning.start! && hour < SHIFTS.morning.end!) {
                setCurrentShift('morning');
            } else if (hour >= SHIFTS.mid.start! && hour < SHIFTS.mid.end!) {
                setCurrentShift('mid');
            }
        }

        if (savedCustomStart) setCustomStartTime(savedCustomStart);
        if (savedCustomEnd) setCustomEndTime(savedCustomEnd);

    }, []);

    const handleShiftChange = () => {
        localStorage.setItem('activeShift', currentShift);
        if (currentShift === 'custom') {
            localStorage.setItem('customShiftStart', customStartTime);
            localStorage.setItem('customShiftEnd', customEndTime);
        }
        
        toast({
            title: "Shift Updated",
            description: `The active shift is now ${SHIFTS[currentShift].name}.`,
        });
        // This will trigger the 'storage' event listener in OnShiftList
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl h-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" /> Shift Management
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Select the current active shift for the team.</p>
                <RadioGroup value={currentShift} onValueChange={(value) => setCurrentShift(value as Shift)} className="space-y-3">
                    {Object.entries(SHIFTS).map(([key, value]) => (
                        <Label key={key} className="flex items-center space-x-3 p-3 rounded-lg border bg-blue-50/50 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-all">
                             <RadioGroupItem value={key} id={key} />
                             <div className="flex items-center gap-2">
                                {value.icon}
                                <span>{value.name}</span>
                             </div>
                        </Label>
                    ))}
                </RadioGroup>

                {currentShift === 'custom' && (
                    <div className="mt-4 space-y-4 p-4 border rounded-lg bg-blue-50/20">
                         <h4 className="font-medium text-card-foreground">Set Custom Shift Time</h4>
                         <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor="custom-start">Start Time</Label>
                                <Input id="custom-start" type="time" value={customStartTime} onChange={e => setCustomStartTime(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="custom-end">End Time</Label>
                                <Input id="custom-end" type="time" value={customEndTime} onChange={e => setCustomEndTime(e.target.value)} />
                            </div>
                         </div>
                    </div>
                )}


                <Button onClick={handleShiftChange} className="w-full mt-6">Set Active Shift</Button>
            </CardContent>
        </Card>
    );
}
