
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
    shift: 'none',
  }
];

export const seedInitialData = () => {
  if (typeof window !== 'undefined') {
      const users = localStorage.getItem('users');
      // Only seed if users don't exist, to avoid overwriting on every load.
      if (!users) {
        localStorage.setItem('users', JSON.stringify(defaultUsers));
      }
      
      // For the purpose of this project, we start with only the default admin.
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      localStorage.removeItem('activityLog');
      localStorage.removeItem('currentUser');
      
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

  // Special case for the default admin user to allow local password check
  if (localUserMatch && localUserMatch.email === 'admin123@gmail.com' && localUserMatch.password === pass) {
    return localUserMatch;
  }
  
  // If user is not in the local list at all, deny access.
  if (!localUserMatch) {
    console.error("Authentication failed: User not found in local user list.");
    return null;
  }
  
  // For all other users, they must exist in the local list AND authenticate via Firebase.
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    // If Firebase sign-in is successful, return the user data from our local list.
    return localUserMatch;
  } catch (error: any) {
    // This will catch invalid credentials for Firebase-backed users.
    console.error("Firebase Authentication failed:", error.message);
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
        console.error("User with this email already exists in local storage.");
        return null; 
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

        const userWithId: User = { ...newUser, uid: firebaseUser.uid, shift: 'none' };
        // Don't store the password in local storage for Firebase-authenticated users
        delete userWithId.password; 
        
        const updatedUsers = [...users, userWithId];
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        return userWithId;

    } catch(e: any) {
        // This block handles Firebase errors, e.g., if the email is already in use in Firebase Auth
        console.error("Error creating user in Firebase:", e);
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
