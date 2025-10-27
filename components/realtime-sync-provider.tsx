"use client";

import React, { useEffect } from 'react';
import { setupGlobalRealtimeSync } from '@/lib/realtime-sync';

interface RealtimeSyncProviderProps {
  children: React.ReactNode;
}

export function RealtimeSyncProvider({ children }: RealtimeSyncProviderProps) {
  useEffect(() => {
    console.log('🚀 Setting up global real-time sync for tournament day...');
    
    // Set up comprehensive real-time sync
    setupGlobalRealtimeSync();
    
    // Log that real-time sync is active
    console.log('✅ Real-time sync active - all changes will update everywhere instantly!');
    console.log('🎯 Tournament day ready - admins and universities can make changes and they will update everywhere automatically!');
    
  }, []);

  return <>{children}</>;
}
