
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace this with the configuration object from your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyC6bkbCGIsNOTOmdtbSseOUbjue7bSEffw",
  authDomain: "timewise-8ivr2.firebaseapp.com",
  projectId: "timewise-8ivr2",
  storageBucket: "timewise-8ivr2.appspot.com",
  messagingSenderId: "387642298145",
  appId: "1:387642298145:web:581614b208c8a1c6f77860",
  measurementId: "G-XXXXXXXXXX" // Optional: Replace if you use Google Analytics
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
