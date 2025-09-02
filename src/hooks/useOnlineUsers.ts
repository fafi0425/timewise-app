
'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';

export default function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    // Query for users seen in the last 5 minutes.
    // This helps ensure we don't show users who have disconnected without logging out.
    const fiveMinutesAgo = new Timestamp(Math.floor(Date.now() / 1000) - 5 * 60, 0);
    const usersCollectionRef = query(
        collection(db, 'online-users'), 
        where('lastSeen', '>', fiveMinutesAgo)
    );
    
    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      setOnlineUsers(users);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []); // The empty dependency array ensures this runs only once on mount

  return onlineUsers;
}
