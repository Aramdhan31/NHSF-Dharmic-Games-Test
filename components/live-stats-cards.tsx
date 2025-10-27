"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, GamepadIcon, Award, Wifi, WifiOff, Building2, Users2, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { useLivePoints } from '@/lib/live-points-system';

export function LiveStatsCards() {
  const [stats, setStats] = useState({
    activePlayers: 0,
    gamesPlayed: 0,
    hoursCompeted: 0,
    matchesWon: 0,
    zoneChampionships: 4,
    upcomingMatches: 0,
    competingUniversities: 0,
    totalSportsTeams: 0
  });
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Raw data for calculations
  const [universities, setUniversities] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  
  // 🏆 Live points system integration
  const lastPointsUpdate = useLivePoints();

  // 🏆 React to live points updates
  useEffect(() => {
    if (lastPointsUpdate) {
      console.log('🏆 Live points update received in stats:', lastPointsUpdate);
      // Recalculate stats when points change
      calculateStats();
    }
  }, [lastPointsUpdate]);

  useEffect(() => {
    console.log('🔄 Setting up NHSF live stats listeners...');
    setupNHSFLiveStats();
  }, []);

  const setupNHSFLiveStats = () => {
    try {
      setLoading(true);
      setIsLive(false);

      // 🏆 Listen to live stats from Firebase (calculated by LivePointsProvider)
      const statsRef = ref(realtimeDb, 'stats/summary');
      const statsListener = onValue(statsRef, (snapshot) => {
        if (snapshot.exists()) {
          const liveStats = snapshot.val();
          console.log('📊 NHSF Live stats received:', liveStats);
          
          setStats({
            activePlayers: liveStats.activePlayers || 0,
            gamesPlayed: liveStats.completedMatches || 0,
            hoursCompeted: Math.round((liveStats.completedMatches || 0) * 1.5), // Estimate
            matchesWon: Math.round((liveStats.totalPoints || 0) / 3), // Estimate from points
            zoneChampionships: liveStats.zones || 4,
            upcomingMatches: liveStats.upcomingMatches || 0,
            competingUniversities: liveStats.competingUniversities || 0,
            totalSportsTeams: liveStats.totalSportsTeams || 0
          });
          
          setIsLive(liveStats.isLive || false);
          setLastUpdated(new Date(liveStats.lastUpdated || Date.now()));
        } else {
          console.log('📊 No live stats available, using fallback calculation...');
          // Fallback to manual calculation if live stats not available
          calculateStats();
        }
      });

      setLoading(false);

      // Cleanup function
      return () => {
        statsListener();
      };
    } catch (error) {
      console.error('❌ Error setting up NHSF live stats:', error);
      setLoading(false);
      setIsLive(false);
    }
  };

  const calculateLiveStats = () => {
    console.log('📊 Calculating live stats from real data...');
    
    // Calculate competing universities
    const competingUniversities = universities.filter(uni => 
      uni.isCompeting === true || uni.status === 'competing'
    ).length;
    
    // Calculate active players
    const activePlayers = players.filter(player => 
      player.status === 'active' || !player.status
    ).length;
    
    // Calculate total sports teams
    let totalSportsTeams = 0;
    const allSports = new Set();
    
    universities.forEach(uni => {
      if (uni.sports && Array.isArray(uni.sports)) {
        uni.sports.forEach((sport: string) => {
          allSports.add(sport);
          totalSportsTeams++;
        });
      }
    });
    
    // Calculate games played
    const completedMatches = matches.filter(match => 
      match.status === 'completed'
    ).length;
    
    // Calculate matches won
    const matchesWon = matches.filter(match => 
      match.status === 'completed' && match.winner
    ).length;
    
    // Calculate upcoming matches
    const upcomingMatches = matches.filter(match => 
      match.status === 'scheduled'
    ).length;
    
    // Calculate hours competed (estimate)
    const hoursCompeted = Math.floor(completedMatches * 1.5); // Estimate 1.5 hours per match
    
    const newStats = {
      activePlayers,
      gamesPlayed: completedMatches,
      hoursCompeted,
      matchesWon,
      zoneChampionships: 4, // Fixed: 4 zones
      upcomingMatches,
      competingUniversities,
      totalSportsTeams
    };
    
    console.log('📊 Live stats calculated:', newStats);
    setStats(newStats);
  };

  const statsCards = [
    {
      title: "Active Players",
      value: stats.activePlayers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      badge: {
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        text: isLive ? 'Live' : 'Offline'
      },
      dateRange: 'Players across all sports and teams'
    },
    {
      title: "Games Played",
      value: stats.gamesPlayed,
      icon: GamepadIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      badge: {
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        text: isLive ? 'Live' : 'Offline'
      },
      dateRange: 'Total matches across all zones'
    },
    {
      title: "Matches Won",
      value: stats.matchesWon,
      icon: Trophy,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      badge: {
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        text: isLive ? 'Live' : 'Offline'
      },
      dateRange: 'Finished matches'
    },
    {
      title: "Zone Championships",
      value: stats.zoneChampionships,
      icon: Award,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      badge: {
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        text: isLive ? 'Live' : 'Offline'
      },
      dateRange: 'Competition zones'
    },
    {
      title: "Upcoming Matches",
      value: stats.upcomingMatches,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      badge: {
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        text: isLive ? 'Live' : 'Offline'
      },
      dateRange: 'Scheduled matches'
    },
    {
      title: "Competing Universities",
      value: stats.competingUniversities,
      icon: Building2,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      badge: {
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        text: isLive ? 'Live' : 'Offline'
      },
      dateRange: 'Universities actively competing'
    },
    {
      title: "Sports Teams",
      value: stats.totalSportsTeams,
      icon: Users2,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      badge: {
        icon: isLive ? Wifi : WifiOff,
        iconColor: isLive ? 'text-green-500' : 'text-gray-500',
        color: isLive ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
        text: isLive ? 'Live' : 'Offline'
      },
      dateRange: 'Total sports teams across all universities'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
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
              {statsCards.map((card, i) => (
                <Card key={i} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardContent className="flex flex-col h-full p-6">
                    {/* Title & Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-lg", card.bgColor)}>
                          <card.icon className={cn("h-6 w-6", card.color)} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <card.badge.icon className={cn("h-4 w-4", card.badge.iconColor)} />
                        <Badge className={card.badge.color}>
                          {card.badge.text}
                        </Badge>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="flex-1 flex items-center justify-center">
                      <p className={cn("text-3xl font-bold", card.color)}>
                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600">{card.dateRange}</p>
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
