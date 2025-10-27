"use client";

import React, { useEffect } from 'react';
import { setupDynamicWebsiteUpdates } from '@/lib/dynamic-updates';

interface DynamicUpdateProviderProps {
  children: React.ReactNode;
}

export function DynamicUpdateProvider({ children }: DynamicUpdateProviderProps) {
  useEffect(() => {
    console.log('🚀 Setting up dynamic website updates...');
    
    // Set up comprehensive dynamic updates
    setupDynamicWebsiteUpdates();
    
    // Log that dynamic updates are active
    console.log('✅ Dynamic updates active - one change updates everywhere!');
    console.log('🎯 Tournament day ready - all changes propagate automatically!');
    
    // Add visual indicator in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Dynamic Update System Status:');
      console.log('- Universities: Auto-updates teams page, league table, stats');
      console.log('- Players: Auto-updates admin dashboard, stats, university dashboard');
      console.log('- Matches: Auto-updates live results, league table, stats');
      console.log('- Scores: Auto-updates live results, league table, stats');
      console.log('- Admin: Auto-updates admin dashboard, permissions');
    }
    
  }, []);

  return <>{children}</>;
}
