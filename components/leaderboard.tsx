"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Crown, Star, Zap, Clock, Target, Users, Activity, Play, Pause, Square, ArrowRight, MapPin, Calendar, Timer, Filter, ChevronDown } from 'lucide-react';
import { realtimeDbUtils } from '@/lib/firebase-utils';

interface LeaderboardEntry {
  id: string;
  rank: number;
  university: string;
  abbreviation: string;
  zone: string;
  avatar?: string;
  score: number;
  wins: number;
  losses: number;
  change: 'up' | 'down' | 'same';
  changeValue?: number;
  badge?: string;
  recentMatches?: {
    id: string;
    opponentUniversity: string;
    opponentZone: string;
    result: 'win' | 'loss';
    score: string;
    sport: string;
    date: string;
    duration?: string;
    venue?: string;
    highlights?: string[];
  }[];
  liveMatches?: {
    id: string;
    opponentUniversity: string;
    opponentZone: string;
    sport: string;
    status: 'live';
    currentScore?: string;
    timeRemaining?: string;
    period?: string;
    venue?: string;
  }[];
  upcomingMatches?: {
    id: string;
    opponentUniversity: string;
    opponentZone: string;
    sport: string;
    scheduledTime: string;
    venue?: string;
  }[];
  statistics?: {
    totalMatches: number;
    winRate: number;
    averageScore: number;
    bestPerformance: string;
    currentStreak: number;
    streakType: 'win' | 'loss' | 'draw';
  };
}

interface LeaderboardProps {
  title?: string;
  subtitle?: string;
  entries?: LeaderboardEntry[];
  showChange?: boolean;
  showBadges?: boolean;
}

interface MatchDetails {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  status: 'live' | 'completed' | 'scheduled';
  currentScore?: string;
  finalScore?: string;
  timeRemaining?: string;
  period?: string;
  venue: string;
  date: string;
  duration?: string;
  players: {
    home: string[];
    away: string[];
  };
  substitutions: {
    home: string[];
    away: string[];
  };
  events: {
    time: string;
    type: 'goal' | 'substitution' | 'card' | 'penalty';
    player: string;
    team: 'home' | 'away';
    description: string;
  }[];
}

const defaultEntries: LeaderboardEntry[] = [];

