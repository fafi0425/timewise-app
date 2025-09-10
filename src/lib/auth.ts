import type { User, Shift, UserState } from './types';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode as verifyFirebaseResetCode,
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


export const authenticateUser = async (email: string, pass: string): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        console.error("Authentication successful, but no user profile found in Firestore.");
        await signOut(auth);
        throw new Error("User profile does not exist in the database.");
    }

    const userProfile = { uid: userDocSnap.id, ...userDocSnap.data() } as User;
    
    const userStateRef = doc(db, 'userStates', firebaseUser.uid);
    const userStateSnap = await getDoc(userStateRef);
    if (!userStateSnap.exists()) {
        const initialState: UserState = {
            currentState: 'clocked_out',
            isClockedIn: false,
            breakStartTime: null,
            lunchStartTime: null,
            totalBreakMinutes: 0,
            totalLunchMinutes: 0
        };
        await setDoc(userStateRef, initialState);
    }

    return userProfile;

  } catch (error: any) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
         // This is an expected error when the user enters wrong credentials.
         // We throw a user-friendly error to be displayed in the UI.
         throw new Error("Invalid email or password. Please try again.");
    }
    console.error(`Firebase Authentication failed: ${error.message}`);
    throw error;
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
            shift: newUser.shift || 'none',
            photoURL: '',
        };
        delete (userForDb as Partial<User>).password; 
        
        await setDoc(doc(db, "users", firebaseUser.uid), userForDb);
        
        const userStateRef = doc(db, 'userStates', firebaseUser.uid);
        const initialState: UserState = {
            currentState: 'clocked_out',
            isClockedIn: false,
            breakStartTime: null,
            lunchStartTime: null,
            totalBreakMinutes: 0,
            totalLunchMinutes: 0
        };
        await setDoc(userStateRef, initialState);

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
      await deleteDoc(doc(db, "userStates", uid));
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

export const updateUserProfilePicture = async (userId: string, photoURL: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        photoURL: photoURL
    });
};

export const sendPasswordReset = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        console.error("Error sending password reset email:", error);
        if (error.code === 'auth/user-not-found') {
            // To avoid user enumeration, we don't reveal if the user exists or not.
            // The success message will be shown regardless.
            return;
        }
        throw new Error("Failed to send password reset email.");
    }
};

export const verifyResetCode = async (code: string): Promise<string> => {
    try {
        const email = await verifyFirebaseResetCode(auth, code);
        return email;
    } catch (error: any) {
        console.error("Error verifying password reset code:", error);
         if (error.code === 'auth/invalid-action-code') {
            throw new Error("The password reset link is invalid or has expired. Please request a new one.");
        }
        throw new Error("An unexpected error occurred while verifying the reset link.");
    }
}

export const resetPassword = async (code: string, newPass: string): Promise<void> => {
    try {
        await confirmPasswordReset(auth, code, newPass);
    } catch (error: any) {
        console.error("Error resetting password:", error);
         if (error.code === 'auth/invalid-action-code') {
            throw new Error("The password reset link is invalid or has expired. Please request a new one.");
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("Password is too weak. It must be at least 6 characters long.");
        }
        throw new Error("Failed to reset password.");
    }
}

export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
};
