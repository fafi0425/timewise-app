
import type { User, Shift } from './types';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification
} from 'firebase/auth';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    deleteDoc, 
    updateDoc,
    query,
    where
} from 'firebase/firestore';

const defaultAdmin: User = {
  uid: 'admin001',
  name: 'System Administrator',
  email: 'admin123@gmail.com',
  password: 'sigma88',
  department: 'Admin',
  role: 'Administrator',
  shift: 'none',
};

// This function now ensures the admin user exists in Firestore.
export const seedInitialData = async () => {
    const adminRef = doc(db, 'users', defaultAdmin.uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
        console.log("Seeding default administrator into Firestore...");
        const adminDataForDb = { ...defaultAdmin };
        // Do not store the plaintext password in the database.
        delete adminDataForDb.password; 
        await setDoc(adminRef, adminDataForDb);
    }
    
    // Clear out local storage items that are no longer needed or should be reset.
    if (typeof window !== 'undefined') {
        localStorage.removeItem('activityLog');
        localStorage.removeItem('currentUser');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('userState_')) {
                localStorage.removeItem(key);
            }
        });
    }
};

export const authenticateUser = async (email: string, pass: string): Promise<User | null> => {
  // Special case for local admin login
  if (email === defaultAdmin.email && pass === defaultAdmin.password) {
    return defaultAdmin;
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        console.error("Authentication successful, but no user profile found in Firestore.");
        return null;
    }

    const userProfile = { uid: userDocSnap.id, ...userDocSnap.data() } as User;
    return userProfile;

  } catch (error: any) {
    console.error("Firebase Authentication failed:", error.message);
    return null;
  }
};


export const getUsers = async (): Promise<User[]> => {
  const usersCollection = collection(db, 'users');
  const userSnapshot = await getDocs(usersCollection);
  const userList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
  return userList;
};

export const addUser = async (newUser: Omit<User, 'uid'>): Promise<User | null> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password!);
        const firebaseUser = userCredential.user;
        
        try {
          await sendEmailVerification(firebaseUser);
          console.log("Verification email sent.");
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
        }

        const userWithId: Omit<User, 'password'> = { 
            ...newUser, 
            uid: firebaseUser.uid,
            shift: 'none'
        };
        delete (userWithId as Partial<User>).password;

        // Save user profile to Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), userWithId);
        
        return userWithId as User;

    } catch(e: any) {
        console.error("Error creating user in Firebase:", e);
        return null;
    }
};

export const deleteUser = async (uid: string): Promise<void> => {
    // Note: Deleting from Firebase Auth requires admin privileges and is typically done server-side.
    // For this client-side app, we will just delete from the Firestore 'users' collection.
    // This prevents them from being loaded, but the auth entry will persist.
    console.warn(`Deleting user ${uid} from Firestore. Auth entry will remain.`);
    await deleteDoc(doc(db, "users", uid));
};

export const updateUser = async (updatedUser: User): Promise<void> => {
    const userRef = doc(db, 'users', updatedUser.uid);
    const userDataToUpdate: Partial<User> = { ...updatedUser };
    delete userDataToUpdate.uid; // Don't try to update the ID field
    delete userDataToUpdate.password; // Never store/update password

    await updateDoc(userRef, userDataToUpdate);
};

export const updateUserShift = async (userId: string, shift: Shift): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        shift: shift
    });
};

export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
};
