
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { authenticateUser, signOutUser } from '@/lib/auth';
import { endWorkSession } from '@/hooks/useTimeTracker';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUser({ uid: userDocSnap.id, ...userDocSnap.data() } as User);
        } else {
          // This can happen if the user is deleted from Firestore but not Auth.
          setUser(null);
          await signOutUser();
        }
      } else {
         setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== '/login' && pathname !== '/register') {
      // If not logged in and not on a public page, redirect to login
      router.push('/login');
    } else if (user) {
      // If logged in and on a public page, redirect to the correct dashboard
      if (pathname === '/login' || pathname === '/register') {
        if (user.role === 'Administrator') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
        const authenticatedUser = await authenticateUser(email, pass);
        // onAuthStateChanged will handle setting the user state and the useEffect will handle routing
        return authenticatedUser;
    } catch(error) {
        console.error("Login process failed:", error);
        return null;
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    if(user && user.role !== 'Administrator'){
       await endWorkSession(user);
    }
    try {
        await signOutUser();
    } catch (error) {
        console.error("Error during sign out:", error);
    } finally {
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
