import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7sBpDqo6fQoAQddZry9UyJKlK2yy6Z3k",
  authDomain: "nhsf-test.firebaseapp.com",
  projectId: "nhsf-test",
  storageBucket: "nhsf-test.firebasestorage.app",
  messagingSenderId: "235310238787",
  appId: "1:235310238787:web:d2875c334ac783d7b618f6",
  measurementId: "G-STVX7Q1FJP",
  databaseURL: "https://nhsf-test-default-rtdb.firebaseio.com/"
};

// Initialize Firebase for server-side use
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { app, db };
export default app;
