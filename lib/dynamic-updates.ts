/**
 * 🔄 DYNAMIC WEBSITE UPDATE SYSTEM
 * 
 * When you make a change in ONE place, it automatically updates EVERYWHERE it's needed!
 * Perfect for tournament day - no manual updates required!
 */

import { ref, onValue, onChildAdded, onChildChanged, onChildRemoved } from 'firebase/database';
import { realtimeDb } from './firebase';
import { useState, useEffect } from 'react';

export interface DynamicUpdate {
  type: 'university' | 'player' | 'match' | 'score' | 'status' | 'admin' | 'settings';
  action: 'added' | 'updated' | 'removed' | 'status_changed';
  data: any;
  timestamp: number;
  source: string;
  affects: string[]; // What components this change affects
}

export class DynamicUpdateManager {
  private listeners: { [key: string]: () => void } = {};
  private updateCallbacks: ((update: DynamicUpdate) => void)[] = [];
  private componentStates: { [componentId: string]: any } = {};

  /**
   * 🚀 SETUP DYNAMIC UPDATES - Call this once to make everything dynamic
   */
  setupDynamicUpdates() {
    console.log('🔄 Setting up dynamic website updates...');
    
    // 1. Universities - affects teams page, league table, stats, admin dashboard
    this.setupUniversityUpdates();
    
    // 2. Players - affects admin dashboard, stats, university dashboard
    this.setupPlayerUpdates();
    
    // 3. Matches - affects live scores, league table, stats
    this.setupMatchUpdates();
    
    // 4. Scores - affects live results, league table, stats
    this.setupScoreUpdates();
    
    // 5. Admin changes - affects admin dashboard, permissions
    this.setupAdminUpdates();
    
    console.log('✅ Dynamic updates active - one change updates everywhere!');
  }

  /**
   * 🏛️ University Updates - When university data changes
   */
  private setupUniversityUpdates() {
    const universitiesRef = ref(realtimeDb, 'universities');
    
    const unsubscribe = onValue(universitiesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('🏛️ University data changed - updating everywhere...');
      
      this.notifyUpdate({
        type: 'university',
        action: 'updated',
        data: data,
        timestamp: Date.now(),
        source: 'universities',
        affects: ['teams-page', 'league-table', 'stats-cards', 'admin-dashboard', 'live-results']
      });
    });
    
