"use client";

import React, { useEffect, useState, useRef } from 'react';
import { realtimeResultsService, LiveMatch, LiveLeaderboard, LiveGameState } from '@/lib/realtime-results';
import { useNotifications } from '@/hooks/use-notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Play,
  Pause,
  Square,
  Clock,
  Users,
  Target,
  Zap
} from 'lucide-react';

interface RealtimeResultsProps {
  zone?: string;
  showLiveMatches?: boolean;
  showLeaderboard?: boolean;
  showAnalytics?: boolean;
}

export function RealtimeResults({ 
  zone, 
  showLiveMatches = true, 
  showLeaderboard = true, 
  showAnalytics = true 
}: RealtimeResultsProps) {
  const [liveMatches, setLiveMatches] = useState<{ [matchId: string]: LiveMatch }>({});
  const [leaderboard, setLeaderboard] = useState<LiveLeaderboard>({});
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  const previousMatches = useRef<{ [matchId: string]: LiveMatch }>({});

  useEffect(() => {
    const setupRealtimeListeners = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, sync live matches from zones to global collection
        if (showLiveMatches) {
          await realtimeResultsService.syncLiveMatchesFromZones();
          
          // Then listen to live matches
          const unsubscribeMatches = realtimeResultsService.listenToLiveMatches((matches) => {
            const currentMatches = matches || {};
            setLiveMatches(currentMatches);
            
            // Check for match events and send notifications
            checkForMatchEvents(previousMatches.current, currentMatches);
            previousMatches.current = currentMatches;
          });
        }

        // Listen to live leaderboard
        if (showLeaderboard) {
          const unsubscribeLeaderboard = realtimeResultsService.listenToLiveLeaderboard((leaderboardData) => {
            setLeaderboard(leaderboardData || {});
          });
        }

        // Load initial analytics
        if (showAnalytics) {
          realtimeResultsService.getLiveAnalytics().then((data) => {
            setAnalytics(data);
          });
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to connect to real-time database');
        setLoading(false);
      }
    };

    setupRealtimeListeners();
  }, [showLiveMatches, showLeaderboard, showAnalytics]);

  // Function to check for match events and send notifications
  const checkForMatchEvents = (previousMatches: { [matchId: string]: LiveMatch }, currentMatches: { [matchId: string]: LiveMatch }) => {
    // Check for new matches starting
    Object.keys(currentMatches).forEach(matchId => {
      const currentMatch = currentMatches[matchId];
      const previousMatch = previousMatches[matchId];
      
      if (!previousMatch && currentMatch.status === 'live') {
        // New match started
        addNotification({
          type: 'match_start',
          title: '🏆 Match Started!',
          message: `${currentMatch.team1} vs ${currentMatch.team2} - ${currentMatch.sport}`,
          universityId: currentMatch.team1,
          tournament: currentMatch.zone || 'NHSF (UK) (UK) Dharmic Games'
        });
      }
      
      // Check for score updates
      if (previousMatch && currentMatch.status === 'live' && previousMatch.status === 'live') {
        if (previousMatch.score !== currentMatch.score) {
          addNotification({
            type: 'score_update',
            title: '⚽ Score Update!',
            message: `${currentMatch.team1} ${currentMatch.score} ${currentMatch.team2}`,
            universityId: currentMatch.team1,
            tournament: currentMatch.zone || 'NHSF (UK) (UK) Dharmic Games'
          });
        }
      }
      
      // Check for match ending
      if (previousMatch && previousMatch.status === 'live' && currentMatch.status === 'completed') {
        addNotification({
          type: 'match_end',
          title: '🏁 Match Finished!',
          message: `${currentMatch.team1} vs ${currentMatch.team2} - Final Score: ${currentMatch.score}`,
          universityId: currentMatch.team1,
          tournament: currentMatch.zone || 'NHSF (UK) (UK) Dharmic Games'
        });
      }
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-600">#{rank}</span>;
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMatchStatus = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline" className="text-yellow-600">Waiting</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-500">Live</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <span>Connecting to Real-time Database...</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
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
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Connection Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Matches */}
      {showLiveMatches && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-green-500" />
              <span>Live Matches</span>
              <Badge variant="outline" className="ml-auto">
                {Object.keys(liveMatches).length} Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(liveMatches).map(([matchId, match]) => (
                <div
                  key={matchId}
                  className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getZoneColor(match.university1.zone)}`}></div>
                      <span className="font-semibold">{match.university1.university}</span>
                      <span className="text-gray-500">vs</span>
                      <span className="font-semibold">{match.university2.university}</span>
                      <div className={`w-3 h-3 rounded-full ${getZoneColor(match.university2.zone)}`}></div>
                    </div>
                    {getMatchStatus(match.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">{match.university1.university}</p>
                      <p className="text-2xl font-bold text-blue-600">{match.university1.score}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">{match.university2.university}</p>
                      <p className="text-2xl font-bold text-red-600">{match.university2.score}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span>Round {match.round}/{match.totalRounds}</span>
                    <span>Started: {formatTime(match.startTime)}</span>
                  </div>
                </div>
              ))}
              
              {Object.keys(liveMatches).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No live matches at the moment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Leaderboard */}
      {showLeaderboard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Live Leaderboard</span>
              <Badge variant="outline" className="ml-auto">
                Real-time
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(leaderboard).map(([zone, zoneData]) => (
                <div key={zone} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{zone} Zone</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Total Score: {zoneData.totalScore}</span>
                      <span>Wins: {zoneData.totalWins}</span>
                      <span>Losses: {zoneData.totalLosses}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(zoneData.universities)
                      .sort(([,a], [,b]) => b.score - a.score)
                      .slice(0, 5)
                      .map(([universityId, university]) => (
                        <div key={universityId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            {getRankIcon(university.rank)}
                            <span className="font-medium">{university.university}</span>
                            <div className="flex items-center space-x-1">
                              {getChangeIcon(university.change)}
                              <span className={`text-sm ${
                                university.change === 'up' ? 'text-green-600' :
                                university.change === 'down' ? 'text-red-500' :
                                'text-gray-500'
                              }`}>
                                {university.changeValue}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="font-bold text-orange-600">{university.score}</span>
                            <span className="text-green-600">{university.wins}W</span>
                            <span className="text-red-600">{university.losses}L</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Analytics */}
      {showAnalytics && analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span>Live Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">
                  {Object.keys(analytics.leaderboard || {}).length}
                </p>
                <p className="text-sm text-gray-600">Active Zones</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Play className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {Object.keys(analytics.matches || {}).length}
                </p>
                <p className="text-sm text-gray-600">Live Matches</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">
                  {new Date().toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-600">Last Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
