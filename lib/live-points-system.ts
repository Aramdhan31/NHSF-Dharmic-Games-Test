/**
 * 🏆 LIVE POINTS SYSTEM
 * 
 * Automatically updates league table and stats when teams win/lose points
 * All data gets updated in real-time across the entire website!
 */

import { ref, onValue, update, get } from 'firebase/database';
import { realtimeDb } from './firebase';
import { useState, useEffect } from 'react';

export interface PointsUpdate {
  universityId: string;
  universityName: string;
  zone: string;
  pointsChange: number;
  winsChange: number;
  lossesChange: number;
  matchId: string;
  sport: string;
  timestamp: number;
}

export class LivePointsSystem {
  private listeners: { [key: string]: () => void } = {};
  private updateCallbacks: ((update: PointsUpdate) => void)[] = [];

  /**
   * 🚀 SETUP LIVE POINTS SYSTEM
   * Call this once to make all points updates live
   */
  setupLivePointsSystem() {
    console.log('🏆 Setting up live points system...');
    
    // Listen to matches for score changes
    this.setupMatchListeners();
    
    // Listen to universities for add/remove/update
    this.setupUniversityListeners();
    
    // Listen to players for team changes
    this.setupPlayerListeners();
    
    // Listen to admin changes
    this.setupAdminListeners();
    
    console.log('✅ Live points system active - all changes update everywhere!');
  }

