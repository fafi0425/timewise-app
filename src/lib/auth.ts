
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
    
    // Clear out local storage items that are no longer needed or should be reset on app start.
    if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('activityLog');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('userState_')) {
                localStorage.removeItem(key);
            }
        });
    }
};

export const authenticateUser = async (email: string, pass: string): Promise<User | null> => {
  // Special case for local admin login, which doesn't use Firebase Auth.
  if (email === defaultAdmin.email && pass === defaultAdmin.password) {
    return defaultAdmin;
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    // Fetch user profile from Firestore, which is the source of truth for user roles and data.
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        console.error("Authentication successful, but no user profile found in Firestore.");
        // This can happen if a user was created in Auth but their Firestore document creation failed.
        await signOut(auth); // Sign out the user to prevent a dangling session.
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
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    return userList;
  } catch(e) {
    console.error("Error fetching users from Firestore:", e);
    return [];
  }
};

export const addUser = async (newUser: Omit<User, 'uid'>): Promise<User | null> => {
    if (!newUser.email || !newUser.password) {
        console.error("Email and password are required to add a user.");
        return null;
    }
    
    try {
        // Step 1: Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
        const firebaseUser = userCredential.user;
        
        // Optional: Send a verification email
        try {
          await sendEmailVerification(firebaseUser);
          console.log("Verification email sent.");
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
        }

        // Step 2: Create the user profile in Firestore
        const userForDb: Omit<User, 'password'> = { 
            ...newUser, 
            uid: firebaseUser.uid,
            shift: newUser.shift || 'none'
        };
        // Ensure password is not stored in Firestore
        delete (userForDb as Partial<User>).password; 
        
        await setDoc(doc(db, "users", firebaseUser.uid), userForDb);
        
        // Return the newly created user object (without password)
        return userForDb as User;

    } catch(e: any) {
        console.error("Error creating user in Firebase:", e);
        // The error could be 'auth/email-already-in-use', which is useful for the UI.
        throw e;
    }
};

export const deleteUser = async (uid: string): Promise<void> => {
    // Note: Deleting from Firebase Auth requires admin privileges and is typically done server-side.
    // For this client-side app, we will just delete from the Firestore 'users' collection.
    // This prevents them from being loaded or logging in, but the auth entry will persist until manually deleted in console.
    console.warn(`Deleting user ${uid} from Firestore. Auth entry will remain.`);
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch(e) {
      console.error("Error deleting user from Firestore:", e);
    }
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
