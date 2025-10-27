'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Activity, Clock, Target } from 'lucide-react';

interface Match {
  id: string;
  sport: string;
  team1: string;
  team2: string;
  team1Score: number;
  team2Score: number;
  status: 'scheduled' | 'live' | 'completed';
  startTime?: string;
  endTime?: string;
  updatedAt: number;
}

export function LiveScores() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadMatches();
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(loadMatches, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMatches = async () => {
    try {
      console.log('🔄 Loading matches from API...');
      const response = await fetch('/api/matches');
      const result = await response.json();
      
      console.log('📊 API Response:', result);
      
      if (result.success) {
        const matchesData = result.matches || [];
        
        // Filter out dummy football matches
        const filteredMatches = matchesData.filter((match: any) => {
          // Skip dummy football matches
          if (match.sport === 'Football' && 
              (!match.team1 || !match.team2 || 
               match.team1 === 'VS' || match.team2 === 'VS' ||
               match.team1 === '' || match.team2 === '' ||
               match.team1 === 'Team 1' || match.team2 === 'Team 2')) {
            console.log('🚫 Filtering out dummy football match:', match);
            return false;
          }
          return true;
        });
        
        console.log('🏆 Matches loaded:', filteredMatches.length, '(filtered from', matchesData.length, ')');
        setMatches(filteredMatches);
        setLastUpdated(new Date());
      } else {
        console.error('❌ API Error:', result.error);
        setMatches([]);
      }
    } catch (error) {
      console.error('❌ Failed to load matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'live':
        return <Badge className="bg-red-100 text-red-800 animate-pulse">LIVE</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const liveMatches = matches.filter(match => match.status === 'live');
  const completedMatches = matches.filter(match => match.status === 'completed');
  const scheduledMatches = matches.filter(match => match.status === 'scheduled');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2">Loading scores...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Live Scores</h2>
        <p className="text-gray-600">Real-time updates from NHSF Dharmic Games</p>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-red-600 animate-pulse" />
            <h3 className="text-xl font-semibold text-gray-900">Live Matches</h3>
          </div>
          
          <div className="grid gap-4">
            {liveMatches.map((match) => (
              <Card key={match.id} className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Trophy className="h-5 w-5 text-orange-600" />
                      <div>
                        <h4 className="font-semibold text-lg">{match.sport}</h4>
                        <p className="text-sm text-gray-600">
                          {match.team1} vs {match.team2}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>

                  {/* Live Score Display */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border-2 border-red-200">
                      <p className="text-3xl font-bold text-red-600">{match.team1Score}</p>
                      <p className="text-sm text-gray-600 font-medium">{match.team1}</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border-2 border-red-200">
                      <p className="text-3xl font-bold text-red-600">{match.team2Score}</p>
                      <p className="text-sm text-gray-600 font-medium">{match.team2}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Recent Results</h3>
          </div>
          
          <div className="grid gap-3">
            {completedMatches.slice(0, 5).map((match) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Trophy className="h-4 w-4 text-orange-600" />
                      <div>
                        <h4 className="font-semibold">{match.sport}</h4>
                        <p className="text-sm text-gray-600">
                          {match.team1} vs {match.team2}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{match.team1Score}</p>
                        <p className="text-xs text-gray-500">{match.team1}</p>
                      </div>
                      <div className="text-gray-400">-</div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{match.team2Score}</p>
                        <p className="text-xs text-gray-500">{match.team2}</p>
                      </div>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Matches */}
      {scheduledMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Upcoming Matches</h3>
          </div>
          
          <div className="grid gap-3">
            {scheduledMatches.slice(0, 3).map((match) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Trophy className="h-4 w-4 text-orange-600" />
                      <div>
                        <h4 className="font-semibold">{match.sport}</h4>
                        <p className="text-sm text-gray-600">
                          {match.team1} vs {match.team2}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Matches */}
      {matches.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Yet</h3>
            <p className="text-gray-600 mb-2">Matches haven't been scheduled yet.</p>
            <p className="text-sm text-gray-500">Live scores will appear here once matches begin.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
