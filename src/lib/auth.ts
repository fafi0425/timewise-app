
import type { User, Shift } from './types';
import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  deleteUser as deleteFirebaseUser,
  signOut
} from 'firebase/auth';

const defaultUsers: User[] = [
  {
    uid: 'admin001',
    name: 'System Administrator',
    email: 'admin123@gmail.com',
    password: 'sigma88',
    department: 'Admin',
    role: 'Administrator',
    shift: 'morning',
  },
  {
    uid: 'user001',
    name: 'John Doe',
    email: 'user123@gmail.com',
    password: 'terra123',
    department: 'Dealing',
    role: 'Employee',
    shift: 'morning',
  },
];

export const seedInitialData = () => {
  if (typeof window !== 'undefined' && !localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }
};

export const authenticateUser = async (email: string, pass: string): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    if (firebaseUser) {
        const users = getUsers();
        const user = users.find(u => u.email === email);
        // If user exists in local storage, return it with the firebase UID
        if (user) {
            return { ...user, uid: firebaseUser.uid };
        }
        // This case is unlikely if registration is handled correctly, but as a fallback:
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            name: firebaseUser.displayName || email,
            department: 'CS/KYC',
            role: 'Employee',
            shift: 'morning',
        }
    }
    return null;
  } catch (error: any) {
    // If Firebase auth fails, try to authenticate against local storage users.
    // This is useful for the seeded default users.
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const localUser = users.find(u => u.email === email && u.password === pass);
        if (localUser) {
            return localUser;
        }
    }
    // If it's another type of error, or local auth also fails, log it and return null.
    console.error("Authentication failed:", error);
    return null;
  }
};

export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('users') || '[]');
};

export const addUser = async (newUser: Omit<User, 'uid'>): Promise<User | null> => {
    const users = getUsers();
    const existingUser = users.find(u => u.email === newUser.email);
    if (existingUser) {
        return null; // User with this email already exists
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password!);
        const firebaseUser = userCredential.user;
        const userWithId: User = { ...newUser, uid: firebaseUser.uid };
        users.push(userWithId);
        localStorage.setItem('users', JSON.stringify(users));
        return userWithId;
    } catch(e: any) {
        // If user already exists in Firebase auth, but not locally (e.g. from previous session)
        // just add them to local storage list without creating a new auth user.
        if (e.code === 'auth/email-already-in-use') {
            console.warn("User already exists in Firebase Auth. Adding to local storage.");
             const userWithId: User = { ...newUser, uid: `user${Date.now()}` }; // Generate a temporary local UID
             users.push(userWithId);
             localStorage.setItem('users', JSON.stringify(users));
             return userWithId;
        }
        console.error("Error creating user:", e);
        return null;
    }
};

export const deleteUser = async (uid: string): Promise<void> => {
    let users = getUsers();
    const userToDelete = users.find(u => u.uid === uid);
    if (!userToDelete) return;
    
    // We only attempt to delete from Firebase if it's not a local-only UID
    if (!userToDelete.uid.startsWith('user') && !userToDelete.uid.startsWith('admin')) {
        try {
          // This is a placeholder for a proper admin SDK implementation.
          // Directly deleting users from the client is not secure or scalable.
          // In a real app, this would be an admin-privileged server-side call.
          console.warn("Client-side user deletion is not recommended for production. Deleting from Firebase Auth is complex from the client.");
        } catch (error) {
            console.error("Error deleting user from Firebase:", error);
        }
    }
    
    users = users.filter(user => user.uid !== uid);
    localStorage.setItem('users', JSON.stringify(users));
};

export const updateUserShift = (userId: string, shift: Shift): void => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === userId);
    if (userIndex !== -1) {
        users[userIndex].shift = shift;
        localStorage.setItem('users', JSON.stringify(users));
    } else {
        throw new Error('User not found');
    }
};

export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
};
