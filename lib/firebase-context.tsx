"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authUtils } from './firebase-utils';
import { userManagementService, User } from './user-management';

interface FirebaseContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: FirebaseUser }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string; user?: FirebaseUser }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; user?: FirebaseUser }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const unsubscribe = authUtils.onAuthStateChange(async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        console.log('✅ User still logged in:', firebaseUser.email);
        
        // Check if this is a university user (stored in localStorage)
        try {
          const universityId = localStorage.getItem('universityId');
          const universityName = localStorage.getItem('universityName');
          
          if (universityId && universityName) {
            // This is a university user - don't try to load from Firestore
            console.log('🏫 University user detected, skipping Firestore lookup');
            setUser(null); // Clear Firestore user data
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log('🔍 localStorage not available, proceeding with Firestore lookup');
        }
        
        // Load user data from Firestore (for admin users)
        try {
          const userResult = await userManagementService.getUserByEmail(firebaseUser.email!);
          if (userResult.success && userResult.data) {
            setUser(userResult.data as User);
            // Update last login
            await userManagementService.updateLastLogin(userResult.data.id);
          } else {
            // User not found in Firestore - wait a bit for signup process to complete
            
            // Check if this is a Google sign-in attempt
            if (firebaseUser.providerData.some(provider => provider.providerId === 'google.com')) {
              // Google sign-in attempted but user not registered
              await authUtils.signOut();
              setUser(null);
              // Set a flag to show registration required message
              setError('Please register first before using Google sign-in. Use the sign-up page to create your account.');
              return;
            }
            
            // Wait 5 seconds for signup process to complete, then check again
            setTimeout(async () => {
              // Double-check if this is a university user before signing out
              try {
                const universityId = localStorage.getItem('universityId');
                const universityName = localStorage.getItem('universityName');
                
                if (universityId && universityName) {
                  console.log('🏫 University user confirmed, not signing out');
                  setUser(null);
                  return;
                }
              } catch (error) {
                console.log('🔍 localStorage check failed in timeout');
              }
              
              const retryResult = await userManagementService.getUserByEmail(firebaseUser.email!);
              if (retryResult.success && retryResult.data) {
                setUser(retryResult.data as User);
              } else {
                console.log('❌ User not found in Firestore, using minimal fallback user');
                // Fallback: keep the session and create a minimal user object
                setUser({
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || firebaseUser.email || 'Admin',
                  role: 'super_admin'
                } as any);
                // Do NOT sign out; allow superadmin/email-admin fallback to work
              }
            }, 5000);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        console.log('🚪 User logged out (auth state cleared)');
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not available on server side' };
    }
    
    setLoading(true);
    const result = await authUtils.signIn(email, password);
    setLoading(false);
    return result;
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not available on server side' };
    }
    
    setLoading(true);
    const result = await authUtils.signUp(email, password, displayName);
    setLoading(false);
    return result;
  };

  const signInWithGoogle = async () => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not available on server side' };
    }
    
    setLoading(true);
    const result = await authUtils.signInWithGoogle();
    setLoading(false);
    return result;
  };

  const signOut = async () => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not available on server side' };
    }
    
    setLoading(true);
    const result = await authUtils.signOut();
    setLoading(false);
    return result;
  };

  const resetPassword = async (email: string) => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not available on server side' };
    }
    setLoading(true);
    const result = await authUtils.resetPassword(email);
    setLoading(false);
    return result;
  };

  const clearError = () => {
    setError(null);
  };

  const value: FirebaseContextType = {
    user,
    firebaseUser,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    clearError,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
