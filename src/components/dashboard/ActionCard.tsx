'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee, Utensils } from 'lucide-react';

interface ActionCardProps {
  type: 'break' | 'lunch';
  onStart: () => void;
  onEnd: () => void;
  disabled: boolean;
  isActive: boolean;
}

export default function ActionCard({ type, onStart, onEnd, disabled, isActive }: ActionCardProps) {
  const config = {
    break: {
      title: 'Break Time',
      icon: <Coffee className="h-8 w-8 text-white" />,
      startText: 'Break Out',
      endText: 'Break In',
      color: 'bg-primary',
      hoverColor: 'hover:bg-primary/90',
    },
    lunch: {
      title: 'Lunch Time',
      icon: <Utensils className="h-8 w-8 text-white" />,
      startText: 'Lunch Out',
      endText: 'Lunch In',
      color: 'bg-secondary',
      hoverColor: 'hover:bg-secondary/90',
    },
  };

  const current = config[type];

  return (
    <Card className="bg-card/95 backdrop-blur-sm card-shadow rounded-2xl">
      <CardContent className="text-center pt-6">
        <div className={`w-16 h-16 ${current.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {current.icon}
        </div>
        <h3 className="text-xl font-semibold text-card-foreground mb-4 font-headline">{current.title}</h3>
        <div className="space-y-3">
          <Button
            onClick={onStart}
            className={`w-full font-semibold py-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${current.color} ${current.hoverColor}`}
            disabled={disabled || isActive}
          >
            {current.startText}
          </Button>
          <Button
            onClick={onEnd}
            variant="outline"
            className="w-full font-semibold py-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            disabled={!isActive}
          >
            {current.endText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
