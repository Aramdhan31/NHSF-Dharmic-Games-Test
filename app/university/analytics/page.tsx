'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { BarChart3, TrendingUp, Trophy, Users, Target, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { useFirebase } from '@/lib/firebase-context';
import { ref, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export default function UniversityAnalytics() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useFirebase();
  const [mounted, setMounted] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, authLoading, router]);

  useEffect(() => {
    if (mounted && firebaseUser) {
      loadAnalytics();
    }
  }, [mounted, firebaseUser]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load university-specific analytics from Firebase
      const universitiesRef = ref(realtimeDb, 'universities');
      const snapshot = await get(universitiesRef);
      
      if (snapshot.exists()) {
        const universitiesData = snapshot.val();
        
        // Find the current university
        const universityData = Object.values(universitiesData).find((uni: any) => 
          uni.email === firebaseUser?.email || uni.contactPerson === firebaseUser?.email
        );
        
        if (universityData) {
          // Calculate analytics from university's matches
          const matches = universityData.matches || [];
          const wins = matches.filter((match: any) => match.winner === universityData.name).length;
          const losses = matches.filter((match: any) => 
            match.winner && match.winner !== universityData.name && 
            (match.team1 === universityData.name || match.team2 === universityData.name)
          ).length;
          
          const analyticsData = {
            totalWins: wins,
            totalLosses: losses,
            winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
            totalPoints: wins * 3, // 3 points per win
            topSport: 'TBD', // Will be calculated from player data
            recentPerformance: [], // Will be calculated from match dates
            sportBreakdown: [] // Will be calculated from player sports
          };
          
          setAnalytics(analyticsData);
        } else {
          // Default empty analytics
          setAnalytics({
            totalWins: 0,
            totalLosses: 0,
            winRate: 0,
            totalPoints: 0,
            topSport: 'No data',
            recentPerformance: [],
            sportBreakdown: []
          });
        }
      } else {
        // No data available
        setAnalytics({
          totalWins: 0,
          totalLosses: 0,
          winRate: 0,
          totalPoints: 0,
          topSport: 'No data',
          recentPerformance: [],
          sportBreakdown: []
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to empty analytics
      setAnalytics({
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        totalPoints: 0,
        topSport: 'No data',
        recentPerformance: [],
        sportBreakdown: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your university's sports performance and statistics</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Trophy className="h-8 w-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Wins</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics?.totalWins || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-red-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Losses</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics?.totalLosses || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Win Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics?.winRate || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Points</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics?.totalPoints || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                    <span>Recent Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.recentPerformance?.map((month: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{month.month}</span>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600">{month.wins} wins</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-red-600">{month.losses} losses</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span>Sport Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.sportBreakdown?.map((sport: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">{sport.sport}</span>
                          <span className="text-sm font-bold text-gray-900">{sport.winRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${sport.winRate}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{sport.wins} wins</span>
                          <span>{sport.losses} losses</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-orange-500" />
                  <span>Top Performing Sport</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Trophy className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{analytics?.topSport}</h3>
                  <p className="text-gray-600">Your best performing sport this season</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
