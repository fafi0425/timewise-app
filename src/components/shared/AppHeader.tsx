
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Clock, Crown, LogOut, User as UserIcon, LayoutDashboard, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

export default function AppHeader({ isAdmin = false }: { isAdmin?: boolean }) {
  const [time, setTime] = useState('');
  const { user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const getNavButton = () => {
    if (isAdmin) return null;

    if (pathname === '/dashboard') {
        return (
            <>
                <Button asChild variant="ghost" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 hidden sm:flex">
                    <Link href="/timesheet">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        My Timesheet
                    </Link>
                </Button>
                 <Button asChild variant="ghost" className="bg-white/20 hover-bg-white/30 text-white px-4 py-2">
                    <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        My Profile
                    </Link>
                </Button>
            </>
        );
    }

     if (pathname === '/timesheet') {
         return (
             <>
                <Button asChild variant="ghost" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 hidden sm:flex">
                    <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </Link>
                </Button>
                 <Button asChild variant="ghost" className="bg-white/20 hover-bg-white/30 text-white px-4 py-2">
                    <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        My Profile
                    </Link>
                </Button>
            </>
         );
    }
    
    if (pathname === '/profile') {
        return (
             <>
                <Button asChild variant="ghost" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 hidden sm:flex">
                    <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </Link>
                </Button>
                 <Button asChild variant="ghost" className="bg-white/20 hover-bg-white/30 text-white px-4 py-2">
                    <Link href="/timesheet">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        My Timesheet
                    </Link>
                </Button>
            </>
        );
    }

    return null;
  }


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
             {user && (
                <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL} alt={user.name} />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                     <span className="text-white/80 text-sm hidden sm:block font-medium">
                        {user.name}
                    </span>
                </div>
            )}
            <div className="text-white/80 text-sm hidden sm:block">
              <span className="font-code">{time}</span>
            </div>
             
             {getNavButton()}

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
