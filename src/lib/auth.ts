
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
    updateDoc
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
};

export const authenticateUser = async (email: string, pass: string): Promise<User | null> => {
  // Special case for local admin login, which doesn't use Firebase Auth.
  if (email === defaultAdmin.email && pass === defaultAdmin.password) {
    const adminDoc = await getDoc(doc(db, 'users', defaultAdmin.uid));
    if (adminDoc.exists()) {
        return { uid: adminDoc.id, ...adminDoc.data() } as User;
    }
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    // Fetch user profile from Firestore, which is the source of truth for user roles and data.
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        console.error("Authentication successful, but no user profile found in Firestore.");
        await signOut(auth);
        return null;
    }

    const userProfile = { uid: userDocSnap.id, ...userDocSnap.data() } as User;
    return userProfile;

  } catch (error: any) {
    console.error("Firebase Authentication failed:", error.message);
    return null;
  }
};

export const addUser = async (newUser: Omit<User, 'uid'>): Promise<User | null> => {
    if (!newUser.email || !newUser.password) {
        console.error("Email and password are required to add a user.");
        return null;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
        const firebaseUser = userCredential.user;
        
        try {
          await sendEmailVerification(firebaseUser);
          console.log("Verification email sent.");
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
        }

        const userForDb: Omit<User, 'password'> = { 
            ...newUser, 
            uid: firebaseUser.uid,
            shift: newUser.shift || 'none'
        };
        delete (userForDb as Partial<User>).password; 
        
        await setDoc(doc(db, "users", firebaseUser.uid), userForDb);
        
        return userForDb as User;

    } catch(e: any) {
        console.error("Error creating user in Firebase:", e);
        throw e;
    }
};

export const deleteUser = async (uid: string): Promise<void> => {
    console.warn(`Deleting user ${uid} from Firestore. Auth entry must be deleted from Firebase Console.`);
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch(e) {
      console.error("Error deleting user from Firestore:", e);
    }
};

export const updateUser = async (updatedUser: User): Promise<void> => {
    const userRef = doc(db, 'users', updatedUser.uid);
    const userDataToUpdate: Partial<User> = { ...updatedUser };
    delete userDataToUpdate.uid; 
    delete userDataToUpdate.password;

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
