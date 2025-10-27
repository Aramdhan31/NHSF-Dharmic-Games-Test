"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Users, Target, Wifi, WifiOff, RefreshCw, Play, Pause, Square } from 'lucide-react';
import { ref, onValue, set, update } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

interface LiveMatch {
  id: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  sport: string;
  zone: string;
  status: 'scheduled' | 'live' | 'completed' | 'paused';
  startTime?: number;
  endTime?: number;
  lastUpdated: number;
  adminNotes?: string;
}

interface FlexibleLiveResultsProps {
  zone?: string;
  showControls?: boolean;
}

export function FlexibleLiveResults({ zone = 'all', showControls = true }: FlexibleLiveResultsProps) {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    console.log('🔄 Setting up flexible live results for zone:', zone);
    setupRealtimeListeners();
  }, [zone]);

  const setupRealtimeListeners = () => {
    try {
      setLoading(true);
      setError(null);

      // Listen to matches data
      const matchesRef = ref(realtimeDb, 'matches');
      const unsubscribe = onValue(matchesRef, (snapshot) => {
        if (snapshot.exists()) {
          const matchesData = snapshot.val();
          const matchesList = Object.entries(matchesData).map(([id, match]: [string, any]) => ({
            id,
            ...match,
            // Normalize field names - handle both team1/team2 and teamA/teamB
            teamA: match.teamA || match.team1 || 'Team A',
            teamB: match.teamB || match.team2 || 'Team B',
            scoreA: match.scoreA || match.score1 || 0,
            scoreB: match.scoreB || match.score2 || 0,
            lastUpdated: match.lastUpdated || Date.now()
          }));

          // Filter out dummy football matches and by zone
          const filteredMatches = matchesList
            .filter(match => {
              // Skip dummy football matches
              if (match.sport === 'Football' && 
                  (!match.teamA || !match.teamB || 
                   match.teamA === 'VS' || match.teamB === 'VS' ||
                   match.teamA === '' || match.teamB === '' ||
                   match.teamA === 'Team 1' || match.teamB === 'Team 2' ||
                   match.teamA === 'Team A' || match.teamB === 'Team B')) {
                console.log('🚫 Filtering out dummy football match:', match);
                return false;
              }
              return true;
            })
            .filter(match => zone === 'all' || match.zone === zone);

          setMatches(filteredMatches);
          setLastUpdated(new Date());
          setIsLive(true);
          
          console.log('📊 Live matches updated:', {
            total: matchesList.length,
            filtered: filteredMatches.length,
            zone: zone
          });
        } else {
          console.log('📊 No matches found in Firebase');
          setMatches([]);
          setIsLive(false);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('❌ Error setting up live results:', err);
      setError('Failed to connect to live results');
      setLoading(false);
      return () => {};
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 text-white animate-pulse">🔴 LIVE</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white">✅ COMPLETED</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500 text-white">⏸️ PAUSED</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 text-white">📅 SCHEDULED</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">❓ UNKNOWN</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <Square className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getMatchDuration = (startTime: number, endTime?: number) => {
    const end = endTime || Date.now();
    const duration = Math.floor((end - startTime) / 1000 / 60); // minutes
    return `${duration}m`;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Live Results...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-gray-600">Connecting to live results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <WifiOff className="h-5 w-5" />
            Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <WifiOff className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-gray-500" />
            )}
            Live Results
            {isLive && <Badge className="bg-green-500 text-white animate-pulse">LIVE</Badge>}
          </div>
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Live Matches</h3>
            <p className="text-gray-500">
              {zone === 'all' 
                ? 'No matches are currently live across all zones.'
                : `No matches are currently live in ${zone} zone.`
              }
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Matches will appear here when admins start them or update scores.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  match.status === 'live' 
                    ? 'border-red-200 bg-red-50 animate-pulse' 
                    : match.status === 'completed'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(match.status)}
                    <span className="font-semibold text-lg">{match.sport}</span>
                    <span className="text-sm text-gray-500">({match.zone})</span>
                  </div>
                  {getStatusBadge(match.status)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Team A */}
                  <div className="text-center">
                    <div className="font-semibold text-lg mb-1">{match.teamA}</div>
                    <div className="text-3xl font-bold text-orange-600">{match.scoreA}</div>
                  </div>

                  {/* VS */}
                  <div className="flex items-center justify-center">
                    <div className="text-2xl font-bold text-gray-400">VS</div>
                  </div>

                  {/* Team B */}
                  <div className="text-center">
                    <div className="font-semibold text-lg mb-1">{match.teamB}</div>
                    <div className="text-3xl font-bold text-orange-600">{match.scoreB}</div>
                  </div>
                </div>

                {/* Match Info */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <div>
                      {match.status === 'live' && match.startTime && (
                        <span>Duration: {getMatchDuration(match.startTime)}</span>
                      )}
                      {match.status === 'completed' && match.startTime && match.endTime && (
                        <span>Duration: {getMatchDuration(match.startTime, match.endTime)}</span>
                      )}
                    </div>
                    <div>
                      Updated: {formatTime(match.lastUpdated)}
                    </div>
                  </div>
                  
                  {match.adminNotes && (
                    <div className="mt-2 p-2 bg-yellow-100 rounded text-sm">
                      <strong>Admin Note:</strong> {match.adminNotes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isLive ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Connected to live results</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-500">No live data</span>
                </>
              )}
            </div>
            <div className="text-gray-500">
              {matches.length} match{matches.length !== 1 ? 'es' : ''} found
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
