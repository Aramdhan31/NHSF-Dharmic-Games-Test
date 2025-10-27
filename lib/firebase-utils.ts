import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Query,
  CollectionReference
} from 'firebase/firestore';
import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  off,
  push,
  child
} from 'firebase/database';
import { auth, db, realtimeDb } from './firebase';

// Auth utilities
export const authUtils = {
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    if (typeof window === 'undefined' || !auth) {
      return { success: false, error: 'Not available on server side' };
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Create new user account
  signUp: async (email: string, password: string, displayName?: string) => {
    if (typeof window === 'undefined' || !auth) {
      return { success: false, error: 'Not available on server side' };
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    if (typeof window === 'undefined' || !auth) {
      return { success: false, error: 'Not available on server side' };
    }
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Sign out current user
  signOut: async () => {
    if (typeof window === 'undefined' || !auth) {
      return { success: false, error: 'Not available on server side' };
    }
    
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Send password reset email
  resetPassword: async (email: string) => {
    if (typeof window === 'undefined' || !auth) {
      return { success: false, error: 'Not available on server side' };
    }

    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser: () => {
    if (typeof window === 'undefined' || !auth) {
      return null;
    }
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    if (typeof window === 'undefined' || !auth) {
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
};

// Firestore utilities
export const firestoreUtils = {
  // Create a document
  createDocument: async (collectionName: string, data: any, docId?: string) => {
    if (typeof window === 'undefined' || !db) {
      return { success: false, error: 'Not available on server side' };
    }
    
    try {
      if (docId) {
        await setDoc(doc(db, collectionName, docId), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { success: true, id: docId };
      } else {
        const docRef = await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get a document by ID
  getDocument: async (collectionName: string, docId: string) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get all documents from a collection
  getDocuments: async (collectionName: string, constraints?: any[]) => {
    if (typeof window === 'undefined' || !db) {
      return { success: false, error: 'Not available on server side' };
    }
    
    try {
      let q: CollectionReference | Query = collection(db, collectionName);
      
      if (constraints) {
        q = query(q, ...constraints);
      }
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: documents };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Update a document
  updateDocument: async (collectionName: string, docId: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Delete a document
  deleteDocument: async (collectionName: string, docId: string) => {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Listen to real-time updates
  listenToDocument: (collectionName: string, docId: string, callback: (data: any) => void) => {
    const docRef = doc(db, collectionName, docId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    });
  },

  // Listen to collection updates
  listenToCollection: (collectionName: string, callback: (data: any[]) => void, constraints?: any[]) => {
    if (typeof window === 'undefined' || !db) {
      return () => {};
    }
    
    let q: CollectionReference | Query = collection(db, collectionName);
    
    if (constraints) {
      q = query(q, ...constraints);
    }
    
    return onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(documents);
    });
  }
};

// Realtime Database utilities
export const realtimeDbUtils = {
  // Set data at a path
  setData: async (path: string, data: any) => {
    if (typeof window === 'undefined' || !realtimeDb) {
      return { success: false, error: 'Not available on server side' };
    }
    
    try {
      await set(ref(realtimeDb, path), data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get data from a path
  getData: async (path: string) => {
    try {
      const snapshot = await get(ref(realtimeDb, path));
      return { success: true, data: snapshot.val() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Update data at a path
  updateData: async (path: string, data: any) => {
    try {
      await update(ref(realtimeDb, path), data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Delete data at a path
  deleteData: async (path: string) => {
    try {
      await remove(ref(realtimeDb, path));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Push data to a list
  pushData: async (path: string, data: any) => {
    try {
      const newRef = push(ref(realtimeDb, path));
      await set(newRef, data);
      return { success: true, key: newRef.key };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Listen to real-time updates
  listenToData: (path: string, callback: (data: any) => void) => {
    const dataRef = ref(realtimeDb, path);
    
    onValue(dataRef, (snapshot) => {
      callback(snapshot.val());
    });

    // Return unsubscribe function
    return () => off(dataRef, 'value', callback);
  }
};

// NHSF (UK)-specific utilities
export const nhsfUtils = {
  // Get leaderboard data
  getLeaderboard: async () => {
    return await firestoreUtils.getDocuments('leaderboard', [
      orderBy('score', 'desc'),
      limit(10)
    ]);
  },

  // Update player score
  updatePlayerScore: async (playerId: string, newScore: number) => {
    return await firestoreUtils.updateDocument('players', playerId, {
      score: newScore,
      lastUpdated: serverTimestamp()
    });
  },

  // Get zone-specific data
  getZoneData: async (zone: string) => {
    return await firestoreUtils.getDocuments('zones', [
      where('zone', '==', zone)
    ]);
  },

  // Listen to real-time leaderboard
  listenToLeaderboard: (callback: (data: any[]) => void) => {
    return firestoreUtils.listenToCollection('leaderboard', callback, [
      orderBy('score', 'desc'),
      limit(10)
    ]);
  },

  // Listen to zone-specific updates
  listenToZoneUpdates: (zone: string, callback: (data: any[]) => void) => {
    return realtimeDbUtils.listenToData(`zones/${zone}`, callback);
  }
};
