
import type { User, Shift } from './types';
import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  deleteUser as deleteFirebaseUser,
  signOut,
  sendEmailVerification
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
  // First, check if the credentials match any of the seeded/local users.
  // This is especially for the default admin/user that don't exist in Firebase Auth.
  const localUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
  const localUserMatch = localUsers.find(u => u.email === email && u.password === pass);
  
  if (localUserMatch) {
    // If it's a seeded user, we can try to sign them into Firebase if they exist there,
    // but if not, we can still proceed with the local data. This allows for flexibility.
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      return { ...localUserMatch, uid: firebaseUser.uid };
    } catch (error) {
       // This error is expected if the seeded user is not in Firebase Auth.
       // We can safely ignore it and return the matched local user.
       console.log(`Local user ${email} not in Firebase Auth, proceeding with local data.`);
       return localUserMatch;
    }
  }

  // If no local user was found, it must be a registered user, so try Firebase Auth.
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    if (firebaseUser) {
        const user = localUsers.find(u => u.email === email);
        if (user) {
            return { ...user, uid: firebaseUser.uid };
        }
        // Fallback for a user that exists in Firebase but somehow not locally.
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
    console.error("Firebase Authentication failed:", error);
    return null;
  }
};

export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
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
        
        // Send verification email
        try {
          await sendEmailVerification(firebaseUser);
          console.log("Verification email sent.");
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          // We don't block registration if email fails, just log it.
        }

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
