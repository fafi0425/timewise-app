
import type { User } from './types';
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
  },
  {
    uid: 'user001',
    name: 'John Doe',
    email: 'user123@gmail.com',
    password: 'terra123',
    department: 'Dealing',
    role: 'Employee',
  },
];

export const seedInitialData = () => {
  if (!localStorage.getItem('users')) {
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
        if (user) {
            return { ...user, uid: firebaseUser.uid };
        }
    }
    // Fallback for locally defined users not in firebase auth
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const localUser = users.find(u => u.email === email && u.password === pass);
    return localUser || null;

  } catch (error) {
    // Fallback for locally defined users not in firebase auth
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const localUser = users.find(u => u.email === email && u.password === pass);
    if(localUser) return localUser;

    console.error("Firebase authentication failed:", error);
    return null;
  }
};

export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem('users') || '[]');
};

export const addUser = async (newUser: Omit<User, 'uid'>): Promise<User | null> => {
    const users = getUsers();
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password!);
        const firebaseUser = userCredential.user;
        const userWithId: User = { ...newUser, uid: firebaseUser.uid };
        users.push(userWithId);
        localStorage.setItem('users', JSON.stringify(users));
        return userWithId;
    } catch(e) {
        console.error(e)
        const localUser = users.find(u => u.email === newUser.email);
        if(localUser) return localUser;
        const userWithId: User = { ...newUser, uid: `user${Date.now()}` };
        users.push(userWithId);
        localStorage.setItem('users', JSON.stringify(users));
        return userWithId;
    }
};

export const deleteUser = async (uid: string): Promise<void> => {
    let users = getUsers();
    const userToDelete = users.find(u => u.uid === uid);
    if (!userToDelete) return;

    try {
      // This is a placeholder, you'll need to handle re-authentication for deletion in a real app
      // For now, we are assuming deletion will work directly.
      // This will only work for users created through firebase.
      if (auth.currentUser && auth.currentUser.uid === uid) {
        await deleteFirebaseUser(auth.currentUser);
      } else {
        // This is a complex operation and requires admin privileges to delete other users.
        // For this prototype, we'll just remove from local storage.
        console.warn("Cannot delete other Firebase users from the client. Deleting from local storage only.");
      }
    } catch (error) {
        console.error("Error deleting user from Firebase:", error);
    }
    
    users = users.filter(user => user.uid !== uid);
    localStorage.setItem('users', JSON.stringify(users));
};


export const signOutUser = async () => {
    await signOut(auth);
};
