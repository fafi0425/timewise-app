
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { authenticateUser, seedInitialData, signOutUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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

  const handleUserOnline = useCallback(async (user: User) => {
    try {
      const userStatusRef = doc(db, 'online-users', user.uid);
      await setDoc(userStatusRef, {
          ...user,
          lastSeen: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to set user as online:", error);
    }
  }, []);

  const handleUserOffline = useCallback(async (user: User | null) => {
      if(!user) return;
      try {
        const userStatusRef = doc(db, 'online-users', user.uid);
        await deleteDoc(userStatusRef);
      } catch(error) {
        console.error("Failed to set user as offline:", error);
      }
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

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            await handleUserOffline(JSON.parse(storedUser));
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        // Ensure user is marked offline when component unmounts (e.g. tab close)
        if(user) {
            handleUserOffline(user);
        }
    }

  }, []); // Removed dependencies to avoid re-running on user state change within this effect

  // Heartbeat to update lastSeen timestamp
  useEffect(() => {
      if (!user) return;

      const interval = setInterval(() => {
        try {
          const userStatusRef = doc(db, 'online-users', user.uid);
          setDoc(userStatusRef, { lastSeen: serverTimestamp() }, { merge: true });
        } catch (error) {
            console.error("Failed to update heartbeat:", error);
        }
      }, 60000); // Update every minute

      return () => clearInterval(interval);
  }, [user]);

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
      await handleUserOnline(authenticatedUser);
      setLoading(false);
      return authenticatedUser;
    }
    setLoading(false);
    return null;
  };

  const logout = async () => {
    await handleUserOffline(user);
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
