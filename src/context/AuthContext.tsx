
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { authenticateUser, seedInitialData, signOutUser } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const getOnlineUsers = (): User[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('onlineUsers') || '[]');
}

const setOnlineUsers = (users: User[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('onlineUsers', JSON.stringify(users));
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleUserOnline = useCallback((user: User) => {
    const onlineUsers = getOnlineUsers();
    if (!onlineUsers.find(u => u.uid === user.uid)) {
        setOnlineUsers([...onlineUsers, user]);
    }
  }, []);

  const handleUserOffline = useCallback((user: User | null) => {
      if(!user) return;
      const onlineUsers = getOnlineUsers();
      setOnlineUsers(onlineUsers.filter(u => u.uid !== user.uid));
  }, []);

  useEffect(() => {
    seedInitialData();

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const activeUser = JSON.parse(storedUser);
      setUser(activeUser);
      handleUserOnline(activeUser);
    }
    setLoading(false);

    const handleBeforeUnload = () => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            handleUserOffline(JSON.parse(storedUser));
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }

  }, [handleUserOnline, handleUserOffline]);

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
      handleUserOnline(authenticatedUser);
      setLoading(false);
      return authenticatedUser;
    }
    setLoading(false);
    return null;
  };

  const logout = async () => {
    handleUserOffline(user);
    await signOutUser();
    localStorage.removeItem('currentUser');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
