
'use server';
import * as admin from 'firebase-admin';

// This function ensures the Firebase Admin SDK is initialized, but only once.
const initializeAdmin = () => {
  if (admin.apps.length > 0) {
    return;
  }

  try {
    const serviceAccount = {
      projectId: process.env.PROJECT_ID,
      clientEmail: process.env.CLIENT_EMAIL,
      // The private key needs to have its newlines restored.
      privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
    // Throw the error to prevent the app from continuing with a misconfigured state.
    throw new Error("Failed to initialize Firebase Admin SDK: " + error.message);
  }
};

// Initialize the SDK.
initializeAdmin();

// Export the initialized services.
export const db = admin.firestore();
export const adminAuth = admin.auth();
