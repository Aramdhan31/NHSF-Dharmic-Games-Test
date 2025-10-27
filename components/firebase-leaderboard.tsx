"use client";

import React, { useEffect, useState } from 'react';
import { leaderboardService, LeaderboardEntry } from '@/lib/firebase-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FirebaseLeaderboardProps {
  zone?: string;
  realtime?: boolean;
}

export function FirebaseLeaderboard({ zone, realtime = true }: FirebaseLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        if (zone) {
          // Load zone-specific leaderboard
          const result = await leaderboardService.getZoneLeaderboard(zone);
          if (result.success) {
            setEntries(result.data);
          } else {
            setError(result.error || 'Failed to load leaderboard');
          }
        } else {
          // Load global leaderboard
          const result = await leaderboardService.getLeaderboard();
          if (result.success) {
            setEntries(result.data);
          } else {
            setError(result.error || 'Failed to load leaderboard');
          }
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();

    // Set up real-time listener if enabled
    if (realtime) {
      const unsubscribe = leaderboardService.listenToLeaderboard((newEntries) => {
        setEntries(newEntries);
      });

      return () => unsubscribe();
    }
  }, [zone, realtime]);

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

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading Leaderboard...</CardTitle>
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <span>
            {zone ? `${zone} Zone Leaderboard` : 'Global Leaderboard'}
          </span>
          {realtime && (
            <Badge variant="outline" className="ml-auto">
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-white'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className={`w-3 h-3 rounded-full ${getZoneColor(entry.zone)}`}></div>
                
                <div>
                  <h3 className="font-semibold text-lg">{entry.name}</h3>
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
      </CardContent>
    </Card>
  );
}
