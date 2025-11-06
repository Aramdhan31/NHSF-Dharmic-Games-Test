"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Users, Target, Filter, ChevronDown } from 'lucide-react';
import { ref, get, onValue } from 'firebase/database';
import { collection, getDocs } from 'firebase/firestore';
import { realtimeDb, db } from '@/lib/firebase';
import { useLivePoints } from '@/lib/live-points-system';
import { universities as staticUniversities } from '@/app/teams/page';

interface LeagueEntry {
  id: string;
  position: number;
  university: string;
  zone: string;
  sports: string[]; // Sports the university is registered for
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalPoints: number;
  sportsBreakdown: {
    [sport: string]: {
      matches: number;
      wins: number;
      losses: number;
      draws: number;
      points: number;
    };
  };
  form: string; // Last 5 matches: W, D, L, etc.
  change: 'up' | 'down' | 'same';
  changeValue?: number;
  isMultiZone?: boolean; // Flag to show both zone colors
  zones?: string[]; // Array of zones for multi-zone universities
}

interface UnifiedLeagueTableProps {
  showFilters?: boolean;
}

export function UnifiedLeagueTable({ showFilters = true }: UnifiedLeagueTableProps) {
  const [entries, setEntries] = useState<LeagueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'position' | 'points' | 'university'>('points');
  const [isUsingLiveData, setIsUsingLiveData] = useState(false);
  
  // 🏆 Live points system integration
  const lastPointsUpdate = useLivePoints();

  // 🏆 React to live points updates
  useEffect(() => {
    if (lastPointsUpdate) {
      console.log('🏆 Live points update received in league table:', lastPointsUpdate);
      // Reload universities when points change
      loadUniversities();
    }
  }, [lastPointsUpdate]);

  // 🏆 Listen to live leaderboard from Firebase
  useEffect(() => {
    const leaderboardRef = ref(realtimeDb, 'stats/leaderboard');
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const leaderboardData = snapshot.val();
        console.log('🏆 NHSF Live leaderboard received:', leaderboardData);
        
        // Safe check for entries array
        if (Array.isArray(leaderboardData?.entries) && leaderboardData.entries.length > 0) {
          console.log('✅ Using live leaderboard data:', leaderboardData.entries.length, 'entries');
          
          // Filter out non-competing universities
          let competingEntries = leaderboardData.entries.filter(entry => 
            entry.isCompeting === true || 
            entry.status === 'competing' ||
            (entry.status !== 'not-competing' && entry.status !== 'affiliated')
          );
          
          // Merge KCL entries from both zones (always merge KCL in league table)
          const kclEntries = competingEntries.filter(entry => entry.university.toLowerCase() === 'kcl');
          const otherEntries = competingEntries.filter(entry => entry.university.toLowerCase() !== 'kcl');
          
          if (kclEntries.length > 0) {
            const kclLZ = kclEntries.find(entry => entry.zone === 'LZ+SZ' || entry.zone?.includes('LZ') || entry.zone?.includes('SZ'));
            const kclNZ = kclEntries.find(entry => entry.zone === 'NZ+CZ' || entry.zone?.includes('NZ') || entry.zone?.includes('CZ'));
            
            if (kclLZ && kclNZ) {
              // Merge KCL entries from both zones
              const combinedPoints = (kclLZ.totalPoints || 0) + (kclNZ.totalPoints || 0);
              const combinedWins = (kclLZ.totalWins || 0) + (kclNZ.totalWins || 0);
              const combinedLosses = (kclLZ.totalLosses || 0) + (kclNZ.totalLosses || 0);
              const combinedDraws = (kclLZ.totalDraws || 0) + (kclNZ.totalDraws || 0);
              const combinedMatches = (kclLZ.totalMatches || 0) + (kclNZ.totalMatches || 0);
              
              const allSports = new Set([
                ...(kclLZ.sports || []),
                ...(kclNZ.sports || [])
              ]);
              
              const mergedKCL: LeagueEntry = {
                id: kclLZ.id || 'kcl-combined',
                university: 'KCL',
                zone: 'LZ+SZ & NZ+CZ',
                sports: Array.from(allSports),
                totalMatches: combinedMatches,
                totalWins: combinedWins,
                totalLosses: combinedLosses,
                totalDraws: combinedDraws,
                totalPoints: combinedPoints,
                sportsBreakdown: { ...(kclLZ.sportsBreakdown || {}), ...(kclNZ.sportsBreakdown || {}) },
                form: kclLZ.form || '-----',
                change: 'same' as const,
                changeValue: 0,
                position: 0,
                isMultiZone: true,
                zones: ['LZ+SZ', 'NZ+CZ']
              };
              
              competingEntries = [...otherEntries, mergedKCL];
            } else if (kclLZ || kclNZ) {
              // Single KCL entry, still show both zone colors
              const kclEntry = kclLZ || kclNZ;
              const mergedKCL: LeagueEntry = {
                ...kclEntry,
                zone: 'LZ+SZ & NZ+CZ',
                isMultiZone: true,
                zones: ['LZ+SZ', 'NZ+CZ']
              };
              competingEntries = [...otherEntries, mergedKCL];
            }
          }
          
          // Sort Olympics-style: by total points (primary), then wins (secondary), then alphabetically (tertiary)
          competingEntries.sort((a, b) => {
            // Primary: Total points (descending) - like Olympic medal count
            if (b.totalPoints !== a.totalPoints) {
              return b.totalPoints - a.totalPoints;
            }
            // Secondary: Total wins (descending) - tiebreaker
            if (b.totalWins !== a.totalWins) {
              return b.totalWins - a.totalWins;
            }
            // Tertiary: Alphabetical order - final tiebreaker
            return a.university.localeCompare(b.university);
          });
          
          // Assign positions based on points ranking (Olympics-style)
          competingEntries.forEach((entry, index) => {
            entry.position = index + 1;
          });
          
          console.log('✅ Filtered to competing universities:', competingEntries.length, 'entries');
          setEntries(competingEntries);
          setLastUpdated(new Date(leaderboardData.lastUpdated || Date.now()));
          setIsUsingLiveData(true);
        } else {
          console.log('⚠️ Live leaderboard exists but no entries, using fallback...');
          setIsUsingLiveData(false);
          loadUniversities();
        }
      } else {
        console.log('📊 No live leaderboard available, using fallback...');
        setIsUsingLiveData(false);
        loadUniversities();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const setupRealtimeListeners = async () => {
      try {
        setLoading(true);
        setError(null);

        // Listen to universities changes for real-time updates
        const universitiesRef = ref(realtimeDb, 'universities');
        const unsubscribeUniversities = onValue(universitiesRef, (snapshot) => {
          console.log('🔄 Universities listener triggered, snapshot exists:', snapshot.exists());
          if (snapshot.exists()) {
            console.log('🔄 Universities data changed, updating league table...');
            loadUniversities();
          } else {
            console.log('📊 No universities data found in Realtime Database listener');
            // Try to load from Firestore as fallback
            loadUniversities();
          }
        });

        // Listen to matches changes to recalculate stats when matches complete
        const matchesRef = ref(realtimeDb, 'matches');
        const unsubscribeMatches = onValue(matchesRef, (snapshot) => {
          console.log('🏆 Matches listener triggered, snapshot exists:', snapshot.exists());
          if (snapshot.exists()) {
            console.log('🏆 Matches data changed, updating league table...');
            // Reload universities to get updated stats from live points system
            loadUniversities();
          }
        });

        setLoading(false);
        
        // Also try to load universities immediately
        console.log('🔄 Loading universities immediately on mount...');
        loadUniversities();
        
        // Force load after a short delay to ensure Firebase is ready
        setTimeout(() => {
          console.log('🔄 Force loading universities after delay...');
          loadUniversities();
        }, 1000);

        return () => {
          unsubscribeUniversities();
          unsubscribeMatches();
        };
      } catch (err) {
        setError('Failed to connect to real-time database');
        setLoading(false);
      }
    };

    setupRealtimeListeners();
  }, []);

  const loadUniversities = async () => {
    try {
      console.log('🔄 Loading real data from universities...');
      
      let universitiesList: any[] = [];
      
      // First, try Realtime Database
      const universitiesRef = ref(realtimeDb, 'universities');
      const universitiesSnapshot = await get(universitiesRef);
      
      if (universitiesSnapshot.exists()) {
        const universitiesData = universitiesSnapshot.val();
        universitiesList = Object.values(universitiesData || {}) as any[];
        console.log('📊 Found universities in Realtime Database:', universitiesList.length);
      } else {
        console.log('📊 No universities in Realtime Database, checking Firestore...');
        
        // Try Firestore as fallback
        try {
          const firestoreSnapshot = await getDocs(collection(db, 'universities'));
          if (!firestoreSnapshot.empty) {
            universitiesList = firestoreSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('📊 Found universities in Firestore:', universitiesList.length);
          }
        } catch (firestoreError) {
          console.log('📊 No universities in Firestore either');
        }
      }
      
      // Add competing universities from static code (teams page) that might not be in Firebase yet
      const staticCompetingUnis = staticUniversities.filter(uni => uni.isCompeting === true);
      console.log('📊 Found competing universities in static code:', staticCompetingUnis.length);
      
      // Merge static universities with Firebase data
      // For KCL, allow multiple entries (one per zone) - they'll be merged later in the display logic
      // For other universities, avoid duplicates by name+zone
      const existingKeys = new Set(universitiesList.map(uni => {
        const name = (uni.name || uni.universityName || '').toLowerCase();
        const zone = uni.zone || '';
        return `${name}::${zone}`;
      }));
      
      staticCompetingUnis.forEach(staticUni => {
        const nameLower = staticUni.name.toLowerCase();
        const zone = staticUni.zone || '';
        const key = `${nameLower}::${zone}`;
        
        // Special handling for KCL: allow multiple entries (one per zone)
        const isKCL = nameLower === 'kcl';
        
        // For KCL, always check if entry exists for this zone
        if (isKCL) {
          const existingKCL = universitiesList.find(uni => {
            const uniName = (uni.name || uni.universityName || '').toLowerCase();
            const uniZone = uni.zone || '';
            return uniName === 'kcl' && uniZone === zone;
          });
          
          if (existingKCL) {
            // Update existing KCL entry for this zone
            const existingIndex = universitiesList.findIndex(uni => uni === existingKCL);
            universitiesList[existingIndex] = {
              ...existingKCL,
              id: staticUni.id || existingKCL.id,
              sports: staticUni.sports || existingKCL.sports || [],
              teamInfo: staticUni.teamInfo || existingKCL.teamInfo || {},
              isCompeting: true,
              status: 'competing'
            };
            return;
          } else {
            // Add new KCL entry for this zone
            universitiesList.push({
              id: staticUni.id || `static-${staticUni.name.toLowerCase().replace(/\s+/g, '-')}-${zone}`,
              name: staticUni.name,
              zone: staticUni.zone,
              sports: staticUni.sports || [],
              teamInfo: staticUni.teamInfo || {},
              members: staticUni.members || 0,
              wins: staticUni.wins || 0,
              losses: staticUni.losses || 0,
              points: staticUni.points || 0,
              description: staticUni.description || `${staticUni.name} Hindu Society`,
              tournamentDate: staticUni.tournamentDate,
              isCompeting: true,
              status: 'competing',
              isStatic: true
            });
            existingKeys.add(key);
            return;
          }
        }
        
        // For non-KCL universities, check by name+zone
        if (!existingKeys.has(key)) {
          // Add static university to the list
          universitiesList.push({
            id: staticUni.id || `static-${staticUni.name.toLowerCase().replace(/\s+/g, '-')}-${zone}`,
            name: staticUni.name,
            zone: staticUni.zone,
            sports: staticUni.sports || [],
            teamInfo: staticUni.teamInfo || {},
            members: staticUni.members || 0,
            wins: staticUni.wins || 0,
            losses: staticUni.losses || 0,
            points: staticUni.points || 0,
            description: staticUni.description || `${staticUni.name} Hindu Society`,
            tournamentDate: staticUni.tournamentDate,
            isCompeting: true, // Always true for static competing universities
            status: 'competing',
            isStatic: true // Flag to indicate this is from static code
          });
          existingKeys.add(key);
        } else {
          // Update existing university with static data if it's missing isCompeting flag
          const existingIndex = universitiesList.findIndex(uni => {
            const uniName = (uni.name || uni.universityName || '').toLowerCase();
            const uniZone = uni.zone || '';
            return uniName === nameLower && uniZone === zone;
          });
          if (existingIndex >= 0) {
            const existing = universitiesList[existingIndex];
            // Ensure isCompeting is set if static says it should be competing
            if (staticUni.isCompeting === true) {
              universitiesList[existingIndex] = {
                ...existing,
                isCompeting: true,
                status: existing.status || 'competing',
                // Merge sports and teamInfo from static if missing
                sports: existing.sports && existing.sports.length > 0 && existing.sports[0] !== 'TBD'
                  ? existing.sports
                  : (staticUni.sports || existing.sports || []),
                teamInfo: existing.teamInfo || staticUni.teamInfo || {}
              };
            }
          }
        }
      });
      
      console.log('📊 Total universities after merging static data:', universitiesList.length);
      
      if (universitiesList.length > 0) {
        console.log('🏫 Universities data:', universitiesList);
        console.log('🔍 University details:');
        universitiesList.forEach((uni, index) => {
          console.log(`  ${index + 1}. ${uni.name || uni.universityName} (${uni.zone || uni.region}) - Points: ${uni.points || 0}`);
          console.log(`  Full university data:`, uni);
        });
        
        // Create league entries from universities (only competing ones)
        const leagueEntries: LeagueEntry[] = [];
        
        // Separate KCL entries for zone-specific filtering
        const kclEntries = universitiesList.filter(uni => {
          const name = (uni.name || uni.universityName || '').toLowerCase();
          return name === 'kcl' && (uni.isCompeting === true || uni.status === 'competing');
        });
        
        console.log(`📊 Found ${kclEntries.length} KCL entries:`, kclEntries.map(uni => ({
          id: uni.id,
          zone: uni.zone,
          sports: uni.sports
        })));
        
        const otherUniversities = universitiesList.filter(uni => {
          const name = (uni.name || uni.universityName || '').toLowerCase();
          return name !== 'kcl' && (uni.isCompeting === true || uni.status === 'competing');
        });
        
        // Process other universities first
        otherUniversities
          .forEach((uni: any, index: number) => {
          // Skip if university doesn't have required data
          if (!uni.name && !uni.universityName) {
            console.log('⚠️ Skipping university without name:', uni);
            return;
          }

          // Get sports the university is registered for
          const sports = uni.sports || [];
          
          // Calculate totals across all sports - use wins/losses/points if totalWins/totalLosses don't exist
          const totalMatches = uni.totalMatches || (uni.wins || 0) + (uni.losses || 0) + (uni.draws || 0);
          const totalWins = uni.totalWins || uni.wins || 0;
          const totalLosses = uni.totalLosses || uni.losses || 0;
          const totalDraws = uni.totalDraws || uni.draws || 0;
          const totalPoints = uni.totalPoints || uni.points || 0;

          const entry: LeagueEntry = {
            id: uni.id || `uni-${index}`,
            university: uni.name || uni.universityName || 'Unknown University',
            zone: uni.zone || uni.region || 'Unknown',
            sports: sports, // Sports array from university data (includes pre-populated sports for LZ+SZ)
            totalMatches: totalMatches,
            totalWins: totalWins,
            totalLosses: totalLosses,
            totalDraws: totalDraws,
            totalPoints: totalPoints,
            sportsBreakdown: uni.sportsBreakdown || {},
            form: uni.form || '-----', // Default form string
            change: 'same' as const,
            changeValue: 0,
            position: 0 // Will be set after sorting
          };
          
          console.log(`📊 Processing university: ${entry.university} (${entry.zone}) - Points: ${entry.totalPoints}`);
          leagueEntries.push(entry);
        });
        
        // Handle KCL entries: merge when showing all zones, keep separate when filtering by zone
        // KCL entries will be handled in the filtering logic below
        kclEntries.forEach((uni: any, index: number) => {
          if (!uni.name && !uni.universityName) return;
          
          const sports = uni.sports || [];
          const totalMatches = uni.totalMatches || (uni.wins || 0) + (uni.losses || 0) + (uni.draws || 0);
          const totalWins = uni.totalWins || uni.wins || 0;
          const totalLosses = uni.totalLosses || uni.losses || 0;
          const totalDraws = uni.totalDraws || uni.draws || 0;
          const totalPoints = uni.totalPoints || uni.points || 0;
          
          const entry: LeagueEntry = {
            id: uni.id || `kcl-${index}`,
            university: uni.name || uni.universityName || 'KCL',
            zone: uni.zone || uni.region || 'Unknown',
            sports: sports,
            totalMatches: totalMatches,
            totalWins: totalWins,
            totalLosses: totalLosses,
            totalDraws: totalDraws,
            totalPoints: totalPoints,
            sportsBreakdown: uni.sportsBreakdown || {},
            form: uni.form || '-----',
            change: 'same' as const,
            changeValue: 0,
            position: 0
          };
          
          leagueEntries.push(entry);
        });
        
        // Sort Olympics-style: by total points (primary), then wins (secondary), then alphabetically (tertiary)
        leagueEntries.sort((a, b) => {
          // Primary: Total points (descending) - like Olympic medal count
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          // Secondary: Total wins (descending) - tiebreaker
          if (b.totalWins !== a.totalWins) {
            return b.totalWins - a.totalWins;
          }
          // Tertiary: Alphabetical order - final tiebreaker
          return a.university.localeCompare(b.university);
        });
        
        // Assign positions based on points ranking (Olympics-style)
        leagueEntries.forEach((entry, index) => {
          entry.position = index + 1;
          console.log(`Position ${entry.position}: ${entry.university} (${entry.totalPoints} points, ${entry.totalWins} wins)`);
        });
        
        console.log(`✅ Updated league table - ${leagueEntries.length} entries`);
        setEntries(leagueEntries);
        setLastUpdated(new Date());
        setIsUsingLiveData(false); // This is fallback data from universities
        
        console.log('✅ Real data loaded:', { total: leagueEntries.length });
      } else {
        console.log('📊 No universities found, showing empty league table');
        setEntries([]);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('❌ Error loading real data:', error);
      setError('Failed to load real data from universities');
    }
  };

  const getPositionIcon = (position: number) => {
    // Just show numbers for all positions (no trophy/medal icons)
    return <span className="text-lg font-bold text-gray-600 w-6 h-6 flex items-center justify-center">{position}</span>;
  };

  const getZoneColor = (zone: string) => {
    // Use gradient colors for combined zones (two mixed colors) like university-card
    const zoneColors: { [key: string]: string } = {
      'NZ': 'bg-red-500',
      'CZ': 'bg-green-500', 
      'LZ': 'bg-blue-500',
      'SZ': 'bg-yellow-500',
      'NZ+CZ': 'bg-gradient-to-r from-red-500 to-green-500', // Two mixed colors
      'LZ+SZ': 'bg-gradient-to-r from-blue-500 to-yellow-500' // Two mixed colors
    };
    return zoneColors[zone] || 'bg-gray-500';
  };

  const getFormColor = (form: string) => {
    if (!form || form === '-----') return 'text-gray-400';
    const wins = (form.match(/W/g) || []).length;
    const draws = (form.match(/D/g) || []).length;
    const losses = (form.match(/L/g) || []).length;
    
    if (wins > losses) return 'text-green-600';
    if (losses > wins) return 'text-red-600';
    return 'text-yellow-600';
  };

  // Filter entries first (but don't filter KCL yet - we'll handle it separately)
  let filteredEntries = (entries || []).filter(entry => {
    // Skip KCL entries in initial filter - we'll handle them separately
    if (entry.university.toLowerCase() === 'kcl') return false;
    if (selectedZone === 'all') return true;
    return entry.zone === selectedZone || entry.zone.includes(selectedZone);
  });
  
  // Always merge KCL entries and show both zone colors (regardless of filter)
  // KCL appears once in the league table with both zone colors
  const allKclEntries = (entries || []).filter(entry => entry.university.toLowerCase() === 'kcl');
  
  if (allKclEntries.length > 0) {
    // Find KCL entries from both zones (from all entries, not just filtered)
    const kclLZ = allKclEntries.find(entry => entry.zone === 'LZ+SZ' || entry.zone.includes('LZ') || entry.zone.includes('SZ'));
    const kclNZ = allKclEntries.find(entry => entry.zone === 'NZ+CZ' || entry.zone.includes('NZ') || entry.zone.includes('CZ'));
    
    // Always merge KCL entries and show both zone colors
    if (kclLZ && kclNZ) {
      // Merge KCL entries from both zones
      const combinedPoints = (kclLZ.totalPoints || 0) + (kclNZ.totalPoints || 0);
      const combinedWins = (kclLZ.totalWins || 0) + (kclNZ.totalWins || 0);
      const combinedLosses = (kclLZ.totalLosses || 0) + (kclNZ.totalLosses || 0);
      const combinedDraws = (kclLZ.totalDraws || 0) + (kclNZ.totalDraws || 0);
      const combinedMatches = (kclLZ.totalMatches || 0) + (kclNZ.totalMatches || 0);
      
      // Combine sports arrays (unique sports)
      const allSports = new Set([
        ...(kclLZ.sports || []),
        ...(kclNZ.sports || [])
      ]);
      
      const mergedKCL: LeagueEntry = {
        id: kclLZ.id || 'kcl-combined',
        university: 'KCL',
        zone: 'LZ+SZ & NZ+CZ',
        sports: Array.from(allSports),
        totalMatches: combinedMatches,
        totalWins: combinedWins,
        totalLosses: combinedLosses,
        totalDraws: combinedDraws,
        totalPoints: combinedPoints,
        sportsBreakdown: { ...(kclLZ.sportsBreakdown || {}), ...(kclNZ.sportsBreakdown || {}) },
        form: kclLZ.form || '-----',
        change: 'same' as const,
        changeValue: 0,
        position: 0,
        isMultiZone: true,
        zones: ['LZ+SZ', 'NZ+CZ']
      };
      
      filteredEntries = [...filteredEntries, mergedKCL];
      console.log(`📊 Merged KCL entries: ${combinedPoints} points from both zones`);
    } else if (kclLZ) {
      // Only LZ+SZ entry exists, but still show both zone colors
      const mergedKCL: LeagueEntry = {
        ...kclLZ,
        zone: 'LZ+SZ & NZ+CZ',
        isMultiZone: true,
        zones: ['LZ+SZ', 'NZ+CZ']
      };
      filteredEntries = [...filteredEntries, mergedKCL];
    } else if (kclNZ) {
      // Only NZ+CZ entry exists, but still show both zone colors
      const mergedKCL: LeagueEntry = {
        ...kclNZ,
        zone: 'LZ+SZ & NZ+CZ',
        isMultiZone: true,
        zones: ['LZ+SZ', 'NZ+CZ']
      };
      filteredEntries = [...filteredEntries, mergedKCL];
    } else {
      // Single KCL entry, show both zone colors
      const kclEntry = allKclEntries[0];
      const mergedKCL: LeagueEntry = {
        ...kclEntry,
        zone: 'LZ+SZ & NZ+CZ',
        isMultiZone: true,
        zones: ['LZ+SZ', 'NZ+CZ']
      };
      filteredEntries = [...filteredEntries, mergedKCL];
    }
  }
  
  // Recalculate positions after filtering/merging (Olympics-style)
  const entriesWithPositions = [...filteredEntries].sort((a, b) => {
    // Primary: Total points (descending)
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    // Secondary: Total wins (descending)
    if (b.totalWins !== a.totalWins) {
      return b.totalWins - a.totalWins;
    }
    // Tertiary: Alphabetical order
    return a.university.localeCompare(b.university);
  });
  
  // Assign positions based on points ranking (Olympics-style)
  entriesWithPositions.forEach((entry, index) => {
    entry.position = index + 1;
  });

  const sortedEntries = entriesWithPositions.sort((a, b) => {
    switch (sortBy) {
      case 'points':
        // Olympics-style: Points (primary), Wins (secondary), Alphabetical (tertiary)
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
        return a.university.localeCompare(b.university);
      case 'university':
        return a.university.localeCompare(b.university);
      case 'position':
      default:
        // Position already reflects Olympics-style ranking (points-based)
        return a.position - b.position;
    }
  });

  const uniqueZones = Array.from(new Set((entries || []).map(entry => entry.zone))).sort();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span>NHSF (UK) Dharmic Games League Table</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <div className="flex flex-col">
              <span>NHSF (UK) Dharmic Games Leaderboard</span>
              <span className="text-sm font-normal text-gray-600 mt-1">
                Olympics-style ranking by total points (universities compete in different numbers of sports)
              </span>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              {isUsingLiveData ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Live Table ✅
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  League Table
                </Badge>
              )}
            </div>
          </CardTitle>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        {showFilters && (
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Zone:</span>
              <select 
                value={selectedZone} 
                onChange={(e) => setSelectedZone(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Zones</option>
                {(uniqueZones || []).map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="points">Points (Olympics-style)</option>
                <option value="position">Rank</option>
                <option value="university">University</option>
              </select>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No universities found</p>
            <p className="text-sm text-gray-500 mt-2">Universities will appear here once they register</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">University</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Zone</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Sports</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Matches</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Wins</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Losses</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Draws</th>
                  <th className="text-center py-3 px-4 font-bold text-orange-600 bg-orange-50 border-l-2 border-orange-300">
                    Points ⭐
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Form</th>
                </tr>
              </thead>
              <tbody>
                {(sortedEntries || []).map((entry, index) => (
                  <tr 
                    key={entry.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      entry.position <= 3 
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50' 
                        : entry.position <= 6
                        ? 'bg-blue-50'
                        : 'bg-white'
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {getPositionIcon(entry.position)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        {/* Show both zone colors for KCL when merged */}
                        {(entry as any).isMultiZone && (entry as any).zones ? (
                          <div className="flex items-center space-x-1">
                            {(entry as any).zones.map((zone: string, idx: number) => (
                              <div key={idx} className={`w-3 h-3 rounded-full ${getZoneColor(zone)}`}></div>
                            ))}
                          </div>
                        ) : (
                          <div className={`w-3 h-3 rounded-full ${getZoneColor(entry.zone)}`}></div>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">{entry.university}</h3>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant="outline" className="text-xs">
                        {entry.zone}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {(entry.sports || []).map((sport, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {sport}
                          </Badge>
                        ))}
                        {(entry.sports || []).length === 0 && (
                          <span className="text-gray-400 text-xs">No sports</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-semibold">{entry.totalMatches}</td>
                    <td className="py-4 px-4 text-center font-semibold text-green-600">{entry.totalWins}</td>
                    <td className="py-4 px-4 text-center font-semibold text-red-600">{entry.totalLosses}</td>
                    <td className="py-4 px-4 text-center font-semibold text-yellow-600">{entry.totalDraws}</td>
                    <td className="py-4 px-4 text-center bg-orange-50 border-l-2 border-orange-300">
                      <span className="text-2xl font-bold text-orange-600">{entry.totalPoints}</span>
                      <div className="text-xs text-orange-500 mt-1">Total</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`font-mono text-sm ${getFormColor(entry.form)}`}>
                        {entry.form}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