    this.listeners['universities'] = unsubscribe;
  }

  /**
   * 👥 Player Updates - When player data changes
   */
  private setupPlayerUpdates() {
    const playersRef = ref(realtimeDb, 'players');
    
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      console.log('👥 Player data changed - updating everywhere...');
      
      this.notifyUpdate({
        type: 'player',
        action: 'updated',
        data: data,
        timestamp: Date.now(),
        source: 'players',
        affects: ['admin-dashboard', 'stats-cards', 'university-dashboard', 'live-results']
      });
    });
    
    this.listeners['players'] = unsubscribe;
  }

  /**
   * 🏆 Match Updates - When match data changes
   */
  private setupMatchUpdates() {
    const matchesRef = ref(realtimeDb, 'matches');
    
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      console.log('🏆 Match data changed - updating everywhere...');
      
      this.notifyUpdate({
        type: 'match',
        action: 'updated',
        data: data,
        timestamp: Date.now(),
        source: 'matches',
        affects: ['live-results', 'league-table', 'stats-cards', 'admin-dashboard']
      });
    });
    
    this.listeners['matches'] = unsubscribe;
  }

  /**
   * ⚡ Score Updates - When scores change
   */
  private setupScoreUpdates() {
    const scoresRef = ref(realtimeDb, 'scores');
    
    const unsubscribe = onValue(scoresRef, (snapshot) => {
      const data = snapshot.val();
      console.log('⚡ Score data changed - updating everywhere...');
      
      this.notifyUpdate({
        type: 'score',
        action: 'updated',
        data: data,
        timestamp: Date.now(),
        source: 'scores',
        affects: ['live-results', 'league-table', 'stats-cards', 'main-page']
      });
    });
    
    this.listeners['scores'] = unsubscribe;
  }

  /**
   * 👑 Admin Updates - When admin data changes
   */
  private setupAdminUpdates() {
    const adminsRef = ref(realtimeDb, 'admins');
    
    const unsubscribe = onValue(adminsRef, (snapshot) => {
      const data = snapshot.val();
      console.log('👑 Admin data changed - updating everywhere...');
      
      this.notifyUpdate({
        type: 'admin',
        action: 'updated',
        data: data,
        timestamp: Date.now(),
        source: 'admins',
        affects: ['admin-dashboard', 'permissions', 'access-control']
      });
    });
    
    this.listeners['admins'] = unsubscribe;
  }

  /**
   * 📢 Notify all affected components
   */
  private notifyUpdate(update: DynamicUpdate) {
    console.log('📢 Broadcasting dynamic update:', {
      type: update.type,
      action: update.action,
      affects: update.affects,
      timestamp: new Date(update.timestamp).toLocaleTimeString()
    });
    
    // Update component states
    update.affects.forEach(componentId => {
      this.componentStates[componentId] = {
        ...this.componentStates[componentId],
        lastUpdate: update.timestamp,
        data: update.data
      };
    });
    
    // Notify all callbacks
    this.updateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('❌ Error in dynamic update callback:', error);
      }
    });
  }

  /**
   * 📡 Subscribe to dynamic updates
   */
  onUpdate(callback: (update: DynamicUpdate) => void) {
    this.updateCallbacks.push(callback);
    
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 🎯 Get component state
   */
  getComponentState(componentId: string) {
    return this.componentStates[componentId] || null;
  }

  /**
   * 🔄 Force update specific component
   */
  forceUpdate(componentId: string) {
    console.log(`🔄 Forcing update for component: ${componentId}`);
    
    this.notifyUpdate({
      type: 'settings',
      action: 'updated',
      data: { forceUpdate: true },
      timestamp: Date.now(),
      source: 'system',
      affects: [componentId]
    });
  }

  /**
   * 🧹 Cleanup
   */
  cleanup() {
    console.log('🧹 Cleaning up dynamic updates...');
    
    Object.values(this.listeners).forEach(unsubscribe => {
      unsubscribe();
    });
    
    this.listeners = {};
    this.updateCallbacks = [];
    this.componentStates = {};
  }
}

// 🎯 Global instance
export const dynamicUpdates = new DynamicUpdateManager();

/**
 * 🚀 QUICK SETUP - Call this in your main layout
 */
export function setupDynamicWebsiteUpdates() {
  if (typeof window !== 'undefined') {
    dynamicUpdates.setupDynamicUpdates();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      dynamicUpdates.cleanup();
    });
  }
}

/**
 * 📱 COMPONENT HOOK - Use this in any component that needs dynamic updates
 */
export function useDynamicUpdates(componentId: string) {
  const [lastUpdate, setLastUpdate] = useState<DynamicUpdate | null>(null);
  const [componentState, setComponentState] = useState<any>(null);
  
  useEffect(() => {
    const unsubscribe = dynamicUpdates.onUpdate((update) => {
      // Check if this update affects our component
      if (update.affects.includes(componentId)) {
        setLastUpdate(update);
        setComponentState(dynamicUpdates.getComponentState(componentId));
        console.log(`📱 Component ${componentId} received dynamic update:`, update);
      }
    });
    
    return unsubscribe;
  }, [componentId]);
  
  return { lastUpdate, componentState };
}

/**
 * 🔄 FORCE UPDATE - Manually trigger updates
 */
export function forceComponentUpdate(componentId: string) {
  dynamicUpdates.forceUpdate(componentId);
}

/**
 * 📊 GET UPDATE STATUS - Check what's been updated recently
 */
export function getUpdateStatus() {
  return {
    activeListeners: Object.keys(dynamicUpdates['listeners']).length,
    componentStates: Object.keys(dynamicUpdates['componentStates']).length,
    lastUpdate: Math.max(...Object.values(dynamicUpdates['componentStates']).map((state: any) => state?.lastUpdate || 0))
  };
}
