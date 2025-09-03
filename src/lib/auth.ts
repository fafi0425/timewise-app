
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
      localStorage.removeItem('currentUser'); // <-- This is the new line to fix the issue
      
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
  const localUserMatch = localUsers.find(u => u.email === email);

  // If user is not in the local list at all, deny access.
  if (!localUserMatch) {
    console.error("Authentication failed: User not found in local user list.");
    return null;
  }
  
  // For locally defined users (like the default admin), check the password directly.
  if (localUserMatch.password === pass) {
    return localUserMatch;
  }

  // For users created via registration, try Firebase Auth.
  // The user MUST exist in the local list to even get to this point.
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    // If Firebase sign-in is successful, return the user data from our local list.
    return localUserMatch;
  } catch (error: any) {
    console.error("Firebase Authentication failed:", error.message);
    // If Firebase auth fails (e.g., wrong password), return null.
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
        // Don't store the password in local storage for Firebase-authenticated users
        delete userWithId.password; 
        users.push(userWithId);
        localStorage.setItem('users', JSON.stringify(users));
        return userWithId;
    } catch(e: any) {
        if (e.code === 'auth/email-already-in-use') {
            // This can happen if a user was created in Firebase but not in local storage.
            // We should add them to local storage now.
            const existingFirebaseUser = users.find(u => u.email === newUser.email);
            if (existingFirebaseUser) {
                 return existingFirebaseUser; // Already exists, just return it.
            }
            console.warn("User already exists in Firebase Auth. Adding to local storage.");
            const userWithId: User = { ...newUser, uid: `user${Date.now()}` }; 
            delete userWithId.password;
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
    
    // We can't actually delete the Firebase user from the client-side due to security rules.
    // The action of removing them from the local 'users' list will prevent them from logging in,
    // which is sufficient for this application's logic.
    console.warn("Removing user from local list. This will prevent login but not delete the user from Firebase Auth backend.");
    
    users = users.filter(user => user.uid !== uid);
    localStorage.setItem('users', JSON.stringify(users));
};

export const updateUser = (updatedUser: User): void => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === updatedUser.uid);
    
    if (userIndex !== -1) {
        // Ensure password is not overwritten if it's not being changed
        const existingUser = users[userIndex];
        users[userIndex] = { ...existingUser, ...updatedUser };

        // If the updated user object still has a password, and it's a default user, keep it.
        // Otherwise, remove it for security.
        if (users[userIndex].password && !defaultUsers.find(u => u.uid === users[userIndex].uid)) {
            delete users[userIndex].password;
        }

        localStorage.setItem('users', JSON.stringify(users));
    } else {
        throw new Error('User not found');
    }
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
