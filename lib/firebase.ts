// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBvQ8Q9R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5F6",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nhsf-test.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nhsf-test",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "nhsf-test.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdefghijklmnopqrstuvwxyz",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ABCDEFGHIJ",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://nhsf-test-default-rtdb.firebaseio.com"
};

// Initialize Firebase - ensure singleton
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Debug: Log Firebase initialization
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase initialized:', app.name, 'Apps count:', getApps().length);
  console.log('🔥 Firebase Project ID:', firebaseConfig.projectId);
  console.log('🔥 Firebase Database URL:', firebaseConfig.databaseURL);
}

// Initialize Firebase Auth with persistence
export const auth = getAuth(app);

// Set persistence to keep users logged in across page refreshes
// Only run on client, and only once per session
if (typeof window !== 'undefined' && !(auth as any)._persistenceManager) {
  console.log('🔐 Setting Firebase Auth persistence...');
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('❌ Error setting auth persistence:', error);
  });
} else if (typeof window !== 'undefined') {
  console.log('🔐 Firebase Auth persistence already set');
}

export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

// Initialize Analytics only on client side
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
