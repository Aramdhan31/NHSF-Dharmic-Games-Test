"use client";

import { realtimeDbUtils } from './firebase-utils';

// Real-time results data types
export interface LiveMatch {
  id: string;
  university1: {
    id: string;
    university: string;
    zone: string;
    score: number;
  };
  university2: {
    id: string;
    university: string;
    zone: string;
    score: number;
  };
  status: 'waiting' | 'active' | 'completed' | 'live';
  sport: string;
  startTime: number;
  endTime?: number;
  winner?: string;
  currentScore?: string;
  timeRemaining?: string;
  period?: string;
  venue?: string;
  round?: number;
  totalRounds?: number;
}

export interface LiveLeaderboard {
  [zone: string]: {
    totalScore: number;
    totalWins: number;
    totalLosses: number;
    universities: {
      [universityId: string]: {
        university: string;
        score: number;
        wins: number;
        losses: number;
        rank: number;
        change: 'up' | 'down' | 'same';
        changeValue: number;
      };
    };
  };
}

export interface LiveGameState {
  gameId: string;
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: number;
  players: {
    [playerId: string]: {
      name: string;
      score: number;
      isActive: boolean;
      lastAnswer?: {
        questionId: string;
        answer: string;
        isCorrect: boolean;
        timestamp: number;
      };
    };
  };
  status: 'waiting' | 'active' | 'paused' | 'completed';
  gameType: string;
  startTime: number;
}

