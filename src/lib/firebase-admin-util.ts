
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let app: admin.app.App;

const initializeAdmin = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    
    try {
        const serviceAccount = {
            projectId: process.env.PROJECT_ID,
            clientEmail: process.env.CLIENT_EMAIL,
            privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        return app;
    } catch (error: any) {
        console.error("Firebase Admin SDK initialization error:", error.message);
        throw new Error("Failed to initialize Firebase Admin SDK: " + error.message);
    }
};

export const getDb = () => {
    initializeAdmin();
    return getFirestore();
};

export const getAdminAuth = () => {
    initializeAdmin();
    return getAuth();
};
