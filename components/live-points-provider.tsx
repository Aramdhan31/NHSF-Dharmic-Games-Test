"use client";

import React, { useEffect, useState } from 'react';
import { ref, onValue, set, update, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { setupLivePointsSystem } from '@/lib/live-points-system';

interface LivePointsProviderProps {
  children: React.ReactNode;
}

export function LivePointsProvider({ children }: LivePointsProviderProps) {
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    console.log('🏆 Initializing NHSF Live Points System...');
    // Setup the main live points system that updates university stats from matches
    setupLivePointsSystem();
    // Setup additional NHSF-specific listeners
    setupNHSFLiveSystem();
    
    return () => {
      console.log('🧹 Cleaning up NHSF Live Points System...');
    };
  }, []);

  const setupNHSFLiveSystem = () => {
    console.log('🔥 Setting up NHSF-specific live listeners...');
    
    // 🏫 Listen to universities changes (add/remove/competing status)
    const universitiesRef = ref(realtimeDb, 'universities');
    const unsubscribeUniversities = onValue(universitiesRef, (snapshot) => {
      console.log('🏫 Universities data changed - recalculating stats...');
      if (snapshot.exists()) {
        const universities = snapshot.val();
        recalculateStats(universities, null, null);
      } else {
        recalculateStats({}, null, null);
      }
    });

    // 🏆 Listen to matches changes (scores, results, new matches)
    const matchesRef = ref(realtimeDb, 'matches');
    const unsubscribeMatches = onValue(matchesRef, (snapshot) => {
      console.log('🏆 Matches data changed - recalculating leaderboard...');
      if (snapshot.exists()) {
        const matches = snapshot.val();
        recalculateLeaderboard(null, matches, null);
      } else {
        recalculateLeaderboard(null, {}, null);
      }
    });

    // 👥 Listen to players changes (add/remove players)
    const playersRef = ref(realtimeDb, 'players');
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      console.log('👥 Players data changed - recalculating stats...');
      if (snapshot.exists()) {
        const players = snapshot.val();
        recalculateStats(null, null, players);
      } else {
        recalculateStats(null, null, {});
      }
    }, (error) => {
      console.error('❌ Error in players listener:', error);
      // Continue with empty players data if there's an error
      recalculateStats(null, null, {});
    });

    // 🎯 Listen to admin changes
    const adminsRef = ref(realtimeDb, 'admins');
    const unsubscribeAdmins = onValue(adminsRef, (snapshot) => {
      console.log('👨‍💼 Admin data changed - updating permissions...');
      // Trigger a general stats update when admin permissions change
      recalculateStats(null, null, null);
    });

    setIsLive(true);
    setLastUpdate(new Date());

    // Cleanup function
    return () => {
      unsubscribeUniversities();
      unsubscribeMatches();
      unsubscribePlayers();
      unsubscribeAdmins();
    };
  };

  const recalculateStats = async (universities: any, matches: any, players: any) => {
    try {
      console.log('🔄 NHSF data changed - Cloud Function will recalculate stats...');
      
      // The Cloud Function will handle the actual calculation and Firebase writes
      // We just need to trigger it by making a small change to a trigger path
      // Note: This requires admin permissions, so we catch errors gracefully
      try {
        const triggerRef = ref(realtimeDb, 'system/trigger');
        await set(triggerRef, {
          timestamp: Date.now(),
          reason: 'data-change'
        });
        console.log('✅ Triggered Cloud Function for stats recalculation');
      } catch (triggerError: any) {
        // Permission denied is expected for non-admin users
        if (triggerError?.code === 'PERMISSION_DENIED' || triggerError?.message?.includes('permission')) {
          console.log('⚠️ Cloud Function trigger requires admin permissions (this is normal for non-admin users)');
        } else {
          console.error('❌ Error triggering stats recalculation:', triggerError);
        }
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Error triggering stats recalculation:', error);
    }
  };

  const recalculateLeaderboard = async (universities: any, matches: any, players: any) => {
    try {
      console.log('🏆 NHSF data changed - Cloud Function will recalculate leaderboard...');
      
      // The Cloud Function will handle the actual calculation and Firebase writes
      // We just need to trigger it by making a small change to a trigger path
      // Note: This requires admin permissions, so we catch errors gracefully
      try {
        const triggerRef = ref(realtimeDb, 'system/trigger');
        await set(triggerRef, {
          timestamp: Date.now(),
          reason: 'data-change'
        });
        console.log('✅ Triggered Cloud Function for leaderboard recalculation');
      } catch (triggerError: any) {
        // Permission denied is expected for non-admin users
        if (triggerError?.code === 'PERMISSION_DENIED' || triggerError?.message?.includes('permission')) {
          console.log('⚠️ Cloud Function trigger requires admin permissions (this is normal for non-admin users)');
        } else {
          console.error('❌ Error triggering leaderboard recalculation:', triggerError);
        }
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Error triggering leaderboard recalculation:', error);
    }
  };

  const calculateNHSFStats = (universities: any, matches: any, players: any) => {
    const uniList = Object.values(universities);
    const matchList = Object.values(matches);
    const playerList = Object.values(players);

    // Count competing universities
    const competingUniversities = uniList.filter((uni: any) => 
      uni.isCompeting === true || uni.status === 'competing'
    ).length;

    // Count total sports teams (from university sports)
    let totalSportsTeams = 0;
    uniList.forEach((uni: any) => {
      if (uni.sports && Array.isArray(uni.sports)) {
        totalSportsTeams += uni.sports.length;
      }
    });

    // Count active players
    const activePlayers = playerList.length;

    // Count matches by status
    const completedMatches = matchList.filter((match: any) => match.status === 'completed').length;
    const liveMatches = matchList.filter((match: any) => match.status === 'live').length;
    const upcomingMatches = matchList.filter((match: any) => match.status === 'scheduled').length;

    // Calculate total points across all universities
    const totalPoints = uniList.reduce((sum: number, uni: any) => sum + (uni.points || 0), 0);

    return {
      totalUniversities: uniList.length,
      competingUniversities,
      totalSportsTeams,
      activePlayers,
      totalMatches: matchList.length,
      completedMatches,
      liveMatches,
      upcomingMatches,
      totalPoints,
      zones: 4, // Fixed: NZ, CZ, LZ, SZ
      lastCalculated: Date.now()
    };
  };

  const calculateNHSFLeaderboard = (universities: any, matches: any) => {
    const uniList = Object.values(universities);
    
    // Calculate points for each university
    const leaderboard = uniList.map((uni: any) => {
      const wins = uni.wins || 0;
      const losses = uni.losses || 0;
      const draws = uni.draws || 0;
      const points = uni.points || 0;
      const totalMatches = wins + losses + draws;

      return {
        id: uni.id,
        name: uni.name || uni.universityName,
        zone: uni.zone || uni.region,
        sports: uni.sports || [],
        wins,
        losses,
        draws,
        points,
        totalMatches,
        isCompeting: uni.isCompeting || uni.status === 'competing',
        lastUpdated: uni.lastUpdated || Date.now()
      };
    });

    // Sort by points (descending), then alphabetically
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return a.name.localeCompare(b.name);
    });

    // Add positions
    leaderboard.forEach((entry, index) => {
      entry.position = index + 1;
    });

    return {
      entries: leaderboard,
      lastUpdated: Date.now(),
      isLive: true
    };
  };

  return (
    <>
      {children}
      {/* Live indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs z-50">
          {isLive ? '🟢 NHSF Live' : '🔴 Offline'} 
          {lastUpdate && ` - ${lastUpdate.toLocaleTimeString()}`}
        </div>
      )}
    </>
  );
}
