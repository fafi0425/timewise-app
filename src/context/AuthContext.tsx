
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
          // Handle case where user exists in Auth but not Firestore
          setUser(null);
        }
      } else {
         const storedUser = localStorage.getItem('currentUser');
         if (storedUser) {
             const activeUser = JSON.parse(storedUser);
             // This typically applies to the local admin user who doesn't use Firebase Auth
             if (activeUser.role === 'Administrator') {
                 setUser(activeUser);
             } else {
                setUser(null);
             }
         } else {
            setUser(null);
         }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    } else if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (pathname === '/login' || pathname === '/register') {
        router.push(user.role === 'Administrator' ? '/admin' : '/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    const authenticatedUser = await authenticateUser(email, pass);
    if (authenticatedUser) {
      // onAuthStateChanged will handle setting the user state
      setLoading(false);
      return authenticatedUser;
    }
    setLoading(false);
    return null;
  };

  const logout = async () => {
    if(user && user.role !== 'Administrator'){
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
