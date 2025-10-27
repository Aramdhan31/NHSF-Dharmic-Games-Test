"use client";

import { useState } from 'react';
import { useFirebase } from '@/lib/firebase-context';
import { userManagementService } from '@/lib/user-management';

export const useFirebaseAuth = () => {
  const { user, loading, error: contextError, signIn, signUp, signInWithGoogle, signOut, resetPassword, clearError: clearContextError } = useFirebase();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (email: string, password: string) => {
    setError(null);
    const result = await signIn(email, password);
    
    if (!result.success) {
      setError(result.error || 'Sign in failed');
    }
    
    return result;
  };

  const handleSignUp = async (email: string, password: string, displayName?: string) => {
    setError(null);
    const result = await signUp(email, password, displayName);
    
    if (!result.success) {
      setError(result.error || 'Sign up failed');
    }
    
    return result;
  };

  const handleSignInWithGoogle = async () => {
    setError(null);
    const result = await signInWithGoogle();
    
    if (!result.success) {
      setError(result.error || 'Google sign in failed');
    }
    
    return result;
  };

  const handleSignOut = async () => {
    setError(null);
    const result = await signOut();
    
    if (!result.success) {
      setError(result.error || 'Sign out failed');
    }
    
    return result;
  };

  const handleResetPassword = async (email: string) => {
    setError(null);
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Email is required');
      return { success: false, error: 'Email is required' } as const;
    }

    // Ensure the email exists in our registered users before attempting reset
    const exists = await userManagementService.getUserByEmail(normalizedEmail);
    if (!exists.success) {
      const message = 'This email is not registered. Please sign up first or contact support.';
      setError(message);
      return { success: false, error: message } as const;
    }

    const result = await resetPassword(normalizedEmail);
    if (!result.success) {
      setError(result.error || 'Failed to send password reset email');
    }
    return result;
  };

  return {
    user,
    loading,
    error: error || contextError,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    clearError: () => {
      setError(null);
      clearContextError();
    },
  };
};
