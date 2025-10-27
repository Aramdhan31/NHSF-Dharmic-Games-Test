"use client";

import { firestoreUtils, realtimeDbUtils, nhsfUtils } from './firebase-utils';

// Leaderboard data types
export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  abbreviation: string;
  avatar?: string;
  score: number;
  wins: number;
  losses: number;
  change: 'up' | 'down' | 'same';
  changeValue?: number;
  badge?: string;
  zone: string;
  lastUpdated: any;
}

export interface Player {
  id: string;
  name: string;
  email: string;
  zone: string;
  score: number;
  wins: number;
  losses: number;
  avatar?: string;
  isActive: boolean;
  createdAt: any;
  lastUpdated: any;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  winner: string;
  status: 'pending' | 'active' | 'completed';
  gameType: string;
  createdAt: any;
  completedAt?: any;
}

// Leaderboard service
export const leaderboardService = {
  // Get current leaderboard
  getLeaderboard: async () => {
    return await nhsfUtils.getLeaderboard();
  },

  // Listen to real-time leaderboard updates
  listenToLeaderboard: (callback: (entries: LeaderboardEntry[]) => void) => {
    return nhsfUtils.listenToLeaderboard(callback);
  },

  // Update player score
  updatePlayerScore: async (playerId: string, newScore: number) => {
    return await nhsfUtils.updatePlayerScore(playerId, newScore);
  },

  // Get zone-specific leaderboard
  getZoneLeaderboard: async (zone: string) => {
    return await firestoreUtils.getDocuments('leaderboard', [
      where('zone', '==', zone),
      orderBy('score', 'desc'),
      limit(10)
    ]);
  }
};

// Player service
export const playerService = {
  // Create new player
  createPlayer: async (playerData: Omit<Player, 'id' | 'createdAt' | 'lastUpdated'>) => {
    return await firestoreUtils.createDocument('players', playerData);
  },

  // Get player by ID
  getPlayer: async (playerId: string) => {
    return await firestoreUtils.getDocument('players', playerId);
  },

  // Get all players
  getAllPlayers: async () => {
    return await firestoreUtils.getDocuments('players');
  },

  // Get players by zone
  getPlayersByZone: async (zone: string) => {
    return await firestoreUtils.getDocuments('players', [
      where('zone', '==', zone)
    ]);
  },

  // Update player
  updatePlayer: async (playerId: string, updates: Partial<Player>) => {
    return await firestoreUtils.updateDocument('players', playerId, updates);
  },

  // Delete player
  deletePlayer: async (playerId: string) => {
    return await firestoreUtils.deleteDocument('players', playerId);
  },

  // Listen to player updates
  listenToPlayer: (playerId: string, callback: (player: Player | null) => void) => {
    return firestoreUtils.listenToDocument('players', playerId, callback);
  }
};

// Match service
export const matchService = {
  // Create new match
  createMatch: async (matchData: Omit<Match, 'id' | 'createdAt'>) => {
    return await firestoreUtils.createDocument('matches', matchData);
  },

  // Get match by ID
  getMatch: async (matchId: string) => {
    return await firestoreUtils.getDocument('matches', matchId);
  },

  // Get all matches
  getAllMatches: async () => {
    return await firestoreUtils.getDocuments('matches', [
      orderBy('createdAt', 'desc')
    ]);
  },

  // Get matches by zone
  getMatchesByZone: async (zone: string) => {
    return await firestoreUtils.getDocuments('matches', [
      where('zone', '==', zone),
      orderBy('createdAt', 'desc')
    ]);
  },

  // Get active matches
  getActiveMatches: async () => {
    return await firestoreUtils.getDocuments('matches', [
      where('status', '==', 'active')
    ]);
  },

  // Update match
  updateMatch: async (matchId: string, updates: Partial<Match>) => {
    return await firestoreUtils.updateDocument('matches', matchId, updates);
  },

  // Complete match
  completeMatch: async (matchId: string, winner: string, finalScores: { player1: number; player2: number }) => {
    return await firestoreUtils.updateDocument('matches', matchId, {
      status: 'completed',
      winner,
      player1Score: finalScores.player1,
      player2Score: finalScores.player2,
      completedAt: new Date()
    });
  },

  // Listen to match updates
  listenToMatches: (callback: (matches: Match[]) => void) => {
    return firestoreUtils.listenToCollection('matches', callback, [
      orderBy('createdAt', 'desc')
    ]);
  }
};

// Zone service
export const zoneService = {
  // Get zone data
  getZoneData: async (zone: string) => {
    return await nhsfUtils.getZoneData(zone);
  },

  // Listen to zone updates
  listenToZoneUpdates: (zone: string, callback: (data: any) => void) => {
    return nhsfUtils.listenToZoneUpdates(zone, callback);
  },

  // Update zone stats
  updateZoneStats: async (zone: string, stats: any) => {
    return await realtimeDbUtils.updateData(`zones/${zone}`, stats);
  }
};

// Real-time data service
export const realtimeService = {
  // Listen to live game updates
  listenToLiveGame: (gameId: string, callback: (data: any) => void) => {
    return realtimeDbUtils.listenToData(`games/${gameId}`, callback);
  },

  // Update live game state
  updateLiveGame: async (gameId: string, gameState: any) => {
    return await realtimeDbUtils.updateData(`games/${gameId}`, gameState);
  },

  // Listen to leaderboard updates
  listenToLiveLeaderboard: (callback: (data: any) => void) => {
    return realtimeDbUtils.listenToData('leaderboard', callback);
  }
};
