
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText, LoaderCircle } from 'lucide-react';
import { getDailySummaryOfOverbreaks } from '@/ai/flows/daily-summary-of-overbreaks';
import type { ActivityLog } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DailySummaryCardProps {
    activityLogs: ActivityLog[];
}

export default function DailySummaryCard({ activityLogs }: DailySummaryCardProps) {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generateSummary = async () => {
            setIsLoading(true);
            const today = new Date().toLocaleDateString();
            const todaysLogs = activityLogs.filter(log => log.date === today);

            if (todaysLogs.length === 0) {
                setSummary('No activity recorded today to generate a summary.');
                setIsLoading(false);
                return;
            }

            try {
                const result = await getDailySummaryOfOverbreaks({
                    date: today,
                    activityData: JSON.stringify(todaysLogs),
                });
                setSummary(result.summary);
            } catch (error) {
                console.error("Failed to generate daily summary:", error);
                setSummary('Could not generate summary due to an error.');
            } finally {
                setIsLoading(false);
            }
        };

        generateSummary();
    }, [activityLogs]);

    return (
        <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl p-6">
            <CardHeader className="!p-0 !pb-6">
                <CardTitle className="text-xl font-semibold text-card-foreground font-headline flex items-center">
                    <BookText className="mr-2 h-5 w-5 text-primary" /> AI Daily Summary
                </CardTitle>
            </CardHeader>
             <ScrollArea className="h-80 pr-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <p className="text-sm text-card-foreground whitespace-pre-wrap">{summary}</p>
                )}
            </ScrollArea>
        </Card>
    );
}