  /**
   * 🏆 Listen to match score changes
   */
  private setupMatchListeners() {
    const matchesRef = ref(realtimeDb, 'matches');
    
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const matches = snapshot.val();
        console.log('🏆 Match data changed - checking for points updates...');
        
        // Process each match for points calculation
        Object.entries(matches).forEach(([matchId, match]: [string, any]) => {
          this.processMatchForPoints(matchId, match);
        });
      }
    });
    
    this.listeners['matches'] = unsubscribe;
  }

  /**
   * 🏛️ Listen to university data changes (add/remove/update)
   */
  private setupUniversityListeners() {
    const universitiesRef = ref(realtimeDb, 'universities');
    
    const unsubscribe = onValue(universitiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const universities = snapshot.val();
        console.log('🏛️ University data changed - updating league table and stats...');
        
        // Check for added universities
        Object.entries(universities).forEach(([universityId, university]: [string, any]) => {
          if (university.lastUpdated && Date.now() - university.lastUpdated < 5000) {
            console.log('🆕 New university added:', university.name);
            this.notifyPointsUpdate({
              universityId,
              universityName: university.name,
              zone: university.zone || 'Unknown',
              pointsChange: 0,
              winsChange: 0,
              lossesChange: 0,
              matchId: 'university-added',
              sport: 'all',
              timestamp: Date.now()
            });
          }
        });
        
        // Notify general update
        this.notifyPointsUpdate({
          universityId: 'system',
          universityName: 'All Universities',
          zone: 'all',
          pointsChange: 0,
          winsChange: 0,
          lossesChange: 0,
          matchId: 'system',
          sport: 'all',
          timestamp: Date.now()
        });
      } else {
        console.log('🏛️ All universities removed - updating league table and stats...');
        this.notifyPointsUpdate({
          universityId: 'system',
          universityName: 'All Universities Removed',
          zone: 'all',
          pointsChange: 0,
          winsChange: 0,
          lossesChange: 0,
          matchId: 'all-removed',
          sport: 'all',
          timestamp: Date.now()
        });
      }
    });
    
    this.listeners['universities'] = unsubscribe;
  }

  /**
   * 🎯 Process match for points calculation
   * Handles both formats: teamA/teamB/scoreA/scoreB and team1/team2/team1Score/team2Score
   */
  private async processMatchForPoints(matchId: string, match: any) {
    // Handle both match formats
    const team1 = match.teamA || match.team1 || match.university1;
    const team2 = match.teamB || match.team2 || match.university2;
    const score1 = match.scoreA || match.team1Score || match.university1Score || 0;
    const score2 = match.scoreB || match.team2Score || match.university2Score || 0;
    
    if (!team1 || !team2) {
      console.log('⚠️ Match missing team names:', matchId, match);
      return;
    }
    
    if (match.status !== 'completed') return;
    
    console.log('🎯 Processing match for points:', {
      matchId,
      team1,
      team2,
      score1,
      score2,
      status: match.status,
      sport: match.sport
    });
    
    try {
      // Calculate points based on sport
      const pointsAwarded = this.getPointsForSport(match.sport || 'Football');
      
      // Determine winner and loser
      const team1Won = score1 > score2;
      const team2Won = score2 > score1;
      const isDraw = score1 === score2;
      
      // Update teams
      if (team1Won) {
        await this.updateUniversityPoints(team1, match.zone, pointsAwarded, true, matchId, match.sport);
        await this.updateUniversityPoints(team2, match.zone, 0, false, matchId, match.sport);
      } else if (team2Won) {
        await this.updateUniversityPoints(team2, match.zone, pointsAwarded, true, matchId, match.sport);
        await this.updateUniversityPoints(team1, match.zone, 0, false, matchId, match.sport);
      } else if (isDraw) {
        // Draw - both teams get 1 point
        await this.updateUniversityPoints(team1, match.zone, 1, false, matchId, match.sport);
        await this.updateUniversityPoints(team2, match.zone, 1, false, matchId, match.sport);
      }
      
    } catch (error) {
      console.error('❌ Error processing match for points:', error);
    }
  }

  /**
   * 🏛️ Update university points
   */
  private async updateUniversityPoints(
    universityName: string, 
    zone: string, 
    pointsChange: number, 
    isWin: boolean, 
    matchId: string, 
    sport: string
  ) {
    try {
      console.log('🏛️ Updating university points:', {
        universityName,
        zone,
        pointsChange,
        isWin,
        matchId,
        sport
      });
      
      // Find university by name
      const universitiesRef = ref(realtimeDb, 'universities');
      const snapshot = await get(universitiesRef);
      
      if (snapshot.exists()) {
        const universities = snapshot.val();
        const universityEntry = Object.entries(universities).find(([id, uni]: [string, any]) => 
          uni.name === universityName
        );
        
        if (universityEntry) {
          const [universityId, universityData] = universityEntry;
          
          // Calculate new stats
          const currentPoints = universityData.points || 0;
          const currentWins = universityData.wins || 0;
          const currentLosses = universityData.losses || 0;
          
          const newPoints = currentPoints + pointsChange;
          const newWins = isWin ? currentWins + 1 : currentWins;
          const newLosses = !isWin ? currentLosses + 1 : currentLosses;
          
          // Update university data
          const universityRef = ref(realtimeDb, `universities/${universityId}`);
          await update(universityRef, {
            points: newPoints,
            wins: newWins,
            losses: newLosses,
            lastUpdated: Date.now(),
            lastMatchId: matchId,
            lastSport: sport
          });
          
          // Notify all components of the points update
          this.notifyPointsUpdate({
            universityId,
            universityName,
            zone: universityData.zone || zone,
            pointsChange,
            winsChange: isWin ? 1 : 0,
            lossesChange: !isWin ? 1 : 0,
            matchId,
            sport,
            timestamp: Date.now()
          });
          
          console.log('✅ University points updated:', {
            universityName,
            oldPoints: currentPoints,
            newPoints,
            pointsChange,
            isWin
          });
        }
      }
    } catch (error) {
      console.error('❌ Error updating university points:', error);
    }
  }

  /**
   * 👥 Listen to player data changes (add/remove/update)
   */
  private setupPlayerListeners() {
    const playersRef = ref(realtimeDb, 'players');
    
    const unsubscribe = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const players = snapshot.val();
        console.log('👥 Player data changed - updating team stats...');
        
        // Check for new players
        Object.entries(players).forEach(([playerId, player]: [string, any]) => {
          if (player.lastUpdated && Date.now() - player.lastUpdated < 5000) {
            console.log('🆕 New player added:', player.firstName, player.lastName);
            this.notifyPointsUpdate({
              universityId: player.universityId || 'unknown',
              universityName: player.universityName || 'Unknown University',
              zone: 'all',
              pointsChange: 0,
              winsChange: 0,
              lossesChange: 0,
              matchId: 'player-added',
              sport: player.sport || 'all',
              timestamp: Date.now()
            });
          }
        });
      } else {
        console.log('👥 All players removed - updating team stats...');
        this.notifyPointsUpdate({
          universityId: 'system',
          universityName: 'All Players Removed',
          zone: 'all',
          pointsChange: 0,
          winsChange: 0,
          lossesChange: 0,
          matchId: 'all-players-removed',
          sport: 'all',
          timestamp: Date.now()
        });
      }
    });
    
    this.listeners['players'] = unsubscribe;
  }

  /**
   * 👨‍💼 Listen to admin changes
   */
  private setupAdminListeners() {
    const adminsRef = ref(realtimeDb, 'admins');
    
    const unsubscribe = onValue(adminsRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log('👨‍💼 Admin data changed - updating permissions...');
        this.notifyPointsUpdate({
          universityId: 'system',
          universityName: 'Admin Changes',
          zone: 'all',
          pointsChange: 0,
          winsChange: 0,
          lossesChange: 0,
          matchId: 'admin-changed',
          sport: 'all',
          timestamp: Date.now()
        });
      }
    });
    
    this.listeners['admins'] = unsubscribe;
  }

  /**
   * 🎯 Get points for sport
   */
  private getPointsForSport(sport: string): number {
    const sportPoints: { [key: string]: number } = {
      'Football': 3,
      'Basketball': 3,
      'Cricket': 3,
      'Kho Kho': 3,
      'Badminton': 3,
      'Netball': 3,
      'Kabaddi': 3,
      'Volleyball': 3,
      'Tennis': 3,
      'Table Tennis': 3
    };
    
    return sportPoints[sport] || 3; // Default 3 points
  }

  /**
   * 📢 Notify all components of points updates
   */
  private notifyPointsUpdate(update: PointsUpdate) {
    console.log('📢 Broadcasting points update:', update);
    
    this.updateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('❌ Error in points update callback:', error);
      }
    });
  }

  /**
   * 📡 Subscribe to points updates
   */
  onPointsUpdate(callback: (update: PointsUpdate) => void) {
    this.updateCallbacks.push(callback);
    
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 🧹 Cleanup
   */
  cleanup() {
    console.log('🧹 Cleaning up live points system...');
    
    Object.values(this.listeners).forEach(unsubscribe => {
      unsubscribe();
    });
    
    this.listeners = {};
    this.updateCallbacks = [];
  }
}

// 🎯 Global instance
export const livePointsSystem = new LivePointsSystem();

/**
 * 🚀 QUICK SETUP - Call this in your main layout
 */
export function setupLivePointsSystem() {
  if (typeof window !== 'undefined') {
    livePointsSystem.setupLivePointsSystem();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      livePointsSystem.cleanup();
    });
  }
}

/**
 * 📱 COMPONENT HOOK - Use this in league table and stats components
 */
export function useLivePoints() {
  const [lastPointsUpdate, setLastPointsUpdate] = useState<PointsUpdate | null>(null);
  
  useEffect(() => {
    const unsubscribe = livePointsSystem.onPointsUpdate((update) => {
      setLastPointsUpdate(update);
      console.log('📱 Component received points update:', update);
    });
    
    return unsubscribe;
  }, []);
  
  return lastPointsUpdate;
}
