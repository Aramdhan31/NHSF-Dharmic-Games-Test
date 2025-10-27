/**
 * 🔥 COMPREHENSIVE REAL-TIME SYNC SYSTEM
 * 
 * This ensures that ANY change made by admins or universities
 * updates EVERYWHERE on the website instantly - no manual refresh needed!
 */

import { ref, onValue, onChildAdded, onChildChanged, onChildRemoved } from 'firebase/database';
import { realtimeDb } from './firebase';
import { useState, useEffect } from 'react';

export interface RealtimeUpdate {
  type: 'university' | 'player' | 'match' | 'admin' | 'score' | 'status';
  action: 'added' | 'updated' | 'removed';
  data: any;
  timestamp: number;
}

export class RealtimeSyncManager {
  private listeners: { [key: string]: () => void } = {};
  private updateCallbacks: ((update: RealtimeUpdate) => void)[] = [];

  /**
   * 🎯 MAIN SYNC FUNCTION - Call this once to set up ALL real-time listeners
   * This ensures any change updates everywhere instantly
   */
  setupGlobalSync() {
    console.log('🔄 Setting up comprehensive real-time sync...');
    
    // 1. Universities changes (affects teams page, league table, stats)
    this.setupUniversitiesSync();
    
    // 2. Players changes (affects admin dashboard, stats, university dashboard)
    this.setupPlayersSync();
    
    // 3. Matches changes (affects live scores, league table, stats)
    this.setupMatchesSync();
    
    // 4. Admin requests (affects admin dashboard)
    this.setupAdminRequestsSync();
    
    // 5. Live scores (affects main page, live updates)
    this.setupLiveScoresSync();
    
    console.log('✅ Global real-time sync active - all changes will update everywhere instantly!');
  }

  /**
   * 🏛️ Universities Sync - Updates teams page, league table, stats
   */
  private setupUniversitiesSync() {
    const universitiesRef = ref(realtimeDb, 'universities');
    
    const unsubscribe = onValue(universitiesRef, (snapshot) => {
      console.log('🏛️ Universities data changed - updating everywhere...');
      
      this.notifyUpdate({
        type: 'university',
        action: 'updated',
        data: snapshot.val(),
        timestamp: Date.now()
      });
    }, (error) => {
      console.warn('⚠️ Universities access denied:', error.message);
    });
    
    this.listeners['universities'] = unsubscribe;
  }

  /**
   * 👥 Players Sync - Updates admin dashboard, stats, university dashboard
   */
  private setupPlayersSync() {
    const playersRef = ref(realtimeDb, 'players');
    
    const unsubscribe = onValue(playersRef, (snapshot) => {
      console.log('👥 Players data changed - updating everywhere...');
      
      this.notifyUpdate({
        type: 'player',
        action: 'updated',
        data: snapshot.val(),
        timestamp: Date.now()
      });
    }, (error) => {
      console.warn('⚠️ Players access denied:', error.message);
    });
    
    this.listeners['players'] = unsubscribe;
  }

  /**
   * 🏆 Matches Sync - Updates live scores, league table, stats
   */
  private setupMatchesSync() {
    const matchesRef = ref(realtimeDb, 'matches');
    
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      console.log('🏆 Matches data changed - updating everywhere...');
      
      this.notifyUpdate({
        type: 'match',
        action: 'updated',
        data: snapshot.val(),
        timestamp: Date.now()
      });
    }, (error) => {
      console.warn('⚠️ Matches access denied:', error.message);
    });
    
    this.listeners['matches'] = unsubscribe;
  }

  /**
   * 👑 Admin Requests Sync - Updates admin dashboard
   */
  private setupAdminRequestsSync() {
    const adminRequestsRef = ref(realtimeDb, 'adminRequests');
    
    const unsubscribe = onValue(adminRequestsRef, (snapshot) => {
      console.log('👑 Admin requests changed - updating admin dashboard...');
      
      this.notifyUpdate({
        type: 'admin',
        action: 'updated',
        data: snapshot.val(),
        timestamp: Date.now()
      });
    }, (error) => {
      console.warn('⚠️ Admin requests access denied - user may not be authenticated as admin');
      // Don't throw error, just log it and continue
    });
    
    this.listeners['adminRequests'] = unsubscribe;
  }

  /**
   * ⚡ Live Scores Sync - Updates main page, live scores
   */
  private setupLiveScoresSync() {
    const scoresRef = ref(realtimeDb, 'scores');
    
    const unsubscribe = onValue(scoresRef, (snapshot) => {
      console.log('⚡ Live scores changed - updating everywhere...');
      
      this.notifyUpdate({
        type: 'score',
        action: 'updated',
        data: snapshot.val(),
        timestamp: Date.now()
      });
    }, (error) => {
      console.warn('⚠️ Live scores access denied:', error.message);
    });
    
    this.listeners['scores'] = unsubscribe;
  }

  /**
   * 📢 Notify all components of updates
   */
  private notifyUpdate(update: RealtimeUpdate) {
    console.log('📢 Broadcasting update to all components:', update);
    
    this.updateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('❌ Error in update callback:', error);
      }
    });
  }

  /**
   * 📡 Subscribe to all real-time updates
   */
  onUpdate(callback: (update: RealtimeUpdate) => void) {
    this.updateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 🧹 Cleanup all listeners
   */
  cleanup() {
    console.log('🧹 Cleaning up real-time sync...');
    
    Object.values(this.listeners).forEach(unsubscribe => {
      unsubscribe();
    });
    
    this.listeners = {};
    this.updateCallbacks = [];
  }
}

// 🎯 Global instance - use this everywhere
export const realtimeSync = new RealtimeSyncManager();

/**
 * 🚀 QUICK SETUP - Call this in your main layout or app component
 */
export function setupGlobalRealtimeSync() {
  if (typeof window !== 'undefined') {
    realtimeSync.setupGlobalSync();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      realtimeSync.cleanup();
    });
  }
}

/**
 * 📱 COMPONENT HOOK - Use this in any component that needs real-time updates
 */
export function useRealtimeUpdates() {
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);
  
  useEffect(() => {
    const unsubscribe = realtimeSync.onUpdate((update) => {
      setLastUpdate(update);
      console.log('📱 Component received real-time update:', update);
    });
    
    return unsubscribe;
  }, []);
  
  return lastUpdate;
}
