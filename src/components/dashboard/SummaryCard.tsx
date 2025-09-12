'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardProps {
  summary: {
    totalBreakTime: number;
    totalLunchTime: number;
    totalWorkTime: string;
  };
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-card-foreground font-headline">Today's Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Break Time:</span>
          <span className="font-semibold text-card-foreground">{summary.totalBreakTime} min</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Lunch Time:</span>
          <span className="font-semibold text-card-foreground">{summary.totalLunchTime} min</span>
        </div>
      </CardContent>
    </Card>
  );
}
