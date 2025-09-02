
'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import type { User } from '@/lib/types';

export default function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    const usersCollectionRef = collection(db, 'online-users');
    
    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      setOnlineUsers(users);
    });

    return () => unsubscribe();
  }, []);

  return onlineUsers;
}
