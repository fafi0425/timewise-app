
'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';

export default function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    // This query now fetches all users from the 'online-users' collection.
    // The cleanup of stale users is handled by a server-side flow.
    const usersCollectionRef = query(collection(db, 'online-users'));
    
    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        // Basic check to ensure the document has some data
        if (doc.data()?.uid) {
            users.push(doc.data() as User);
        }
      });
      setOnlineUsers(users);
    }, (error) => {
        console.error("Error fetching online users:", error);
        // If there's an error (like permissions), clear the list
        setOnlineUsers([]);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []); // The empty dependency array ensures this runs only once on mount

  return onlineUsers;
}
