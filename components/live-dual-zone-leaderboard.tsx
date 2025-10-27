"use client";

import React, { useEffect, useState } from 'react';
import { realtimeResultsService } from '@/lib/realtime-results';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Users, Target } from 'lucide-react';
import { ref, get, onValue } from 'firebase/database';
import { collection, getDocs } from 'firebase/firestore';
import { realtimeDb, db } from '@/lib/firebase';

interface LeaderboardEntry {
  id: string;
  rank: number;
  university: string;
  zone: string;
  score: number;
  wins: number;
  losses: number;
  change: 'up' | 'down' | 'same';
  changeValue?: number;
  lastUpdated?: number;
}

interface LiveLeaderboard {
  [zone: string]: {
    [universityId: string]: LeaderboardEntry;
  };
}

interface LiveDualZoneLeaderboardProps {
  showPlayoffs?: boolean;
}

export function LiveDualZoneLeaderboard({ showPlayoffs = false }: LiveDualZoneLeaderboardProps) {
  const [nzCzLeaderboard, setNzCzLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lzSzLeaderboard, setLzSzLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const setupRealtimeListeners = async () => {
      try {
        setLoading(true);
        setError(null);

        // Listen to live leaderboard updates
        const unsubscribeLeaderboard = realtimeResultsService.listenToLiveLeaderboard((leaderboardData: LiveLeaderboard) => {
          if (leaderboardData) {
            // Process NZ+CZ zone data
            const nzCzData = processZoneData(leaderboardData, ['NZ', 'CZ']);
            setNzCzLeaderboard(nzCzData);

            // Process LZ+SZ zone data
            const lzSzData = processZoneData(leaderboardData, ['LZ', 'SZ']);
            setLzSzLeaderboard(lzSzData);

            setLastUpdated(new Date());
          } else {
            // If no leaderboard data, try to get real data from universities
            loadRealDataFromUniversities();
          }
        });

        // Also listen to universities changes for real-time updates
        const universitiesRef = ref(realtimeDb, 'universities');
        const unsubscribeUniversities = onValue(universitiesRef, (snapshot) => {
          console.log('🔄 Universities listener triggered, snapshot exists:', snapshot.exists());
          if (snapshot.exists()) {
            console.log('🔄 Universities data changed, updating leaderboard...');
            loadRealDataFromUniversities();
          } else {
            console.log('📊 No universities data found in Realtime Database listener');
            // Try to load from Firestore as fallback
            loadRealDataFromUniversities();
          }
        });

        setLoading(false);
        
        // Also try to load universities immediately
        console.log('🔄 Loading universities immediately on mount...');
        loadRealDataFromUniversities();
        
        // Force load after a short delay to ensure Firebase is ready
        setTimeout(() => {
          console.log('🔄 Force loading universities after delay...');
          loadRealDataFromUniversities();
        }, 1000);

        return () => {
          unsubscribeLeaderboard();
          unsubscribeUniversities();
        };
      } catch (err) {
        setError('Failed to connect to real-time database');
        setLoading(false);
      }
    };

    setupRealtimeListeners();
  }, []);


  const processZoneData = (leaderboardData: LiveLeaderboard, zones: string[]): LeaderboardEntry[] => {
    const entries: LeaderboardEntry[] = [];
    
    zones.forEach(zone => {
      if (leaderboardData[zone]) {
        Object.values(leaderboardData[zone]).forEach((entry: any) => {
          entries.push({
            ...entry,
            zone: zone
          });
        });
      }
    });

    // Sort by score (descending) and assign ranks
    entries.sort((a, b) => b.score - a.score);
    return entries.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  };

  const loadRealDataFromUniversities = async () => {
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
          console.log(`  ${index + 1}. ${uni.name || uni.universityName} (${uni.zone || uni.region}) - Score: ${uni.score || 0}`);
        });
        
        // Create leaderboard entries from universities
        const nzCzEntries: LeaderboardEntry[] = [];
        const lzSzEntries: LeaderboardEntry[] = [];
        
        universitiesList.forEach((uni: any, index: number) => {
          // Skip if university doesn't have required data
          if (!uni.name && !uni.universityName) {
            console.log('⚠️ Skipping university without name:', uni);
            return;
          }

          // Skip non-competing universities (same logic as main league table)
          if (!(uni.isCompeting === true || 
                uni.status === 'competing' ||
                (uni.status !== 'not-competing' && uni.status !== 'affiliated'))) {
            console.log('⚠️ Skipping non-competing university:', uni.name || uni.universityName);
            return;
          }

          const entry: LeaderboardEntry = {
            id: uni.id || `uni-${index}`,
            university: uni.name || uni.universityName || 'Unknown University',
            zone: uni.zone || uni.region || (index % 2 === 0 ? 'NZ' : 'CZ'),
            score: uni.score || uni.points || 0,
            wins: uni.wins || 0,
            losses: uni.losses || 0,
            change: 'up' as const,
            changeValue: 0,
            rank: 0 // Will be set after sorting
          };
          
          console.log(`📊 Processing university: ${entry.university} (${entry.zone})`);
          
          // Assign to appropriate zone group
          if (entry.zone === 'NZ' || entry.zone === 'CZ' || entry.zone === 'NZ+CZ') {
            nzCzEntries.push(entry);
          } else if (entry.zone === 'LZ' || entry.zone === 'SZ' || entry.zone === 'LZ+SZ') {
            lzSzEntries.push(entry);
          }
        });
        
        // Sort by score (descending), then alphabetically by university name for same scores
        nzCzEntries.sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score; // Higher scores first
          }
          return a.university.localeCompare(b.university); // Alphabetical for same scores
        });
        
        lzSzEntries.sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score; // Higher scores first
          }
          return a.university.localeCompare(b.university); // Alphabetical for same scores
        });
        
        nzCzEntries.forEach((entry, index) => entry.rank = index + 1);
        lzSzEntries.forEach((entry, index) => entry.rank = index + 1);
        
        console.log(`✅ Updated leaderboards - NZ+CZ: ${nzCzEntries.length} entries, LZ+SZ: ${lzSzEntries.length} entries`);
        setNzCzLeaderboard(nzCzEntries);
        setLzSzLeaderboard(lzSzEntries);
        setLastUpdated(new Date());
        
        console.log('✅ Real data loaded:', { nzCz: nzCzEntries.length, lzSz: lzSzEntries.length });
      } else {
        console.log('📊 No universities found, showing empty leaderboard');
        setNzCzLeaderboard([]);
        setLzSzLeaderboard([]);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('❌ Error loading real data:', error);
      setError('Failed to load real data from universities');
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'LZ':
        return 'bg-blue-500';
      case 'SZ':
        return 'bg-green-500';
      case 'CZ':
        return 'bg-purple-500';
      case 'NZ':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCombinedZoneColor = (zones: string[]) => {
    if (zones.includes('NZ') && zones.includes('CZ')) {
      return 'bg-gradient-to-r from-red-500 to-purple-500';
    }
    if (zones.includes('LZ') && zones.includes('SZ')) {
      return 'bg-gradient-to-r from-blue-500 to-green-500';
    }
    return 'bg-gray-500';
  };

  const LeaderboardTable = ({ 
    title, 
    entries, 
    zoneColors, 
    combinedZoneName 
  }: { 
    title: string; 
    entries: LeaderboardEntry[]; 
    zoneColors: string[];
    combinedZoneName: string;
  }) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <span>{title}</span>
          <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-300">
            Live
          </Badge>
        </CardTitle>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className={`w-3 h-3 rounded-full ${getCombinedZoneColor(zoneColors)}`}></div>
          <span>{combinedZoneName}</span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
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
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No data available for this zone</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 10).map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                  entry.rank <= 3 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className={`w-3 h-3 rounded-full ${getZoneColor(entry.zone)}`}></div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{entry.university}</h3>
                    <p className="text-sm text-gray-600">{entry.zone} Zone</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Score</p>
                    <p className="text-xl font-bold text-orange-600">{entry.score.toLocaleString()}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Wins</p>
                    <p className="text-lg font-semibold text-green-600">{entry.wins}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Losses</p>
                    <p className="text-lg font-semibold text-red-600">{entry.losses}</p>
                  </div>
                  
                  {entry.changeValue !== undefined && (
                    <div className="flex items-center space-x-1">
                      {getChangeIcon(entry.change)}
                      <span className={`text-sm font-medium ${
                        entry.change === 'up' ? 'text-green-600' :
                        entry.change === 'down' ? 'text-red-500' :
                        'text-gray-500'
                      }`}>
                        {entry.change === 'same' ? '0' : entry.changeValue}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Target className="w-8 h-8 text-orange-500" />
          <h2 className="text-3xl font-bold text-gray-900">Live Zone Leaderboards</h2>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            LIVE
          </Badge>
        </div>
        {lastUpdated && (
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Dual Zone Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* North & Central Zone */}
        <LeaderboardTable
          title="North & Central Zone"
          entries={nzCzLeaderboard}
          zoneColors={['NZ', 'CZ']}
          combinedZoneName="North & Central Zone"
        />

        {/* London & South Zone */}
        <LeaderboardTable
          title="London & South Zone"
          entries={lzSzLeaderboard}
          zoneColors={['LZ', 'SZ']}
          combinedZoneName="London & South Zone"
        />
      </div>

      {/* Playoff Table - Hidden but not removed */}
      {showPlayoffs && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <span>Playoff Bracket</span>
              <Badge variant="outline" className="ml-auto">
                Coming Soon
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Playoff bracket will be available after zone competitions</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
