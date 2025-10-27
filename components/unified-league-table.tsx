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
  const [sortBy, setSortBy] = useState<'position' | 'points' | 'university'>('position');
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
          const competingEntries = leaderboardData.entries.filter(entry => 
            entry.isCompeting === true || 
            entry.status === 'competing' ||
            (entry.status !== 'not-competing' && entry.status !== 'affiliated')
          );
          
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
      
      if (universitiesList.length > 0) {
        console.log('🏫 Universities data:', universitiesList);
        console.log('🔍 University details:');
        universitiesList.forEach((uni, index) => {
          console.log(`  ${index + 1}. ${uni.name || uni.universityName} (${uni.zone || uni.region}) - Points: ${uni.points || 0}`);
          console.log(`  Full university data:`, uni);
        });
        
        // Create league entries from universities (only competing ones)
        const leagueEntries: LeagueEntry[] = [];
        
        universitiesList
          .filter(uni => {
            // Only include competing universities
            return uni.isCompeting === true || 
                   uni.status === 'competing' ||
                   (uni.status !== 'not-competing' && uni.status !== 'affiliated');
          })
          .forEach((uni: any, index: number) => {
          // Skip if university doesn't have required data
          if (!uni.name && !uni.universityName) {
            console.log('⚠️ Skipping university without name:', uni);
            return;
          }

          // Get sports the university is registered for
          const sports = uni.sports || [];
          
          // Calculate totals across all sports
          const totalMatches = uni.totalMatches || 0;
          const totalWins = uni.totalWins || 0;
          const totalLosses = uni.totalLosses || 0;
          const totalDraws = uni.totalDraws || 0;
          const totalPoints = uni.totalPoints || 0;

          const entry: LeagueEntry = {
            id: uni.id || `uni-${index}`,
            university: uni.name || uni.universityName || 'Unknown University',
            zone: uni.zone || uni.region || 'Unknown',
            sports: sports,
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
        
        // Sort by total points (descending), then alphabetically by university name for same points
        leagueEntries.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints; // Higher points first
          }
          return a.university.localeCompare(b.university); // Alphabetical for same points
        });
        
        // Assign positions
        leagueEntries.forEach((entry, index) => {
          entry.position = index + 1;
          console.log(`Position ${entry.position}: ${entry.university} (${entry.totalPoints} points)`);
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
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-600 w-6 h-6 flex items-center justify-center">{position}</span>;
  };

  const getZoneColor = (zone: string) => {
    const zoneColors: { [key: string]: string } = {
      'NZ': 'bg-red-500',
      'CZ': 'bg-green-500', 
      'LZ': 'bg-blue-500',
      'SZ': 'bg-purple-500',
      'NZ+CZ': 'bg-orange-500',
      'LZ+SZ': 'bg-indigo-500'
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

  const filteredEntries = (entries || []).filter(entry => {
    if (selectedZone === 'all') return true;
    return entry.zone === selectedZone || entry.zone.includes(selectedZone);
  });

  const sortedEntries = [...(filteredEntries || [])].sort((a, b) => {
    switch (sortBy) {
      case 'points':
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.university.localeCompare(b.university);
      case 'university':
        return a.university.localeCompare(b.university);
      case 'position':
      default:
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
            <span>NHSF (UK) Dharmic Games League Table</span>
            <div className="ml-auto flex items-center space-x-2">
              {isUsingLiveData ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Live Table ✅
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Waiting for scores… showing signup data
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
                <option value="position">Position</option>
                <option value="points">Points</option>
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Pos</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">University</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Zone</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Sports</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Matches</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Wins</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Losses</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Draws</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Points</th>
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
                        <div className={`w-3 h-3 rounded-full ${getZoneColor(entry.zone)}`}></div>
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
                    <td className="py-4 px-4 text-center">
                      <span className="text-xl font-bold text-orange-600">{entry.totalPoints}</span>
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