// Function to calculate leaderboard from match data
const calculateLeaderboard = (allMatches: any[], universitiesWithSports: { [zone: string]: any[] } = {}): LeaderboardEntry[] => {
  const universityStats: { [key: string]: { wins: number; losses: number; points: number; zone: string; university: string } } = {};
  const universityMatches: { [key: string]: any[] } = {};
  
  // Get all universities from all zones that have sports assigned
  const universities: { [zone: string]: string[] } = {};
  
  // First, add universities that have sports assigned from the universities data
  Object.entries(universitiesWithSports).forEach(([zone, unis]) => {
    universities[zone] = unis
      .filter(uni => uni.sports && uni.sports.length > 0) // Only universities with sports
      .map(uni => uni.name || uni.university || uni.id);
  });
  
  // Then, extract universities from match data (but only if they have sports)
  allMatches.forEach(match => {
    if (match.team1 && match.team2) {
      // Determine zone from match data or use default
      const zone = match.zone || 'LZ';
      if (!universities[zone]) {
        universities[zone] = [];
      }
      
      // Only add universities that have sports assigned
      const hasTeam1Sports = universitiesWithSports[zone]?.find(uni => 
        (uni.name === match.team1 || uni.university === match.team1 || uni.id === match.team1) && 
        uni.sports && uni.sports.length > 0
      );
      const hasTeam2Sports = universitiesWithSports[zone]?.find(uni => 
        (uni.name === match.team2 || uni.university === match.team2 || uni.id === match.team2) && 
        uni.sports && uni.sports.length > 0
      );
      
      if (hasTeam1Sports && !universities[zone].includes(match.team1)) {
        universities[zone].push(match.team1);
      }
      if (hasTeam2Sports && !universities[zone].includes(match.team2)) {
        universities[zone].push(match.team2);
      }
    }
  });
  
  // Initialize university stats and matches
  Object.entries(universities).forEach(([zone, unis]) => {
    unis.forEach(uni => {
      const key = `${zone}_${uni}`;
      universityStats[key] = { wins: 0, losses: 0, points: 0, zone, university: uni };
      universityMatches[key] = [];
    });
  });
  
  // Process each match
  allMatches.forEach(match => {
    // Add match to both universities involved
    if (match.team1 && match.team2) {
      const zone = match.zone || 'LZ';
      const key1 = `${zone}_${match.team1}`;
      const key2 = `${zone}_${match.team2}`;
      
      if (universityMatches[key1]) {
        universityMatches[key1].push(match);
      }
      if (universityMatches[key2]) {
        universityMatches[key2].push(match);
      }
    }
    
    if (match.status === 'completed') {
      // Parse scores based on sport type
      let score1 = 0, score2 = 0;
      
      if (match.sport === 'cricket' && match.cricketStats) {
        // For cricket, we need to get runs from the score field
        if (match.score) {
          const scoreParts = match.score.split('/');
          score1 = parseInt(scoreParts[0]) || 0;
          score2 = parseInt(scoreParts[1]) || 0;
        }
      } else if (match.score) {
        // Parse regular score format (e.g., "3-1")
        const scoreParts = match.score.split('-');
        score1 = parseInt(scoreParts[0]) || 0;
        score2 = parseInt(scoreParts[1]) || 0;
      }
      
      // Determine winner based on scores
      const zone = match.zone || 'LZ';
      const key1 = `${zone}_${match.team1}`;
      const key2 = `${zone}_${match.team2}`;
      
      // Award points based on sport
      let pointsAwarded = 3; // Default points for win
      if (match.sport === 'football' || match.sport === 'basketball') {
        pointsAwarded = 3;
      } else if (match.sport === 'badminton' || match.sport === 'tennis') {
        pointsAwarded = 2;
      } else if (match.sport === 'cricket') {
        pointsAwarded = 4; // Cricket gets more points
      } else if (match.sport === 'volleyball') {
        pointsAwarded = 3;
      }
      
      if (score1 > score2) {
        // Team 1 wins
        if (universityStats[key1]) {
          universityStats[key1].wins += 1;
          universityStats[key1].points += pointsAwarded;
        }
        if (universityStats[key2]) {
          universityStats[key2].losses += 1;
        }
      } else if (score2 > score1) {
        // Team 2 wins
        if (universityStats[key2]) {
          universityStats[key2].wins += 1;
          universityStats[key2].points += pointsAwarded;
        }
        if (universityStats[key1]) {
          universityStats[key1].losses += 1;
        }
      } else {
        // Draw - award 1 point each
        if (universityStats[key1]) {
          universityStats[key1].points += 1;
        }
        if (universityStats[key2]) {
          universityStats[key2].points += 1;
        }
      }
    }
  });
  
  // Convert to leaderboard entries with match details
  const entries: LeaderboardEntry[] = Object.entries(universityStats).map(([key, stats]) => {
    const universityMatchList = universityMatches[key];
    
    // Get recent completed matches (last 5) with detailed info (ONLY completed status)
    const recentCompleted = universityMatchList
      .filter(m => m.status === 'completed')
      .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(match => {
        const isTeam1 = match.team1 === stats.university;
        const opponent = isTeam1 ? match.team2 : match.team1;
        const score1 = match.score ? match.score.split(/[-/]/)[0] : '0';
        const score2 = match.score ? match.score.split(/[-/]/)[1] : '0';
        const won = isTeam1 ? parseInt(score1) > parseInt(score2) : parseInt(score2) > parseInt(score1);
        
        return {
          id: match.id,
          opponent: opponent,
          opponentUniversity: opponent,
          opponentZone: match.zone || 'LZ',
          result: won ? 'win' as const : 'loss' as const,
          score: match.score || 'N/A',
          sport: match.sport || 'Unknown',
          date: match.date || new Date().toISOString().split('T')[0],
          duration: match.duration || '90 min',
          venue: match.venue || 'Main Arena',
          highlights: match.highlights || []
        };
      });
    
    // Get live matches with detailed info (ONLY live status)
    const liveMatches = universityMatchList
      .filter(m => m.status === 'live')
      .map(match => {
        const isTeam1 = match.team1 === stats.university;
        const opponent = isTeam1 ? match.team2 : match.team1;
        
        return {
          id: match.id,
          opponent: opponent,
          opponentUniversity: opponent,
          opponentZone: match.zone || 'LZ',
          sport: match.sport || 'Unknown',
          status: 'live' as const,
          currentScore: match.score || '0-0',
          timeRemaining: match.timeRemaining || '45:00',
          period: match.period || '1st Half',
          venue: match.venue || 'Main Arena'
        };
      });
    
    // Get upcoming matches
    const upcomingMatches = universityMatchList
      .filter(m => m.status === 'scheduled')
      .slice(0, 3)
      .map(match => {
        const isTeam1 = match.team1 === stats.university;
        const opponent = isTeam1 ? match.team2 : match.team1;
        
        return {
          id: match.id,
          opponent: opponent,
          opponentUniversity: opponent,
          opponentZone: match.zone || 'LZ',
          sport: match.sport || 'Unknown',
          scheduledTime: match.date || 'TBD',
          venue: match.venue || 'Main Arena'
        };
      });
    
    // Calculate detailed statistics
    const totalMatches = universityMatchList.filter(m => m.status === 'completed').length;
    const winRate = totalMatches > 0 ? (stats.wins / totalMatches) * 100 : 0;
    const averageScore = stats.points / Math.max(totalMatches, 1);
    const currentStreak = Math.max(stats.wins, stats.losses);
    const streakType = stats.wins > stats.losses ? 'win' as const : 'loss' as const;
    
    return {
      id: key,
      rank: 0, // Will be set after sorting
      abbreviation: stats.university.split(' ').map(word => word[0]).join('').substring(0, 3),
      university: stats.university,
      zone: stats.zone,
      score: stats.points,
      wins: stats.wins,
      losses: stats.losses,
      change: 'same' as const,
      changeValue: 0,
      recentMatches: recentCompleted,
      liveMatches: liveMatches,
      upcomingMatches: upcomingMatches,
      statistics: {
        totalMatches,
        winRate: Math.round(winRate),
        averageScore: Math.round(averageScore * 10) / 10,
        bestPerformance: stats.wins > 0 ? `${stats.wins} wins` : 'No wins yet',
        currentStreak,
        streakType
      }
    };
  });
  
  // Sort by points (descending), then by wins (descending)
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.wins - a.wins;
  });
  
  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return entries;
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return (
        <div className="relative">
          <Crown className="h-6 w-6 text-yellow-400 drop-shadow-sm" />
          <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-sm"></div>
        </div>
      );
    case 2:
      return (
        <div className="relative">
          <Trophy className="h-5 w-5 text-slate-400 drop-shadow-sm" />
          <div className="absolute inset-0 bg-slate-400/20 rounded-full blur-sm"></div>
        </div>
      );
    case 3:
      return (
        <div className="relative">
          <Medal className="h-5 w-5 text-amber-600 drop-shadow-sm" />
          <div className="absolute inset-0 bg-amber-600/20 rounded-full blur-sm"></div>
        </div>
      );
    default:
      return (
        <div className="h-6 w-6 flex items-center justify-center text-sm font-bold text-slate-600 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full border border-slate-300/50">
          {rank}
        </div>
      );
  }
};

