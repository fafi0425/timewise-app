'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Clock, Crown, LogOut } from 'lucide-react';

export default function AppHeader({ isAdmin = false }: { isAdmin?: boolean }) {
  const [time, setTime] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              {isAdmin ? (
                <Crown className="text-white" />
              ) : (
                <Clock className="text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white font-headline">
              {isAdmin ? 'Admin Dashboard' : 'TimeWise'}
            </h1>
          </div>
          {!isAdmin && (
            <div className="hidden md:block text-center">
                <div className="text-xl font-bold text-white/90 font-headline">Terra Services & Technologies Inc</div>
            </div>
          )}
          <div className="flex items-center space-x-4">
            <div className="text-white/80 text-sm hidden sm:block">
              <span className="font-code">{time}</span>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