// Real-time results service
export const realtimeResultsService = {
  // Update live match results
  updateMatchResult: async (matchId: string, player1Score: number, player2Score: number, winner: string) => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not available on server side' };
    }
    
    const matchData = {
      player1Score,
      player2Score,
      winner,
      status: 'completed',
      endTime: Date.now()
    };
    
    return await realtimeDbUtils.updateData(`matches/${matchId}`, matchData);
  },

  // Update university score in real-time
  updateUniversityScore: async (universityId: string, zone: string, newScore: number, isWin: boolean) => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not available on server side' };
    }
    
    const updates: any = {};
    
    // Update university's score
    updates[`zones/${zone}/universities/${universityId}/score`] = newScore;
    updates[`zones/${zone}/universities/${universityId}/lastUpdated`] = Date.now();
    
    if (isWin) {
      updates[`zones/${zone}/universities/${universityId}/wins`] = (await realtimeDbUtils.getData(`zones/${zone}/universities/${universityId}/wins`)).data + 1 || 1;
    } else {
      updates[`zones/${zone}/universities/${universityId}/losses`] = (await realtimeDbUtils.getData(`zones/${zone}/universities/${universityId}/losses`)).data + 1 || 1;
    }
    
    // Update zone totals
    const zoneData = await realtimeDbUtils.getData(`zones/${zone}/stats`);
    if (zoneData.success) {
      const currentZoneData = zoneData.data || { totalScore: 0, totalWins: 0, totalLosses: 0 };
      updates[`zones/${zone}/stats/totalScore`] = currentZoneData.totalScore + newScore;
      
      if (isWin) {
        updates[`zones/${zone}/stats/totalWins`] = (currentZoneData.totalWins || 0) + 1;
      } else {
        updates[`zones/${zone}/stats/totalLosses`] = (currentZoneData.totalLosses || 0) + 1;
      }
    }
    
    return await realtimeDbUtils.updateData('', updates);
  },

  // Update live match score in real-time
  updateLiveMatchScore: async (matchId: string, university1Score: number, university2Score: number, sport: string, zone: string) => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not available on server side' };
    }
    
    const updates: any = {
      [`zones/${zone}/matches/${matchId}/university1Score`]: university1Score,
      [`zones/${zone}/matches/${matchId}/university2Score`]: university2Score,
      [`zones/${zone}/matches/${matchId}/currentScore`]: `${university1Score}-${university2Score}`,
      [`zones/${zone}/matches/${matchId}/lastUpdated`]: Date.now()
    };
    
    return await realtimeDbUtils.updateData('', updates);
  },

  // Complete a live match
  completeLiveMatch: async (matchId: string, zone: string, winnerUniversityId: string, finalScore: string) => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not available on server side' };
    }
    
    const updates: any = {
      [`zones/${zone}/matches/${matchId}/status`]: 'completed',
      [`zones/${zone}/matches/${matchId}/winner`]: winnerUniversityId,
      [`zones/${zone}/matches/${matchId}/finalScore`]: finalScore,
      [`zones/${zone}/matches/${matchId}/endTime`]: Date.now()
    };
    
    return await realtimeDbUtils.updateData('', updates);
  },

  // Update live leaderboard
  updateLeaderboard: async (zone: string, universityId: string, universityData: any) => {
    const leaderboardPath = `leaderboard/${zone}/${universityId}`;
    return await realtimeDbUtils.setData(leaderboardPath, {
      ...universityData,
      lastUpdated: Date.now()
    });
  },

  // Start a live match
  startLiveMatch: async (matchData: LiveMatch) => {
    const matchPath = `liveMatches/${matchData.id}`;
    return await realtimeDbUtils.setData(matchPath, {
      ...matchData,
      startTime: Date.now(),
      status: 'active'
    });
  },

  // Update live game state
  updateGameState: async (gameId: string, gameState: Partial<LiveGameState>) => {
    const gamePath = `liveGames/${gameId}`;
    return await realtimeDbUtils.updateData(gamePath, {
      ...gameState,
      lastUpdated: Date.now()
    });
  },

  // Listen to live matches
  listenToLiveMatches: (callback: (matches: { [matchId: string]: LiveMatch }) => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    return realtimeDbUtils.listenToData('liveMatches', callback);
  },

  // Listen to live leaderboard
  listenToLiveLeaderboard: (callback: (leaderboard: LiveLeaderboard) => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    return realtimeDbUtils.listenToData('leaderboard', callback);
  },

  // Listen to zone updates
  listenToZoneUpdates: (zone: string, callback: (zoneData: any) => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    return realtimeDbUtils.listenToData(`zones/${zone}`, callback);
  },

  // Listen to live game state
  listenToGameState: (gameId: string, callback: (gameState: LiveGameState | null) => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    return realtimeDbUtils.listenToData(`liveGames/${gameId}`, callback);
  },

  // Get current leaderboard
  getCurrentLeaderboard: async () => {
    return await realtimeDbUtils.getData('leaderboard');
  },

  // Get zone data
  getZoneData: async (zone: string) => {
    return await realtimeDbUtils.getData(`zones/${zone}`);
  },

  // Get live matches
  getLiveMatches: async () => {
    return await realtimeDbUtils.getData('liveMatches');
  },

  // End a live match
  endLiveMatch: async (matchId: string, finalResults: any) => {
    const matchPath = `liveMatches/${matchId}`;
    return await realtimeDbUtils.updateData(matchPath, {
      ...finalResults,
      status: 'completed',
      endTime: Date.now()
    });
  },

  // Update player rank
  updatePlayerRank: async (playerId: string, zone: string, newRank: number) => {
    const playerPath = `leaderboard/${zone}/${playerId}`;
    return await realtimeDbUtils.updateData(playerPath, {
      rank: newRank,
      lastUpdated: Date.now()
    });
  },

  // Bulk update leaderboard
  updateBulkLeaderboard: async (leaderboardData: LiveLeaderboard) => {
    return await realtimeDbUtils.setData('leaderboard', leaderboardData);
  },

  // Reset zone data
  resetZoneData: async (zone: string) => {
    return await realtimeDbUtils.setData(`zones/${zone}`, {
      totalScore: 0,
      totalWins: 0,
      totalLosses: 0,
      lastReset: Date.now()
    });
  },

  // Get live game analytics
  getLiveAnalytics: async () => {
    const [leaderboard, matches, zones] = await Promise.all([
      realtimeDbUtils.getData('leaderboard'),
      realtimeDbUtils.getData('liveMatches'),
      realtimeDbUtils.getData('zones')
    ]);

    return {
      leaderboard: leaderboard.data,
      matches: matches.data,
      zones: zones.data
    };
  },

  // Sync live matches from zones to global liveMatches collection
  syncLiveMatchesFromZones: async () => {
    try {
      // Get all zones
      const zonesResult = await realtimeDbUtils.getData('zones');
      if (!zonesResult.success || !zonesResult.data) {
        return { success: false, error: 'No zones found' };
      }

      const zones = Object.keys(zonesResult.data);
      const allLiveMatches: { [matchId: string]: any } = {};

      // Get live matches from each zone
      for (const zone of zones) {
        const zoneMatchesResult = await realtimeDbUtils.getData(`zones/${zone}/matches`);
        if (zoneMatchesResult.success && zoneMatchesResult.data) {
          const matches = Array.isArray(zoneMatchesResult.data) 
            ? zoneMatchesResult.data 
            : Object.values(zoneMatchesResult.data);
          
          // Filter ONLY live matches (exclude completed, cancelled, scheduled)
          const liveMatches = matches.filter(match => match.status === 'live');
          
          for (const match of liveMatches) {
            const liveMatchData = {
              id: match.id,
              player1: {
                id: `${zone}_${match.team1}`,
                name: match.team1,
                zone: zone,
                score: 0
              },
              player2: {
                id: `${zone}_${match.team2}`,
                name: match.team2,
                zone: zone,
                score: 0
              },
              status: 'active' as const,
              gameType: match.sport,
              startTime: match.startedAt ? new Date(match.startedAt).getTime() : Date.now(),
              round: 1,
              totalRounds: 1
            };
            
            allLiveMatches[match.id] = liveMatchData;
          }
        }
      }

      // Always update global liveMatches collection (even if empty)
      await realtimeDbUtils.setData('liveMatches', allLiveMatches);

      return { success: true, data: allLiveMatches };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Listen to zone matches and sync to liveMatches
  listenToZoneMatches: (zone: string, callback: (matches: any) => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    return realtimeDbUtils.listenToData(`zones/${zone}/matches`, callback);
  }
};