const getChangeIcon = (change: 'up' | 'down' | 'same') => {
  switch (change) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    case 'same':
      return <Minus className="h-4 w-4 text-slate-500" />;
  }
};

const getBadgeVariant = (badge: string) => {
  switch (badge) {
    case 'Champion':
      return 'default';
    case 'Expert':
      return 'secondary';
    case 'Pro':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getInitials = (name: string, abbreviation: string) => {
  return abbreviation;
};

const getZoneColor = (abbreviation: string) => {
  switch (abbreviation) {
    case 'LZ':
      return 'from-blue-500 to-blue-600';
    case 'SZ':
      return 'from-green-500 to-green-600';
    case 'CZ':
      return 'from-purple-500 to-purple-600';
    case 'NZ':
      return 'from-red-500 to-red-600';
    default:
      return 'from-slate-500 to-slate-600';
  }
};

const getZoneColorSolid = (abbreviation: string) => {
  switch (abbreviation) {
    case 'LZ':
      return 'bg-blue-500';
    case 'SZ':
      return 'bg-green-500';
    case 'CZ':
      return 'bg-purple-500';
    case 'NZ':
      return 'bg-red-500';
    default:
      return 'bg-slate-500';
  }
};

// Matches Tab Component
const MatchesTab = ({ matches, onMatchClick, displayEntries }: { matches: any[]; onMatchClick: any; displayEntries: LeaderboardEntry[] }) => {
  const liveMatches = matches.filter(m => m.status === 'live');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'upcoming');

  // Helper function to get match type badge
  const getMatchType = (match: any, index: number) => {
    if (match.status === 'live') return 'LIVE';
    if (match.status === 'completed') {
      if (index === 0) return 'FINAL';
      if (index === 1) return 'QUALIFIER 2';
      if (index === 2) return 'ELIMINATOR';
      return 'COMPLETED';
    }
    return 'UPCOMING';
  };

  // Helper function to get outcome text
  const getOutcomeText = (match: any) => {
    if (match.status === 'live') return 'LIVE MATCH';
    if (match.status === 'completed') {
      const winner = match.winner || match.team1;
      const margin = match.margin || '6 RUNS';
      return `${winner.toUpperCase()} WON BY ${margin} (WINNERS)`;
    }
    return 'SCHEDULED MATCH';
  };

  // Helper function to get team abbreviation
  const getTeamAbbr = (teamName: string) => {
    return teamName.split(' ').map(word => word[0]).join('').substring(0, 3);
  };

  // Helper function to get zone information
  const getZoneInfo = (match: any) => {
    // The match already has zone information added during loading
    const matchZone = match.zone || 'LZ';
    
    // For matches within the same zone, both teams are from the same zone
    // This is the correct behavior since matches are organized within zones
    const zone1 = matchZone;
    const zone2 = matchZone;
    
    return { zone1, zone2 };
  };

  // Helper function to get zone display name
  const getZoneDisplayName = (zone: string) => {
    const zoneMap: { [key: string]: string } = {
      'LZ': 'LONDON ZONE',
      'SZ': 'SOUTH ZONE', 
      'CZ': 'CENTRAL ZONE',
      'NZ': 'NORTH ZONE'
    };
    return zoneMap[zone] || zone;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return `${months[date.getMonth()]}, ${days[date.getDay()]} ${date.getDate()}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  };

  return (
    <div className="space-y-6">
      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-gray-900">LIVE MATCHES</h3>
          </div>
          <div className="space-y-4">
            {liveMatches.map((match, idx) => {
              const { zone1, zone2 } = getZoneInfo(match);
              return (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 relative">
                  {/* Vertical dashed line - Fixed positioning */}
                  <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-400"></div>
                  
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left Section - Match Type & Outcome */}
                    <div className="flex-1 max-w-xs pl-6 sm:pl-8">
                      <div className="mb-3">
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-semibold px-2 py-1 rounded">
                          {getMatchType(match, idx)}
                        </Badge>
                    </div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                        {getOutcomeText(match)}
                    </div>
                    </div>

                    {/* Right Section - Match Details */}
                    <div className="flex-1 max-w-2xl">
                      {/* Venue and Date */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-900">{match.venue || 'Main Arena'}</div>
                        <div className="text-xs text-gray-500">{formatDate(match.date)}</div>
                  </div>

                      {/* Team Scores - Responsive Layout */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                        {/* Team 1 */}
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {getTeamAbbr(match.team1 || match.university1)}
                  </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{match.team1 || match.university1}</div>
                            <div className="text-xs text-orange-600 font-semibold">{getZoneDisplayName(zone1)}</div>
                            <div className="text-lg font-bold text-gray-900">{match.currentScore || '0-0'}</div>
                            <div className="text-xs text-gray-500">(20.0 OV)</div>
                </div>
                  </div>

                        {/* VS Icon */}
                        <div className="flex justify-center sm:mx-4">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">V/s</span>
                          </div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center space-x-3 flex-1 sm:justify-end">
                          <div className="flex-1 sm:text-right">
                            <div className="text-sm font-medium text-gray-900">{match.team2 || match.university2}</div>
                            <div className="text-xs text-orange-600 font-semibold">{getZoneDisplayName(zone2)}</div>
                            <div className="text-lg font-bold text-gray-900">{match.currentScore || '0-0'}</div>
                            <div className="text-xs text-gray-500">(20.0 OV)</div>
                          </div>
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {getTeamAbbr(match.team2 || match.university2)}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Responsive */}
                      <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                        <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                          <Target className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                          <Play className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-700 transition-colors">
                    Match Centre
                  </button>
                </div>
              </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">RECENT RESULTS</h3>
          <div className="space-y-4">
            {completedMatches.slice(0, 5).map((match, idx) => {
              const { zone1, zone2 } = getZoneInfo(match);
              return (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 relative">
                  {/* Vertical dashed line - Fixed positioning */}
                  <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-400"></div>
                  
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left Section - Match Type & Outcome */}
                    <div className="flex-1 max-w-xs pl-6 sm:pl-8">
                      <div className="mb-3">
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-semibold px-2 py-1 rounded">
                          {getMatchType(match, idx)}
                        </Badge>
                    </div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                        {getOutcomeText(match)}
                    </div>
                    </div>

                    {/* Right Section - Match Details */}
                    <div className="flex-1 max-w-2xl">
                      {/* Venue and Date */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-900">{match.venue || 'Main Arena'}</div>
                        <div className="text-xs text-gray-500">{formatDate(match.date)}</div>
                  </div>

                      {/* Team Scores - Responsive Layout */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                        {/* Team 1 */}
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {getTeamAbbr(match.team1 || match.university1)}
                  </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{match.team1 || match.university1}</div>
                            <div className="text-xs text-orange-600 font-semibold">{getZoneDisplayName(zone1)}</div>
                            <div className="text-lg font-bold text-gray-900">{match.score || '0-0'}</div>
                            <div className="text-xs text-gray-500">(20.0 OV)</div>
                </div>
                  </div>

                        {/* VS Icon */}
                        <div className="flex justify-center sm:mx-4">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">V/s</span>
                          </div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center space-x-3 flex-1 sm:justify-end">
                          <div className="flex-1 sm:text-right">
                            <div className="text-sm font-medium text-gray-900">{match.team2 || match.university2}</div>
                            <div className="text-xs text-orange-600 font-semibold">{getZoneDisplayName(zone2)}</div>
                            <div className="text-lg font-bold text-gray-900">{match.score || '0-0'}</div>
                            <div className="text-xs text-gray-500">(20.0 OV)</div>
                          </div>
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {getTeamAbbr(match.team2 || match.university2)}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Responsive */}
                      <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                        <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                          <Target className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                          <Play className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-700 transition-colors">
                          Match Centre
                  </button>
                </div>
              </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">UPCOMING MATCHES</h3>
          <div className="space-y-4">
            {upcomingMatches.slice(0, 3).map((match, idx) => {
              const { zone1, zone2 } = getZoneInfo(match);
              return (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 relative">
                  {/* Vertical dashed line - Fixed positioning */}
                  <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-400"></div>
                  
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left Section - Match Type & Outcome */}
                    <div className="flex-1 max-w-xs pl-6 sm:pl-8">
                      <div className="mb-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold px-2 py-1 rounded">
                          {getMatchType(match, idx)}
                        </Badge>
                    </div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                        {getOutcomeText(match)}
                    </div>
                  </div>

                    {/* Right Section - Match Details */}
                    <div className="flex-1 max-w-2xl">
                      {/* Venue and Date */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-900">{match.venue || 'Main Arena'}</div>
                        <div className="text-xs text-gray-500">{formatDate(match.date)}</div>
                  </div>

                      {/* Team Scores - Responsive Layout */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                        {/* Team 1 */}
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {getTeamAbbr(match.team1 || match.university1)}
                </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{match.team1 || match.university1}</div>
                            <div className="text-xs text-orange-600 font-semibold">{getZoneDisplayName(zone1)}</div>
                            <div className="text-lg font-bold text-gray-400">TBD</div>
                            <div className="text-xs text-gray-500">(TBD)</div>
              </div>
                        </div>

                        {/* VS Icon */}
                        <div className="flex justify-center sm:mx-4">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">V/s</span>
                          </div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center space-x-3 flex-1 sm:justify-end">
                          <div className="flex-1 sm:text-right">
                            <div className="text-sm font-medium text-gray-900">{match.team2 || match.university2}</div>
                            <div className="text-xs text-orange-600 font-semibold">{getZoneDisplayName(zone2)}</div>
                            <div className="text-lg font-bold text-gray-400">TBD</div>
                            <div className="text-xs text-gray-500">(TBD)</div>
                          </div>
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {getTeamAbbr(match.team2 || match.university2)}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Responsive */}
                      <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                        <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                          <Target className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                          <Play className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-700 transition-colors">
                          Match Centre
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Points Table Tab Component
const PointsTableTab = ({ entries }: { entries: LeaderboardEntry[] }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">POINTS TABLE</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Won</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lost</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry, idx) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getRankIcon(entry.rank)}
                    <span className="ml-2 text-sm font-medium text-gray-900">{entry.rank}</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getZoneColor(entry.zone)} flex items-center justify-center text-white font-bold text-sm mr-3`}>
                      {entry.abbreviation}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{entry.university}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Badge variant="outline" className="text-xs">
                    {entry.zone === 'LZ' ? 'London Zone' : 
                     entry.zone === 'SZ' ? 'South Zone' : 
                     entry.zone === 'CZ' ? 'Central Zone' : 'North Zone'}
                  </Badge>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.wins + entry.losses}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{entry.wins}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{entry.losses}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-orange-600">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Playoffs Tab Component
const PlayoffsTab = ({ entries }: { entries: LeaderboardEntry[] }) => {
  const top4 = entries.slice(0, 4);
  
  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 text-center sm:text-left">PLAYOFFS</h3>
      
      {/* Semi-Finals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Semi-Final 1 */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <h4 className="text-base sm:text-lg font-semibold text-blue-800">SEMI-FINAL 1</h4>
          </div>
          <div className="space-y-3">
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getZoneColor(top4[0]?.zone)} flex items-center justify-center text-white font-bold text-sm`}>
                    {top4[0]?.abbreviation}
                  </div>
                  <span className="text-sm font-medium text-center">{top4[0]?.university}</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-500 text-sm font-semibold">vs</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getZoneColor(top4[3]?.zone)} flex items-center justify-center text-white font-bold text-sm`}>
                    {top4[3]?.abbreviation}
                  </div>
                  <span className="text-sm font-medium text-center">{top4[3]?.university}</span>
                </div>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getZoneColor(top4[0]?.zone)} flex items-center justify-center text-white font-bold text-sm`}>
                  {top4[0]?.abbreviation}
                </div>
                <span className="text-sm font-medium truncate">{top4[0]?.university}</span>
              </div>
              <span className="text-gray-500 mx-4">vs</span>
              <div className="flex items-center space-x-3 flex-1 justify-end">
                <span className="text-sm font-medium truncate">{top4[3]?.university}</span>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getZoneColor(top4[3]?.zone)} flex items-center justify-center text-white font-bold text-sm`}>
                  {top4[3]?.abbreviation}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Badge variant="outline" className="text-xs">TBD</Badge>
            </div>
          </div>
        </div>

        {/* Semi-Final 2 */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <h4 className="text-base sm:text-lg font-semibold text-green-800">SEMI-FINAL 2</h4>
          </div>
          <div className="space-y-3">
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getZoneColor(top4[1]?.zone)} flex items-center justify-center text-white font-bold text-sm`}>
                    {top4[1]?.abbreviation}
                  </div>
                  <span className="text-sm font-medium text-center">{top4[1]?.university}</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-500 text-sm font-semibold">vs</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getZoneColor(top4[2]?.zone)} flex items-center justify-center text-white font-bold text-sm`}>
                    {top4[2]?.abbreviation}
                  </div>
                  <span className="text-sm font-medium text-center">{top4[2]?.university}</span>
                </div>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getZoneColor(top4[1]?.zone)} flex items-center justify-center text-white font-bold text-sm`}>
                  {top4[1]?.abbreviation}
                </div>
                <span className="text-sm font-medium truncate">{top4[1]?.university}</span>
              </div>
              <span className="text-gray-500 mx-4">vs</span>
              <div className="flex items-center space-x-3 flex-1 justify-end">
                <span className="text-sm font-medium truncate">{top4[2]?.university}</span>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getZoneColor(top4[2]?.zone)} flex items-center justify-center text-white font-bold text-sm`}>
                  {top4[2]?.abbreviation}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Badge variant="outline" className="text-xs">TBD</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Final */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
          <h4 className="text-lg sm:text-xl font-bold text-yellow-800">FINAL</h4>
        </div>
        <div className="text-center">
          <div className="text-gray-500 mb-4 text-sm sm:text-base">
            <span className="block sm:inline">Winner of Semi-Final 1</span>
            <span className="hidden sm:inline"> vs </span>
            <span className="block sm:inline">Winner of Semi-Final 2</span>
          </div>
          <Badge variant="outline" className="text-sm">TBD</Badge>
        </div>
      </div>
    </div>
  );
};

