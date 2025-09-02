
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "timewise-8ivr2",
  appId: "1:387642298145:web:581614b208c8a1c6f77860",
  storageBucket: "timewise-8ivr2.firebasestorage.app",
  apiKey: "AIzaSyC6bkbCGIsNOTOmdtbSseOUbjue7bSEffw",
  authDomain: "timewise-8ivr2.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "387642298145"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
