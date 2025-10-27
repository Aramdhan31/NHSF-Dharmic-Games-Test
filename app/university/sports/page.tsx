'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Trophy, Plus, Target, Users, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { useFirebase } from '@/lib/firebase-context';
import { ref, get, update } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export default function UniversitySports() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useFirebase();
  const [mounted, setMounted] = useState(false);
  const [sports, setSports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSportsManagement, setShowSportsManagement] = useState(false);
  const [universitySports, setUniversitySports] = useState<string[]>([]);
  const [university, setUniversity] = useState<any>(null);

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
      loadSports();
    }
  }, [mounted, firebaseUser]);

  const loadSports = async () => {
    try {
      setLoading(true);
      
      // Load real sports data from Firebase
      const universitiesRef = ref(realtimeDb, 'universities');
      const snapshot = await get(universitiesRef);
      
      if (snapshot.exists()) {
        const universitiesData = snapshot.val();
        
        // Find the current university
        const universityData = Object.values(universitiesData).find((uni: any) => 
          uni.email === firebaseUser?.email || uni.contactPerson === firebaseUser?.email
        );
        
        if (universityData) {
          setUniversity(universityData);
          
          // Load university's registered sports
          setUniversitySports(universityData.sports || []);
          
          // Extract sports from players data
          const playersData = universityData.players || {};
          let playersList = [];
          if (Array.isArray(playersData)) {
            playersList = playersData;
          } else if (typeof playersData === 'object') {
            playersList = Object.values(playersData).flat();
          }
          
          // Get unique sports and calculate stats for each
          const uniqueSports = [...new Set(playersList.map(player => player.sport).filter(Boolean))];
          const sportsWithStats = uniqueSports.map(sport => {
            const sportPlayers = playersList.filter(player => player.sport === sport);
            return {
              id: sport,
              name: sport,
              players: sportPlayers.length,
              matches: 0, // Will be calculated from matches data
              wins: 0, // Will be calculated from matches data
              losses: 0, // Will be calculated from matches data
              status: 'active'
            };
          });
          
          setSports(sportsWithStats);
        } else {
          setSports([]);
        }
      } else {
        setSports([]);
      }
    } catch (error) {
      console.error('Error loading sports:', error);
      setSports([]);
    } finally {
      setLoading(false);
    }
  };

  // Sports Management Functions
  const handleAddSport = async (sport: string) => {
    try {
      if (!university) return;
      
      const universityRef = ref(realtimeDb, `universities/${university.id}`);
      const currentSports = universitySports || [];
      
      if (!currentSports.includes(sport)) {
        const updatedSports = [...currentSports, sport];
        await update(universityRef, { 
          sports: updatedSports,
          updatedAt: new Date().toISOString()
        });
        
        setUniversitySports(updatedSports);
        console.log(`✅ Added ${sport} to university`);
      }
    } catch (error) {
      console.error('Error adding sport:', error);
    }
  };

  const handleRemoveSport = async (sport: string) => {
    try {
      if (!university) return;
      
      const universityRef = ref(realtimeDb, `universities/${university.id}`);
      const currentSports = universitySports || [];
      const updatedSports = currentSports.filter((s: string) => s !== sport);
      
      await update(universityRef, { 
        sports: updatedSports,
        updatedAt: new Date().toISOString()
      });
      
      setUniversitySports(updatedSports);
      console.log(`✅ Removed ${sport} from university`);
    } catch (error) {
      console.error('Error removing sport:', error);
    }
  };

  if (authLoading || loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sports...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sports Management</h1>
              <p className="text-gray-600">Manage your university's sports teams and competitions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Trophy className="h-8 w-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Sports</p>
                      <p className="text-2xl font-bold text-gray-900">{sports.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Players</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {sports.reduce((sum, sport) => sum + sport.players, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Matches</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {sports.reduce((sum, sport) => sum + sport.matches, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Win Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {sports.length > 0 ? Math.round(
                          (sports.reduce((sum, sport) => sum + sport.wins, 0) / 
                           sports.reduce((sum, sport) => sum + sport.matches, 0)) * 100
                        ) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sports List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sports.map((sport) => (
                <Card key={sport.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-orange-500" />
                        <span>{sport.name}</span>
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-800">
                        {sport.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Players:</span>
                        <span className="font-medium">{sport.players}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Matches:</span>
                        <span className="font-medium">{sport.matches}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Wins:</span>
                        <span className="font-medium text-green-600">{sport.wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Losses:</span>
                        <span className="font-medium text-red-600">{sport.losses}</span>
                      </div>
                      <Button className="w-full mt-4">
                        <Target className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Information for Universities */}
            <div className="mt-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Trophy className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Sports Registration</h3>
                    <p className="text-blue-700">Assign sports to your players to participate in tournaments</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Available Sports:</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Kho Kho', 'Badminton', 'Netball', 'Kabaddi', 'Football'].map(sport => (
                        <span key={sport} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">How to participate:</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Go to Players section</li>
                      <li>2. Add your team members</li>
                      <li>3. Assign sports to each player</li>
                      <li>4. Sports will appear here automatically</li>
                    </ol>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button 
                    onClick={() => setShowSportsManagement(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Manage Sports
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/university/players'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Players
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/university/dashboard'}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Management Modal */}
      {showSportsManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manage Your Sports</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowSportsManagement(false)}
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Current Sports */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Your Registered Sports</h4>
                {universitySports.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {universitySports.map(sport => (
                      <div key={sport} className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                        <span>{sport}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveSport(sport)}
                          className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No sports registered yet</p>
                )}
              </div>

              {/* Available Sports */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Available Sports</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['Kho Kho', 'Badminton', 'Netball', 'Kabaddi', 'Football'].map(sport => (
                    <Button
                      key={sport}
                      onClick={() => handleAddSport(sport)}
                      disabled={universitySports.includes(sport)}
                      className={`h-12 ${
                        universitySports.includes(sport)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                      }`}
                    >
                      {universitySports.includes(sport) ? '✓ ' : '+ '}{sport}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sports Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How Sports Registration Works:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Select sports your university wants to compete in</li>
                  <li>• Add players and assign them to specific sports</li>
                  <li>• Sports will appear in your dashboard once you have players</li>
                  <li>• You can change your sports selection anytime</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