// Detailed Match Modal Component
const MatchDetailsModal = ({ match, isOpen, onClose }: { match: MatchDetails | null; isOpen: boolean; onClose: () => void }) => {
  if (!match || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{match.sport} Match</h2>
              <p className="text-orange-100">{match.venue} • {match.date}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-200 transition-colors"
            >
              <Square className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Match Score */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{match.homeTeam}</div>
              <div className="text-sm text-gray-500">Home</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">
                {match.status === 'live' ? match.currentScore : match.finalScore}
              </div>
              {match.status === 'live' && (
                <div className="flex items-center space-x-2 text-red-600 mt-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">LIVE</span>
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{match.awayTeam}</div>
              <div className="text-sm text-gray-500">Away</div>
            </div>
          </div>
          
          {match.status === 'live' && (
            <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Timer className="h-4 w-4" />
                <span>{match.timeRemaining} remaining</span>
              </div>
              <div className="flex items-center space-x-1">
                <Play className="h-4 w-4" />
                <span>{match.period}</span>
              </div>
            </div>
          )}
        </div>

        {/* Match Details Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Players */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Players</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{match.homeTeam}</h4>
                  <div className="space-y-1">
                    {match.players.home.map((player, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">{player}</span>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{match.awayTeam}</h4>
                  <div className="space-y-1">
                    {match.players.away.map((player, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">{player}</span>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Substitutions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Substitutions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{match.homeTeam}</h4>
                  <div className="space-y-1">
                    {match.substitutions.home.length > 0 ? (
                      match.substitutions.home.map((sub, idx) => (
                        <div key={idx} className="text-sm text-gray-600">{sub}</div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No substitutions</div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{match.awayTeam}</h4>
                  <div className="space-y-1">
                    {match.substitutions.away.length > 0 ? (
                      match.substitutions.away.map((sub, idx) => (
                        <div key={idx} className="text-sm text-gray-600">{sub}</div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No substitutions</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Match Events */}
          {match.events.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Events</h3>
              <div className="space-y-2">
                {match.events.map((event, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">{event.time}</div>
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'goal' ? 'bg-green-500' :
                      event.type === 'card' ? 'bg-yellow-500' :
                      event.type === 'penalty' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{event.player}</span>
                      <span className="text-sm text-gray-600 ml-2">{event.description}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.team === 'home' ? match.homeTeam : match.awayTeam}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function Leaderboard({
  title = 'NHSF (UK) Dharmic Games',
  subtitle = 'Live Zone Leaderboard',
  entries = defaultEntries,
  showChange = true,
  showBadges = false
}: LeaderboardProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'points' | 'playoffs'>('matches');
  const [filterGender, setFilterGender] = useState('ALL');
  const [filterZone, setFilterZone] = useState('ALL ZONES');
  const [filterSport, setFilterSport] = useState('ALL SPORTS');

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load matches from Firebase zones
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        
        // Get all zones first
        const zonesResult = await realtimeDbUtils.getData('zones');
        if (!zonesResult.success || !zonesResult.data) {
          setMatches([]);
          setLeaderboardEntries([]);
          return;
        }
        
        const zones = Object.keys(zonesResult.data);
        const allMatches: any[] = [];
        const universitiesWithSports: { [zone: string]: any[] } = {};
        
        // Load matches and universities from each zone
        for (const zone of zones) {
          // Load matches
          const zoneMatchesResult = await realtimeDbUtils.getData(`zones/${zone}/matches`);
          if (zoneMatchesResult.success && zoneMatchesResult.data) {
            const zoneMatches = Array.isArray(zoneMatchesResult.data) 
              ? zoneMatchesResult.data 
              : Object.entries(zoneMatchesResult.data).map(([id, match]: [string, any]) => ({ id, ...match }));
            
            // Add zone information to each match
            const matchesWithZone = zoneMatches.map((match: any) => ({
              ...match,
              zone: zone
            }));
            
            allMatches.push(...matchesWithZone);
          }
          
          // Load universities with sports data
          const universitiesResult = await realtimeDbUtils.getData(`zones/${zone}/universities`);
          if (universitiesResult.success && universitiesResult.data) {
            const universities = Array.isArray(universitiesResult.data) 
              ? universitiesResult.data 
              : Object.entries(universitiesResult.data).map(([id, university]: [string, any]) => ({ id, ...university }));
            
            // Only include universities that have sports assigned
            universitiesWithSports[zone] = universities.filter(uni => 
              uni.sports && uni.sports.length > 0
            );
          }
        }
        
        setMatches(allMatches);
        setLeaderboardEntries(calculateLeaderboard(allMatches, universitiesWithSports));
      } catch (error) {
        console.error('Error loading matches for leaderboard:', error);
        setMatches([]);
        setLeaderboardEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();

    // Set up real-time listener for all zones
    const unsubscribes: (() => void)[] = [];
    
    const setupZoneListeners = async () => {
      const zonesResult = await realtimeDbUtils.getData('zones');
      if (zonesResult.success && zonesResult.data) {
        const zones = Object.keys(zonesResult.data);
        
        zones.forEach(zone => {
          const unsubscribe = realtimeDbUtils.listenToData(`zones/${zone}/matches`, (data) => {
            // Reload all matches when any zone updates
            loadMatches();
          });
          if (unsubscribe) {
            unsubscribes.push(unsubscribe);
          }
        });
      }
    };
    
    setupZoneListeners();

    return () => {
      unsubscribes.forEach(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, []);

  // Use calculated entries if available, otherwise use passed entries
  const displayEntries = leaderboardEntries.length > 0 ? leaderboardEntries : entries;

  // Function to handle match card clicks
  const handleMatchClick = (match: any, entry: LeaderboardEntry, type: 'live' | 'recent') => {
    // Create detailed match data
    const matchDetails: MatchDetails = {
      id: match.id,
      homeTeam: entry.university,
      awayTeam: match.opponentUniversity,
      sport: match.sport,
      status: type === 'live' ? 'live' : 'completed',
      currentScore: match.currentScore || '0-0',
      finalScore: match.score || '0-0',
      timeRemaining: match.timeRemaining || '45:00',
      period: match.period || '1st Half',
      venue: match.venue || 'Main Arena',
      date: match.date || new Date().toISOString().split('T')[0],
      duration: match.duration || '90 min',
      players: {
        home: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'],
        away: ['Player A', 'Player B', 'Player C', 'Player D', 'Player E']
      },
      substitutions: {
        home: ['Sub 1', 'Sub 2'],
        away: ['Sub A', 'Sub B']
      },
      events: [
        {
          time: '15:30',
          type: 'goal',
          player: 'Player 1',
          team: 'home',
          description: 'Goal scored'
        },
        {
          time: '28:45',
          type: 'substitution',
          player: 'Player 2',
          team: 'home',
          description: 'Substituted'
        },
        {
          time: '42:10',
          type: 'card',
          player: 'Player A',
          team: 'away',
          description: 'Yellow card'
        }
      ]
    };
    
    setSelectedMatch(matchDetails);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto max-w-7xl">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
              {title}
            </h1>
            <p className="text-lg text-gray-600 mb-4">{subtitle}</p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Activity className="h-4 w-4 text-orange-500" />
                <span>Live Updates</span>
                </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-red-500" />
                <span>{mounted && currentTime ? currentTime.toLocaleTimeString() : 'Loading...'}</span>
              </div>
                  </div>
                  </div>

          {/* Main Content Card */}
          <Card className="bg-white border-0 shadow-xl shadow-slate-200/50 overflow-hidden rounded-2xl">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white">
              <div className="flex border-b border-orange-500">
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                    activeTab === 'matches' 
                      ? 'bg-white text-orange-600 border-b-2 border-orange-600' 
                      : 'text-white hover:bg-orange-500'
                  }`}
                >
                  MATCHES
                </button>
                <button
                  onClick={() => setActiveTab('points')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                    activeTab === 'points' 
                      ? 'bg-white text-orange-600 border-b-2 border-orange-600' 
                      : 'text-white hover:bg-orange-500'
                  }`}
                >
                  POINTS TABLE
                </button>
                <button
                  onClick={() => setActiveTab('playoffs')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                    activeTab === 'playoffs' 
                      ? 'bg-white text-orange-600 border-b-2 border-orange-600' 
                      : 'text-white hover:bg-orange-500'
                  }`}
                >
                  PLAYOFFS
                </button>
                        </div>
                      </div>
                      
            {/* Filter Bar */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex flex-wrap gap-4 items-center">
                                    <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                <select 
                  value={filterGender} 
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ALL">ALL</option>
                  <option value="MEN">MEN</option>
                  <option value="WOMEN">WOMEN</option>
                </select>
                <select 
                  value={filterZone} 
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ALL ZONES">ALL ZONES</option>
                  <option value="NZ+CZ">NORTH & CENTRAL ZONE (Nov 22)</option>
                  <option value="LZ+SZ">LONDON & SOUTH ZONE (Nov 23)</option>
                </select>
                <select 
                  value={filterSport} 
                  onChange={(e) => setFilterSport(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ALL SPORTS">ALL SPORTS</option>
                  <option value="Football">Football</option>
                  <option value="Netball">Netball</option>
                  <option value="Kabaddi">Kabaddi</option>
                  <option value="Kho kho">Kho kho</option>
                  <option value="Badminton">Badminton</option>
                </select>
                                    </div>
                                    </div>
            {/* Tab Content */}
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-6"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-orange-600 animate-pulse" />
                                  </div>
                                </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading...</h3>
                  <p className="text-gray-500">Fetching real-time data</p>
                              </div>
              ) : (
                <div className="p-6">
                  {activeTab === 'matches' && (
                    <MatchesTab 
                      matches={matches} 
                      onMatchClick={handleMatchClick}
                      displayEntries={displayEntries}
                    />
                  )}
                  {activeTab === 'points' && (
                    <PointsTableTab 
                      entries={displayEntries}
                    />
                  )}
                  {activeTab === 'playoffs' && (
                    <PlayoffsTab 
                      entries={displayEntries}
                    />
                  )}
                          </div>
                        )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Match Details Modal */}
      <MatchDetailsModal 
        match={selectedMatch} 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </section>
  );
}
