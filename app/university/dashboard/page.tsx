'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Users, Activity, Trophy, Target, GraduationCap, Shield, Calendar, TrendingUp, Plus, Download, Upload, Settings, Bell, HelpCircle, User, LogOut, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { useFirebase } from '@/lib/firebase-context';
import { ref, get, update, push, set, remove } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export default function UniversityDashboard() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useFirebase();
  const [university, setUniversity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [universityStats, setUniversityStats] = useState<any>(null);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showSportsManagement, setShowSportsManagement] = useState(false);
  const [universitySports, setUniversitySports] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    sport: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    emergencyContactEmail: '',
    hasAllergies: false,
    allergies: '',
    hasMedicalCondition: false,
    medicalCondition: '',
    checkedIn: false,
    checkInDate: null,
    checkInTime: null
  });

  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [availableSports] = useState(['Kho Kho', 'Badminton', 'Netball', 'Kabaddi', 'Football']);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (firebaseUser && !authLoading) {
      loadUniversityData();
    }
  }, [firebaseUser, authLoading]);

    const loadUniversityData = async () => {
      try {
      setLoading(true);
      
      // Get university data from Firebase
      const universitiesRef = ref(realtimeDb, 'universities');
      const snapshot = await get(universitiesRef);
      
      if (snapshot.exists()) {
        const universitiesData = snapshot.val();
        
        // Find the university that matches the current user
        const universityData = Object.values(universitiesData).find((uni: any) => 
          uni.email === firebaseUser?.email || uni.contactPerson === firebaseUser?.email
        );
        
        if (universityData) {
          setUniversity(universityData);
          
          // Load players for this university
          const playersData = universityData.players || {};
          
          // Handle different data structures
          let playersList = [];
          if (Array.isArray(playersData)) {
            playersList = playersData;
          } else if (typeof playersData === 'object') {
            // If it's an object, flatten all values
            playersList = Object.values(playersData).flat();
          }
          
          setPlayers(playersList);
          
          // Extract sports from players data
          const uniqueSports = [...new Set(playersList.map(player => player.sport).filter(Boolean))];
          console.log('Players list:', playersList);
          console.log('Extracted sports:', uniqueSports);
          console.log('Sports count:', uniqueSports.length);
          setSports(uniqueSports);
          
          // Load matches for this university
          await loadUniversityMatches(universityData.name);
          
          // Calculate university stats
          calculateUniversityStats(universityData.name);
          
          // Load university sports
          setUniversitySports(universityData.sports || []);
        }
      }
    } catch (error) {
      console.error('Error loading university data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUniversityData();
    setIsRefreshing(false);
  };


  const loadUniversityMatches = async (universityName: string) => {
    try {
      const matchesRef = ref(realtimeDb, 'matches');
      const snapshot = await get(matchesRef);
      
      if (snapshot.exists()) {
        const matchesData = snapshot.val();
        const universityMatches = Object.values(matchesData).filter((match: any) => 
          match.team1 === universityName || match.team2 === universityName
        );
        setMatches(universityMatches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const calculateUniversityStats = (universityName: string) => {
    const wins = matches.filter((match: any) => {
      if (match.team1 === universityName) {
        return match.team1Score > match.team2Score;
      } else if (match.team2 === universityName) {
        return match.team2Score > match.team1Score;
      }
      return false;
    }).length;

    const losses = matches.filter((match: any) => {
      if (match.team1 === universityName) {
        return match.team1Score < match.team2Score;
      } else if (match.team2 === universityName) {
        return match.team2Score < match.team1Score;
      }
      return false;
    }).length;

    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? (wins / totalMatches * 100).toFixed(1) : 0;

    setUniversityStats({
      wins,
      losses,
      totalMatches,
      winRate,
      points: wins * 3, // 3 points per win
      nextWinTarget: Math.max(0, 5 - wins), // Need 5 wins for next level
      currentLevel: Math.floor(wins / 5) + 1,
      nextLevel: Math.floor(wins / 5) + 2
    });
  };

  const handleEditPlayer = (player: any) => {
    console.log('Editing player:', player);
    setEditingPlayer(player);
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      // Delete player from Firebase
      const universityRef = ref(realtimeDb, `universities/${university.id}`);
      const snapshot = await get(universityRef);
      
      if (snapshot.exists()) {
        const universityData = snapshot.val();
        const updatedPlayers = { ...universityData.players };
        
        // Remove player from all sports
        Object.keys(updatedPlayers).forEach(sport => {
          if (Array.isArray(updatedPlayers[sport])) {
            updatedPlayers[sport] = updatedPlayers[sport].filter((p: any) => p.id !== playerId);
          }
        });
        
        // Update Firebase
        await update(universityRef, { players: updatedPlayers });
        
        // Also remove from global players list
        const globalPlayerRef = ref(realtimeDb, `players/${playerId}`);
        await remove(globalPlayerRef);
        
        // Reload data
        await loadUniversityData();
      }
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const handleSavePlayer = async (playerData: any) => {
    try {
      const universityRef = ref(realtimeDb, `universities/${university.id}`);
      const snapshot = await get(universityRef);
      
      if (snapshot.exists()) {
        const universityData = snapshot.val();
        const updatedPlayers = { ...universityData.players };
        
        // Update player in the sport they're assigned to
        if (playerData.sport && updatedPlayers[playerData.sport]) {
          const sportPlayers = updatedPlayers[playerData.sport];
          const playerIndex = sportPlayers.findIndex((p: any) => p.id === playerData.id);
          
          if (playerIndex !== -1) {
            sportPlayers[playerIndex] = { ...playerData, updatedAt: new Date().toISOString() };
            updatedPlayers[playerData.sport] = sportPlayers;
          }
        }
        
        // Update Firebase
        await update(universityRef, { players: updatedPlayers });
        
        // Also update global players list
        const globalPlayerRef = ref(realtimeDb, `players/${playerData.id}`);
        const globalPlayerData = {
          ...playerData,
          universityId: university.id,
          universityName: university.name,
          updatedAt: new Date().toISOString()
        };
        await set(globalPlayerRef, globalPlayerData);
        
        // Reload data
        await loadUniversityData();
        setEditingPlayer(null);
      }
    } catch (error) {
      console.error('Error saving player:', error);
    }
  };

  const handleCheckInPlayer = async (playerId: string) => {
    try {
      // For now, we'll use the old structure until we migrate all data
      // TODO: Update to use new structure: universities/{uniId}/sports/{sportId}/teams/{teamId}/players/{playerId}
      const universityRef = ref(realtimeDb, `universities/${university.id}`);
      const snapshot = await get(universityRef);
      
      if (snapshot.exists()) {
        const universityData = snapshot.val();
        const updatedPlayers = { ...universityData.players };
        
        // Update player check-in status
        Object.keys(updatedPlayers).forEach(sport => {
          if (Array.isArray(updatedPlayers[sport])) {
            updatedPlayers[sport] = updatedPlayers[sport].map((p: any) => {
              if (p.id === playerId) {
                return {
                  ...p,
                  checkedIn: true,
                  checkInDate: new Date().toISOString().split('T')[0],
                  checkInTime: new Date().toLocaleTimeString(),
                  checkedInAt: new Date().toISOString()
                };
              }
              return p;
            });
          }
        });
        
        // Update Firebase
        await update(universityRef, { players: updatedPlayers });
        
        // Reload data
        await loadUniversityData();
      }
    } catch (error) {
      console.error('Error checking in player:', error);
    }
  };

  const handleAddPlayer = async () => {
    try {
      const db = realtimeDb;
      const uniId = university.id;
      const sportId = newPlayer.sport.toLowerCase().replace(/\s+/g, '_'); // Convert "Kho Kho" to "kho_kho"
      const teamId = 'main_team'; // Default team for now
      
      // Create player reference with auto-generated ID
      const playersRef = ref(db, `universities/${uniId}/sports/${sportId}/teams/${teamId}/players`);
      const newPlayerRef = push(playersRef);
      
      const newPlayerData = {
        ...newPlayer,
        playerId: newPlayerRef.key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checkedIn: false,
        checkInDate: "",
        checkInTime: ""
      };
      
      // Save player to Firebase (nested structure)
      await set(newPlayerRef, newPlayerData);
      
      // Mirror to global players list for admin dashboard
      const globalPlayersRef = ref(db, `players/${newPlayerRef.key}`);
      const globalPlayerData = {
        ...newPlayerData,
        universityId: uniId,
        universityName: university.name,
        sportId: sportId,
        teamId: teamId,
        path: `universities/${uniId}/sports/${sportId}/teams/${teamId}/players/${newPlayerRef.key}`
      };
      await set(globalPlayersRef, globalPlayerData);
      
      console.log("✅ Player registered:", newPlayerData.firstName, newPlayerData.lastName);
      console.log("✅ Player mirrored to global players list");
      
      // Reload data
      await loadUniversityData();
      
      // Reset form
      setNewPlayer({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        sport: '',
        emergencyContactName: '',
        emergencyContactRelation: '',
        emergencyContactPhone: '',
        emergencyContactEmail: '',
        hasAllergies: false,
        allergies: '',
        hasMedicalCondition: false,
        medicalCondition: ''
      });
      setShowAddPlayer(false);
      
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const handleLogout = () => {
    router.push('/login');
  };

  // Sports Management Functions
  const handleAddSport = async (sport: string) => {
    try {
      const universityRef = ref(realtimeDb, `universities/${university.id}`);
      const snapshot = await get(universityRef);
      
      if (snapshot.exists()) {
        const universityData = snapshot.val();
        const currentSports = universityData.sports || [];
        
        if (!currentSports.includes(sport)) {
          const updatedSports = [...currentSports, sport];
          await update(universityRef, { 
            sports: updatedSports,
            updatedAt: new Date().toISOString()
          });
          
          setUniversitySports(updatedSports);
          console.log(`✅ Added ${sport} to university`);
        }
      }
    } catch (error) {
      console.error('Error adding sport:', error);
    }
  };

  const handleRemoveSport = async (sport: string) => {
    try {
      const universityRef = ref(realtimeDb, `universities/${university.id}`);
      const snapshot = await get(universityRef);
      
      if (snapshot.exists()) {
        const universityData = snapshot.val();
        const currentSports = universityData.sports || [];
        const updatedSports = currentSports.filter((s: string) => s !== sport);
        
        await update(universityRef, { 
          sports: updatedSports,
          updatedAt: new Date().toISOString()
        });
        
        setUniversitySports(updatedSports);
        console.log(`✅ Removed ${sport} from university`);
      }
    } catch (error) {
      console.error('Error removing sport:', error);
    }
  };

  // Calculate real stats from Firebase data
  const totalPlayers = players.length;
  const totalSports = sports.length;
  const activeTeams = Math.ceil(totalPlayers / 5); // Assuming 5 players per team
  const tournamentDays = universityStats?.totalMatches || 0; // Use actual match count

  const stats = [
    {
      title: 'Total Players',
      value: totalPlayers.toString(),
      change: '+0',
      changeType: 'positive' as const,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Wins',
      value: universityStats?.wins?.toString() || '0',
      change: `${universityStats?.winRate || 0}%`,
      changeType: 'positive' as const,
      icon: Trophy,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Points',
      value: universityStats?.points?.toString() || '0',
      change: `Level ${universityStats?.currentLevel || 1}`,
      changeType: 'positive' as const,
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Matches Played',
      value: universityStats?.totalMatches?.toString() || '0',
      change: `${universityStats?.losses || 0} losses`,
      changeType: 'neutral' as const,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  if (authLoading || loading || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">University Not Found</h2>
          <p className="text-gray-600 mb-4">Your university data could not be loaded.</p>
          <Button onClick={() => router.push('/login')} className="bg-orange-600 hover:bg-orange-700">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex-1 p-6 ml-64">
        {/* Header */}
            <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
              <h1 className="text-2xl font-bold text-gray-900">University Dashboard</h1>
              <p className="text-gray-600">NHSF(UK) Dharmic Games</p>
              {universitySports.length > 0 && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500">Competing in:</span>
                  <div className="flex flex-wrap gap-1">
                    {universitySports.slice(0, 3).map(sport => (
                      <Badge key={sport} variant="outline" className="text-xs">
                        {sport}
                      </Badge>
                    ))}
                    {universitySports.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{universitySports.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
                </div>
              </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <Activity className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement notifications
                alert('Notifications coming soon!');
              }}
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement help
                alert('Help section coming soon!');
              }}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                router.push('/university/settings');
              }}
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {university.name}
          </h2>
          <p className="text-gray-600 text-lg">
            Manage your NHSF(UK) Dharmic Games participation and build your championship team.
          </p>
            </div>

            {/* Registered Sports Section */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-orange-600" />
                    <span>Your Registered Sports</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">Sports your university is competing in</p>
                </CardHeader>
                <CardContent>
                  {universitySports.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {universitySports.map(sport => (
                        <Badge key={sport} className="bg-orange-100 text-orange-800 px-3 py-1">
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-2">No sports registered yet</p>
                      <Button 
                        size="sm" 
                        onClick={() => setShowSportsManagement(true)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Register for Sports
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>

        {/* Motivational Section */}
        {universityStats && (
          <Card className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  {universityStats && universityStats.totalMatches > 0 ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {universityStats.nextWinTarget > 0 
                          ? `You need ${universityStats.nextWinTarget} more wins to reach Level ${universityStats.nextLevel}!`
                          : `Congratulations! You've reached Level ${universityStats.currentLevel}!`
                        }
                      </h3>
                      <p className="text-gray-600">
                        Current Level: {universityStats.currentLevel} | Points: {universityStats.points} | Win Rate: {universityStats.winRate}%
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Welcome to NHSF(UK) Dharmic Games!
                      </h3>
                      <p className="text-gray-600">
                        Register your players and start competing to see your stats here.
                      </p>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{universityStats?.wins || 0}</div>
                  <div className="text-sm text-gray-500">Wins</div>
                </div>
                  </div>
                </CardContent>
              </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sports Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-orange-600" />
                <span>Sports Performance</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Track your university's sports participation</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sports.length > 0 ? (
                  sports.map((sport, index) => {
                    const playerCount = players.filter(player => player.sport === sport).length;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Trophy className="h-5 w-5 text-orange-500" />
                          <div>
                            <span className="font-medium">{sport}</span>
                            <p className="text-xs text-gray-500">{playerCount} player{playerCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    {players.length > 0 && sports.length === 0 ? (
                      <>
                        <p className="text-gray-500">Players registered but no sports assigned</p>
                        <p className="text-sm text-gray-400 mt-2">Assign sports to your players to see them here</p>
                        <div className="mt-4 space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push('/university/players')}
                          >
                            Manage Players
                          </Button>
                          <div className="text-xs text-gray-500">
                            Available sports: Kho Kho, Badminton, Netball, Kabaddi, Football
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500">No sports registered yet</p>
                        <p className="text-sm text-gray-400 mt-2">Add players to register for sports</p>
                        <div className="mt-4 space-y-2">
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={() => setShowAddPlayer(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Player
                          </Button>
                          <div className="text-xs text-gray-500">
                            Available sports: Kho Kho, Badminton, Netball, Kabaddi, Football
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                  </div>
                </CardContent>
              </Card>

          {/* Quick Actions */}
          <Card>
                <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Quick Actions</span>
                  </CardTitle>
              <p className="text-sm text-gray-600">Common tasks for managing your team</p>
                </CardHeader>
                <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowSportsManagement(true);
                  }}
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <Target className="h-5 w-5" />
                  <span className="text-sm font-medium">Select Sports</span>
                </Button>
                
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    if (selectedSports.length === 0) {
                      alert('Please select sports first before adding players');
                      return;
                    }
                    setShowAddPlayer(true);
                  }}
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-sm font-medium">Add Player</span>
                </Button>
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/university/players');
                  }}
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-medium">View Players</span>
                </Button>
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowSportsManagement(true);
                  }}
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                >
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm font-medium">Manage Sports</span>
                </Button>
              </div>
                </CardContent>
              </Card>

          {/* Player Management */}
          <Card>
                <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Player Management</span>
                      </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowAddPlayer(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Player
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push('/university/players')}
                  >
                    View All Players
                  </Button>
                </div>
                  </CardTitle>
              <p className="text-sm text-gray-600">Manage your university's sports team players</p>
                </CardHeader>
                <CardContent>
              <div className="space-y-3">
                {players.length > 0 ? (
                  players.slice(0, 10).map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                          <p className="font-medium text-sm">{player.firstName && player.lastName ? `${player.firstName} ${player.lastName}` : player.name || `Player ${index + 1}`}</p>
                          <p className="text-xs text-gray-500">{player.email || 'No email'}</p>
                          {player.checkedIn && (
                            <p className="text-xs text-green-600">
                              Checked in: {player.checkInDate} at {player.checkInTime}
                            </p>
                          )}
                                    </div>
                                  </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          player.checkedIn 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {player.checkedIn ? 'Checked In' : 'Not Checked In'}
                        </Badge>
                        {!player.checkedIn && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCheckInPlayer(player.id)}
                            className="text-green-600 hover:bg-green-50"
                          >
                            Check In
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditPlayer(player);
                          }}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeletePlayer(player.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                                </div>
                  ))
                ) : null}
                
                {players.length > 10 && (
                  <div className="text-center py-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing 10 of {players.length} players
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => router.push('/university/players')}
                      className="mt-2"
                    >
                      View All Players
                    </Button>
                  </div>
                )}
                
                {players.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No players registered yet</p>
                            </div>
                          )}
                        </div>
                  </CardContent>
                </Card>

          {/* Recent Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span>Recent Matches</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Your latest match results and performance</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matches.length > 0 ? (
                  matches.slice(0, 5).map((match, index) => {
                    const isWin = (match.team1 === university.name && match.team1Score > match.team2Score) ||
                                 (match.team2 === university.name && match.team2Score > match.team1Score);
                    const isLoss = (match.team1 === university.name && match.team1Score < match.team2Score) ||
                                   (match.team2 === university.name && match.team2Score < match.team1Score);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isWin ? 'bg-green-100' : isLoss ? 'bg-red-100' : 'bg-gray-100'
                          }`}>
                            {isWin ? <Trophy className="h-4 w-4 text-green-600" /> : 
                             isLoss ? <Activity className="h-4 w-4 text-red-600" /> :
                             <Calendar className="h-4 w-4 text-gray-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {match.team1} vs {match.team2}
                            </p>
                            <p className="text-xs text-gray-500">{match.sport}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {match.team1 === university.name ? match.team1Score : match.team2Score} - 
                            {match.team1 === university.name ? match.team2Score : match.team1Score}
                          </div>
                          <Badge className={`text-xs ${
                            isWin ? 'bg-green-100 text-green-800' : 
                            isLoss ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {isWin ? 'Win' : isLoss ? 'Loss' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No matches played yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
            </div>

        {/* Search Bar */}
        <div className="mt-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
              placeholder="Search players, sports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
              </div>
            </div>

        {/* Logout Button */}
        <div className="mt-8 flex justify-end">
          <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Player Registration Form */}
        {showAddPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Register New Player</h3>
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <Input
                      value={newPlayer.firstName}
                      onChange={(e) => setNewPlayer({...newPlayer, firstName: e.target.value})}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <Input
                      value={newPlayer.lastName}
                      onChange={(e) => setNewPlayer({...newPlayer, lastName: e.target.value})}
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <Input
                      value={newPlayer.phone}
                      onChange={(e) => setNewPlayer({...newPlayer, phone: e.target.value})}
                      placeholder="Phone number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <Input
                      type="email"
                      value={newPlayer.email}
                      onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})}
                      placeholder="Email address"
                      required
                    />
                  </div>
                </div>

                {/* Sport */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sport *</label>
                  <select
                    value={newPlayer.sport}
                    onChange={(e) => setNewPlayer({...newPlayer, sport: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a sport</option>
                    <option value="Kho Kho">Kho Kho</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Netball">Netball</option>
                    <option value="Kabaddi">Kabaddi</option>
                    <option value="Football">Football</option>
                  </select>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Emergency Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name *</label>
                      <Input
                        value={newPlayer.emergencyContactName}
                        onChange={(e) => setNewPlayer({...newPlayer, emergencyContactName: e.target.value})}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relation *</label>
                      <Input
                        value={newPlayer.emergencyContactRelation}
                        onChange={(e) => setNewPlayer({...newPlayer, emergencyContactRelation: e.target.value})}
                        placeholder="e.g., Parent, Spouse, Sibling"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone *</label>
                      <Input
                        value={newPlayer.emergencyContactPhone}
                        onChange={(e) => setNewPlayer({...newPlayer, emergencyContactPhone: e.target.value})}
                        placeholder="Phone number"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Email *</label>
                      <Input
                        type="email"
                        value={newPlayer.emergencyContactEmail}
                        onChange={(e) => setNewPlayer({...newPlayer, emergencyContactEmail: e.target.value})}
                        placeholder="Email address"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Medical Information</h4>
                  
                  {/* Allergies */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Do you have any allergies?
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="hasAllergies"
                          value="yes"
                          checked={newPlayer.hasAllergies === true}
                          onChange={(e) => setNewPlayer({...newPlayer, hasAllergies: e.target.value === 'yes'})}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="hasAllergies"
                          value="no"
                          checked={newPlayer.hasAllergies === false}
                          onChange={(e) => setNewPlayer({...newPlayer, hasAllergies: e.target.value === 'yes', allergies: ''})}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                    {newPlayer.hasAllergies && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Please specify your allergies
                        </label>
                        <Input
                          value={newPlayer.allergies}
                          onChange={(e) => setNewPlayer({...newPlayer, allergies: e.target.value})}
                          placeholder="e.g., Peanuts, Shellfish, Pollen"
                        />
                      </div>
                    )}
                  </div>

                  {/* Medical Conditions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical Conditions (Optional)
                    </label>
                    <p className="text-sm text-gray-500 mb-3">
                      If you'd like to share any medical conditions that might be relevant during sports activities, please let us know. This information is completely optional and will be kept confidential.
                    </p>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="hasMedicalCondition"
                          value="yes"
                          checked={newPlayer.hasMedicalCondition === true}
                          onChange={(e) => setNewPlayer({...newPlayer, hasMedicalCondition: e.target.value === 'yes'})}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">Yes, I'd like to share</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="hasMedicalCondition"
                          value="no"
                          checked={newPlayer.hasMedicalCondition === false}
                          onChange={(e) => setNewPlayer({...newPlayer, hasMedicalCondition: e.target.value === 'yes', medicalCondition: ''})}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">No, I prefer not to share</span>
                      </label>
                    </div>
                    {newPlayer.hasMedicalCondition && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Please share any relevant medical conditions
                        </label>
                        <Input
                          value={newPlayer.medicalCondition}
                          onChange={(e) => setNewPlayer({...newPlayer, medicalCondition: e.target.value})}
                          placeholder="e.g., Asthma, Diabetes, Heart condition (optional)"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddPlayer(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddPlayer}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Register Player
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Player Edit Modal */}
        {editingPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Player</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <Input
                      value={editingPlayer.firstName || ''}
                      onChange={(e) => setEditingPlayer({...editingPlayer, firstName: e.target.value})}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <Input
                      value={editingPlayer.lastName || ''}
                      onChange={(e) => setEditingPlayer({...editingPlayer, lastName: e.target.value})}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    value={editingPlayer.email || ''}
                    onChange={(e) => setEditingPlayer({...editingPlayer, email: e.target.value})}
                    placeholder="Player email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <Input
                    value={editingPlayer.phone || ''}
                    onChange={(e) => setEditingPlayer({...editingPlayer, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
                  <select
                    value={editingPlayer.sport || ''}
                    onChange={(e) => setEditingPlayer({...editingPlayer, sport: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select a sport</option>
                    <option value="Kho Kho">Kho Kho</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Netball">Netball</option>
                    <option value="Kabaddi">Kabaddi</option>
                    <option value="Football">Football</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingPlayer(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSavePlayer(editingPlayer)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sports Management Modal */}
        {showSportsManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Sports for Your Team</h3>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSportsManagement(false)}
                >
                  Close
                </Button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Select which sports your university team will be participating in. 
                  You can only add players to the sports you select here.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableSports.map((sport) => (
                    <div key={sport} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={sport}
                        checked={selectedSports.includes(sport)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSports([...selectedSports, sport]);
                          } else {
                            setSelectedSports(selectedSports.filter(s => s !== sport));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor={sport} className="flex-1 font-medium cursor-pointer">
                        {sport}
                      </label>
                    </div>
                  ))}
                </div>
                
                {selectedSports.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Selected Sports:</strong> {selectedSports.join(', ')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSportsManagement(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Save selected sports to university data
                    setUniversitySports(selectedSports);
                    setShowSportsManagement(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Sports Selection
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
      </div>
    </SidebarProvider>
  );
}