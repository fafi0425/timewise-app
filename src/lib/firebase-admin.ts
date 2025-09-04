
import * as admin from 'firebase-admin';

// This guard prevents re-initializing the app in hot-reload environments.
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.PROJECT_ID,
      clientEmail: process.env.CLIENT_EMAIL,
      privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
  }
}

export const db = admin.firestore();
export const adminAuth = admin.auth();
