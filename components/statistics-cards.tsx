"use client"

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users, GamepadIcon, Award, Wifi, WifiOff, Building2, Users2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ref, onValue, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export function StatisticsCards() {
  // Auto-calculated stats from real data
  const [stats, setStats] = useState({
    activePlayers: 0,
    gamesPlayed: 0,
    hoursCompeted: 0,
    matchesWon: 0,
    zoneChampionships: 4, // Fixed: 4 zones (NZ, CZ, LZ, SZ)
    upcomingMatches: 0,
    competingUniversities: 0,
    totalSportsTeams: 0
  });
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Raw data for calculations
  const [universities, setUniversities] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  // Fixed stats calculation - handles missing data properly
  const calculateStats = () => {
    console.log('🔄 Auto-calculating stats from real data...');
    console.log('📊 Raw data counts:', { 
      universities: universities.length, 
      teams: teams.length, 
      players: players.length, 
      matches: matches.length 
    });
    
    // Calculate from universities (any university that exists is competing)
    const competingUniversities = universities.length;
    
    // Calculate teams and players from universities structure
    let totalSportsTeams = 0;
    let activePlayers = 0;
    const allSports = new Set();
    
    universities.forEach(uni => {
      // Count sports registered to each university = sports teams
      if (uni.sports && Array.isArray(uni.sports)) {
        uni.sports.forEach(sport => allSports.add(sport));
        // Each sport registered to university counts as a sports team
        totalSportsTeams += uni.sports.length;
      }
      
      // Count players from university structure
      if (uni.players && typeof uni.players === 'object') {
        activePlayers += Object.keys(uni.players).length;
      }
    });
    
    // Add players from top-level players collection
    activePlayers += players.length;
    
    // Calculate from matches - default to 0 if no data
    const totalMatches = matches.length || 0;
    const completedMatches = matches.filter(match => 
      match.status === 'completed' || match.status === 'finished'
    ).length || 0;
    const upcomingMatches = matches.filter(match => 
      match.status === 'scheduled' || match.status === 'upcoming' || match.status === 'pending' || match.status === 'live'
    ).length || 0;
    
    // Calculate hours competed (estimate: 1.5 hours per completed match)
    const hoursCompeted = Math.round(completedMatches * 1.5);
    
    console.log('🏆 Sports found:', Array.from(allSports));
    
    const newStats = {
      activePlayers: activePlayers || 0,
      gamesPlayed: totalMatches || 0,
      hoursCompeted: hoursCompeted || 0,
      matchesWon: completedMatches || 0,
      zoneChampionships: 4, // Always 4 zones: NZ, CZ, LZ, SZ
      upcomingMatches: upcomingMatches || 0,
      competingUniversities: competingUniversities || 0,
      totalSportsTeams: totalSportsTeams || 0
    };
    
    console.log('📊 Auto-calculated stats:', newStats);
    console.log('🔍 Detailed breakdown:', {
      competingUniversities,
      activePlayers,
      totalSportsTeams,
      totalMatches,
      completedMatches,
      upcomingMatches,
      hoursCompeted,
      sportsCount: allSports.size,
      sportsList: Array.from(allSports),
      zonesCount: 4 // Always 4 zones
    });
    
    setStats(newStats);
    setLastUpdated(new Date());
    setIsLive(true);
  };

  // Auto-calculate stats whenever raw data changes (even if empty)
  useEffect(() => {
    calculateStats();
    setLoading(false);
  }, [universities, teams, players, matches]);

  useEffect(() => {
    const listeners: (() => void)[] = [];
    let isMounted = true;

    const setupRealtimeListeners = () => {
      try {
        // Check Firebase initialization
        console.log('Firebase realtimeDb available:', !!realtimeDb);
        console.log('Environment:', process.env.NODE_ENV);
        
        if (!realtimeDb) {
          console.error('Firebase Realtime Database not available - check Firebase config');
          // Use minimal fallback if Firebase is completely unavailable
          if (isMounted) {
            setStats({
              activePlayers: 0,
              gamesPlayed: 0,
              hoursCompeted: 0,
              matchesWon: 0,
              zoneChampionships: 4,
              upcomingMatches: 0,
              competingUniversities: 0,
              totalSportsTeams: 0
            });
            // setTotalPlayers removed - using activePlayers instead
            setLastUpdated(new Date());
            setIsLive(false);
            setLoading(false);
            return;
          }
        }

        console.log('Setting up Realtime Database listeners for auto-calculation...');

        // Listen to universities data
        const universitiesRef = ref(realtimeDb, 'universities');
        const universitiesListener = onValue(universitiesRef, (snapshot) => {
          if (!isMounted) return;
          const universitiesData = snapshot.val();
          console.log('🏫 Raw universities data from Firebase:', universitiesData);
          
          if (universitiesData) {
            const universitiesList = Object.values(universitiesData);
            console.log('📊 Universities data received:', universitiesList.length);
            console.log('🏫 First university sample:', universitiesList[0]);
            setUniversities(universitiesList);
          } else {
            console.log('📊 No universities data found');
            setUniversities([]);
          }
        });
        listeners.push(universitiesListener);

        // Listen to teams data
        const teamsRef = ref(realtimeDb, 'teams');
        const teamsListener = onValue(teamsRef, (snapshot) => {
          if (!isMounted) return;
          const teamsData = snapshot.val();
          console.log('⚽ Raw teams data from Firebase:', teamsData);
          
          if (teamsData) {
            const teamsList = Object.values(teamsData);
            console.log('📊 Teams data received:', teamsList.length);
            console.log('⚽ First team sample:', teamsList[0]);
            setTeams(teamsList);
          } else {
            console.log('📊 No teams data found');
            setTeams([]);
          }
        });
        listeners.push(teamsListener);

        // Listen to players data - check both top-level and nested in universities
        const playersRef = ref(realtimeDb, 'players');
        const playersListener = onValue(playersRef, (snapshot) => {
          if (!isMounted) return;
          const playersData = snapshot.val();
          console.log('👥 Raw players data from Firebase:', playersData);
          
          if (playersData) {
            const playersList = Object.values(playersData);
            console.log('📊 Players data received:', playersList.length);
            console.log('👥 First player sample:', playersList[0]);
            setPlayers(playersList);
          } else {
            console.log('📊 No players data found at /players');
            setPlayers([]);
          }
        });
        listeners.push(playersListener);

        // Listen to matches data - check multiple possible locations
        const matchesRef = ref(realtimeDb, 'matches');
        const matchesListener = onValue(matchesRef, (snapshot) => {
          if (!isMounted) return;
          const matchesData = snapshot.val();
          console.log('🏆 Raw matches data from Firebase:', matchesData);
          
          if (matchesData) {
            const matchesList = Object.values(matchesData);
            
            // Filter out dummy football matches
            const filteredMatches = matchesList.filter((match: any) => {
              if (match.sport === 'Football' && 
                  (!match.team1 || !match.team2 || 
                   match.team1 === 'VS' || match.team2 === 'VS' ||
                   match.team1 === '' || match.team2 === '' ||
                   match.team1 === 'Team 1' || match.team2 === 'Team 2')) {
                console.log('🚫 Filtering out dummy football match from stats:', match);
                return false;
              }
              return true;
            });
            
            console.log('📊 Matches data received:', filteredMatches.length, '(filtered from', matchesList.length, ')');
            console.log('🏆 First match sample:', filteredMatches[0]);
            setMatches(filteredMatches);
          } else {
            console.log('📊 No matches data found at /matches');
            // Try to get matches from other possible locations
            console.log('🔍 Checking for matches in other locations...');
            setMatches([]);
          }
        });
        listeners.push(matchesListener);

      } catch (error) {
        console.error('Error setting up Realtime Database listeners:', error);
        if (isMounted) {
          // Use fallback data on error
          setStats({
            activePlayers: 0,
            gamesPlayed: 0,
            hoursCompeted: 0,
            matchesWon: 0,
            zoneChampionships: 4,
            upcomingMatches: 0,
            competingUniversities: 0,
            totalSportsTeams: 0
          });
          setLastUpdated(new Date());
          setIsLive(false);
          setLoading(false);
        }
      }
    };

    setupRealtimeListeners();

    // Cleanup function
    return () => {
      isMounted = false;
      listeners.forEach(cleanup => cleanup());
    };
  }, []);

  const cards = [
    // 1. OVERVIEW - Total participants and structure
    {
      icon: Building2,
      iconColor: 'text-indigo-600',
      title: 'Competing Universities',
      badge: {
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        text: isLive ? 'Live' : 'Offline',
      },
      value: stats.competingUniversities,
      dateRange: 'Universities actively competing',
    },
    {
      icon: Users2,
      iconColor: 'text-emerald-600',
      title: 'Sports Teams',
      badge: {
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        text: isLive ? 'Live' : 'Offline',
      },
      value: stats.totalSportsTeams,
      dateRange: 'Total sports teams across all universities',
    },
    {
      icon: Users,
      iconColor: 'text-orange-600',
      title: 'Active Players',
      badge: {
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-red-500',
        text: isLive ? 'Live' : 'Offline',
      },
      value: stats.activePlayers,
      dateRange: stats.activePlayers > 0 ? 'Players across all sports and teams' : 'Estimated players across all teams',
    },
    
    
    // 3. MATCH PROGRESS - Historical data
    {
      icon: GamepadIcon,
      iconColor: 'text-red-600',
      title: 'Total Matches',
      badge: {
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        text: isLive ? 'Live' : 'Offline',
      },
      value: stats.gamesPlayed,
      dateRange: 'Total matches across all zones',
    },
    {
      icon: Trophy,
      iconColor: 'text-purple-600',
      title: 'Completed Matches',
      badge: {
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        text: isLive ? 'Live' : 'Offline',
      },
      value: stats.matchesWon,
      dateRange: 'Finished matches',
    },
    
    // 4. SYSTEM INFO - Infrastructure
    {
      icon: Award,
      iconColor: 'text-blue-600',
      title: 'Active Zones',
      badge: {
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        text: isLive ? 'Live' : 'Offline',
      },
      value: stats.zoneChampionships,
      dateRange: 'Competition zones',
    },
  ];
  if (loading) {
    return (
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            NHSF (UK) Dharmic Games Stats
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            Loading real-time statistics and performance metrics...
          </p>
          <div className="flex items-center justify-center mt-2">
            <div className="animate-pulse flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Connecting to live data...</span>
            </div>
          </div>
        </div>
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 @3xl:grid-cols-2 @5xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-6 h-6 bg-gray-300 rounded"></div>
                      <div className="w-16 h-6 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between grow">
                      <div>
                        <div className="w-24 h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="w-16 h-8 bg-gray-300 rounded mb-6"></div>
                      </div>
                      <div className="w-32 h-3 bg-gray-300 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 px-4 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            NHSF (UK) Dharmic Games Stats
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            Real-time statistics and performance metrics from the Dharmic Games
          </p>
          
          {/* Live Status Indicator */}
          <div className="flex items-center justify-center mt-4 space-x-4">
            <div className="flex items-center space-x-2">
              {isLive ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Live Data</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-600">Offline</span>
                </div>
              )}
            </div>
            
            {lastUpdated && (
              <div className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>

        </div>

        <div className="w-full max-w-6xl mx-auto">
          {/* Container */}
          <div className="@container grow w-full">
            {/* Grid */}
            <div className="grid grid-cols-1 @3xl:grid-cols-2 @5xl:grid-cols-3 gap-6">
              {/* Cards */}
              {cards.map((card, i) => (
                <Card key={i} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardContent className="flex flex-col h-full p-6">
                    {/* Title & Badge */}
                    <div className="flex items-center justify-between mb-8">
                      <card.icon className={cn('size-6', card.iconColor)} />

                      <Badge className={cn('px-2 py-1 rounded-full', card.badge.color)}>
                        <card.badge.icon className={`w-3 h-3 ${card.badge.iconColor}`} />
                        {card.badge.text}
                      </Badge>
                    </div>

                    {/* Value & Date Range */}
                    <div className="flex-1 flex flex-col justify-between grow">
                      {/* Value */}
                      <div>
                        <div className="text-base font-medium text-muted-foreground mb-1">{card.title}</div>
                        <div className="text-3xl font-bold text-foreground mb-6">{card.value.toLocaleString()}</div>
                      </div>
                      <div className="pt-3 border-t border-muted text-xs text-muted-foreground font-medium">
                        {card.dateRange}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
