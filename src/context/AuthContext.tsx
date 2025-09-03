
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { authenticateUser, seedInitialData, signOutUser } from '@/lib/auth';
import { endWorkSession } from '@/hooks/useTimeTracker';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const initializeApp = async () => {
        await seedInitialData();
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const activeUser = JSON.parse(storedUser);
          setUser(activeUser);
        }
        setLoading(false);
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    } else if (user) {
      if (pathname === '/login' || pathname === '/register') {
        router.push(user.role === 'Administrator' ? '/admin' : '/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    const authenticatedUser = await authenticateUser(email, pass);
    if (authenticatedUser) {
      localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      setLoading(false);
      return authenticatedUser;
    }
    setLoading(false);
    return null;
  };

  const logout = async () => {
    if(user){
       endWorkSession(user);
    }
    try {
        await signOutUser();
    } catch (error) {
        console.error("Error during sign out:", error);
    } finally {
        localStorage.removeItem('currentUser');
        setUser(null);
        router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
