
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
  }
];

export const seedInitialData = () => {
  if (typeof window !== 'undefined') {
      // Always reset to default on app load for a clean slate as requested.
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      localStorage.removeItem('activityLog');
      // Remove any stale user state
      Object.keys(localStorage).forEach(key => {
          if (key.startsWith('userState_')) {
              localStorage.removeItem(key);
          }
      });
  }
};

export const authenticateUser = async (email: string, pass: string): Promise<User | null> => {
  const localUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
  const localUserMatch = localUsers.find(u => u.email === email && u.password === pass);

  if (localUserMatch) {
    return localUserMatch;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    // Check local storage for a user that was maybe created via admin panel
    const localUser = localUsers.find(u => u.email === email);
    if(localUser){
        return localUser;
    }
    // Fallback for a user that exists in Firebase but somehow not locally.
    // This can happen if local storage is cleared but firebase auth is not.
    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: firebaseUser.displayName || email.split('@')[0],
        department: 'CS/KYC',
        role: 'Employee',
        shift: 'morning',
    }
  } catch (error: any) {
    console.error("Firebase Authentication failed:", error);
    // This is where we might have a user who is only in local storage (like the default admin)
    // but the initial check failed (e.g. wrong password). We return null.
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
        
        try {
          await sendEmailVerification(firebaseUser);
          console.log("Verification email sent.");
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
        }

        const userWithId: User = { ...newUser, uid: firebaseUser.uid };
        users.push(userWithId);
        localStorage.setItem('users', JSON.stringify(users));
        return userWithId;
    } catch(e: any) {
        if (e.code === 'auth/email-already-in-use') {
            console.warn("User already exists in Firebase Auth. Adding to local storage.");
             const userWithId: User = { ...newUser, uid: `user${Date.now()}` }; 
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
    
    if (!userToDelete.uid.startsWith('user') && !userToDelete.uid.startsWith('admin')) {
        try {
          console.warn("Client-side user deletion is not recommended for production. Deleting from Firebase Auth is complex from the client.");
        } catch (error) {
            console.error("Error deleting user from Firebase:", error);
        }
    }
    
    users = users.filter(user => user.uid !== uid);
    localStorage.setItem('users', JSON.stringify(users));
};

export const updateUser = (updatedUser: User): void => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === updatedUser.uid);
    
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        localStorage.setItem('users', JSON.stringify(users));
    } else {
        throw new Error('User not found');
    }
};

export const updateUserShift = (userId: string, shift: Shift): void => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === userId);
    
    if (userIndex !== -_1) {
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
