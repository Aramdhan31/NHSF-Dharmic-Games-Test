"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/lib/firebase-context";
import { realtimeDbUtils } from "@/lib/firebase-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Trophy, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Clock,
  Users,
  Target,
  Calendar,
  RefreshCw,
  Save,
  X,
  Check,
  Play,
  Pause,
  Square
} from "lucide-react";

type Zone = 'LZ' | 'SZ' | 'CZ' | 'NZ';

interface Player {
  name: string;
  role: string;
}

const zoneNames = {
  LZ: 'London Zone',
  SZ: 'South Zone', 
  CZ: 'Central Zone',
  NZ: 'North Zone',
  'LZ+SZ': 'London & South Zone (Combined)',
  'NZ+CZ': 'North & Central Zone (Combined)'
};

// Sport-specific score formats and validation
const sportConfigs = {
  Netball: {
    format: 'goals-goals',
    placeholder: 'e.g., 15-12',
    example: '15-12',
    validation: /^\d+-\d+$/,
    helpText: 'Format: goals-goals (e.g., 15-12)'
  },
  Kabaddi: {
    format: 'points-points',
    placeholder: 'e.g., 25-18',
    example: '25-18',
    validation: /^\d+-\d+$/,
    helpText: 'Format: points-points (e.g., 25-18)'
  },
  Football: {
    format: 'goals-goals',
    placeholder: 'e.g., 2-1',
    example: '2-1',
    validation: /^\d+-\d+$/,
    helpText: 'Format: goals-goals (e.g., 2-1)'
  },
  'Kho Kho': {
    format: 'points-points',
    placeholder: 'e.g., 8-5',
    example: '8-5',
    validation: /^\d+-\d+$/,
    helpText: 'Format: points-points (e.g., 8-5)'
  },
  Badminton: {
    format: 'games-games',
    placeholder: 'e.g., 21-19, 21-17',
    example: '21-19, 21-17',
    validation: /^\d+-\d+(,\s*\d+-\d+)*$/,
    helpText: 'Format: games-games (e.g., 21-19, 21-17)'
  }
};

// Default role suggestions (for placeholder/help)
const defaultRoleSuggestions = [
  'Player',
  'Captain',
  'Vice Captain', 
  'Leader',
  'Co-Leader',
  'Manager',
  'Coach',
  'Substitute'
];

// Helper functions for managing players
const addPlayer = (team: 'team1' | 'team2', players: Player[]) => {
  return [...players, { name: '', role: 'Player' }];
};

const removePlayer = (team: 'team1' | 'team2', players: Player[], index: number) => {
  if (players.length > 1) {
    return players.filter((_, i) => i !== index);
  }
  return players;
};

const updatePlayer = (team: 'team1' | 'team2', players: Player[], index: number, field: 'name' | 'role', value: string) => {
  const updated = [...players];
  updated[index] = { ...updated[index], [field]: value };
  return updated;
};

export default function MatchesPage() {
  const { user: currentUser } = useFirebase();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    sport: 'Football',
    zone1: 'LZ',
    zone2: 'SZ',
    team1Players: [{ name: '', role: 'Player' }],
    team2Players: [{ name: '', role: 'Player' }],
    date: new Date().toISOString().split('T')[0],
    duration: '90 min'
  });

  // Load matches from Firebase Realtime Database
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        const result = await realtimeDbUtils.getData('matches');
        
        if (result.success && result.data) {
          // Convert Firebase data to array format
          const matchesArray = Object.entries(result.data).map(([id, match]: [string, any]) => ({
            id,
            ...match,
            // Ensure all required fields have defaults
            title: match.title || `Match ${id}`,
            zone1: match.zone1 || 'LZ',
            zone2: match.zone2 || 'SZ',
            player1: match.player1 || 'Player 1',
            player2: match.player2 || 'Player 2',
            status: match.status || 'scheduled',
            winner: match.winner || null,
            score: match.score || '0-0',
            date: match.date || new Date().toISOString().split('T')[0],
            duration: match.duration || '0 min'
          }));
          
          setMatches(matchesArray);
        } else {
          console.log('No matches data found, using empty array');
          setMatches([]);
        }
      } catch (error) {
        console.error('Error loading matches:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();

    // Set up real-time listener for matches
    const unsubscribe = realtimeDbUtils.listenToData('matches', (data) => {
      if (data) {
        const matchesArray = Object.entries(data).map(([id, match]: [string, any]) => ({
          id,
          ...match,
          title: match.title || `Match ${id}`,
          zone1: match.zone1 || 'LZ',
          zone2: match.zone2 || 'SZ',
          player1: match.player1 || 'Player 1',
          player2: match.player2 || 'Player 2',
          status: match.status || 'scheduled',
          winner: match.winner || null,
          score: match.score || '0-0',
          date: match.date || new Date().toISOString().split('T')[0],
          duration: match.duration || '0 min'
        }));
        
        setMatches(matchesArray);
      } else {
        setMatches([]);
      }
    });

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Refresh matches data
  const refreshMatches = async () => {
    setRefreshing(true);
    try {
      const result = await realtimeDbUtils.getData('matches');
      
      if (result.success && result.data) {
        const matchesArray = Object.entries(result.data).map(([id, match]: [string, any]) => ({
          id,
          ...match,
          title: match.title || `Match ${id}`,
          zone1: match.zone1 || 'LZ',
          zone2: match.zone2 || 'SZ',
          player1: match.player1 || 'Player 1',
          player2: match.player2 || 'Player 2',
          status: match.status || 'scheduled',
          winner: match.winner || null,
          score: match.score || '0-0',
          date: match.date || new Date().toISOString().split('T')[0],
          duration: match.duration || '0 min'
        }));
        
        setMatches(matchesArray);
      }
    } catch (error) {
      console.error('Error refreshing matches:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Create a new match
  const createMatch = async () => {
    try {
      // Validate required fields
      if (!createForm.title || 
          !createForm.team1Players.some(p => p.name.trim()) || 
          !createForm.team2Players.some(p => p.name.trim())) {
        alert('Please fill in all required fields (Title, at least one player per team)');
        return;
      }

      const newMatch = {
        title: createForm.title,
        sport: createForm.sport,
        zone1: createForm.zone1,
        zone2: createForm.zone2,
        team1Players: createForm.team1Players.filter(p => p.name.trim()),
        team2Players: createForm.team2Players.filter(p => p.name.trim()),
        status: 'scheduled',
        winner: null,
        score: '0-0',
        date: createForm.date,
        duration: createForm.duration,
        createdAt: new Date().toISOString()
      };

      const result = await realtimeDbUtils.pushData('matches', newMatch);
      
      if (result.success) {
        console.log('Match created successfully:', result.id);
        // Reset form and hide create form
        setCreateForm({
          title: '',
          sport: 'Football',
          zone1: 'LZ',
          zone2: 'SZ',
          team1Players: [{ name: '', role: 'Player' }],
          team2Players: [{ name: '', role: 'Player' }],
          date: new Date().toISOString().split('T')[0],
          duration: '90 min'
        });
        setShowCreateForm(false);
      } else {
        console.error('Failed to create match:', result.error);
      }
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  // Show create form
  const showCreateMatchForm = () => {
    setShowCreateForm(true);
  };

  // Cancel create form
  const cancelCreateMatch = () => {
    setShowCreateForm(false);
    setCreateForm({
      title: '',
      sport: 'Football',
      zone1: 'LZ',
      zone2: 'SZ',
      team1Players: [{ name: '', role: 'Player' }],
      team2Players: [{ name: '', role: 'Player' }],
      date: new Date().toISOString().split('T')[0],
      duration: '90 min'
    });
  };

  // Start editing a match
  const startEditing = (match: any) => {
    setEditingMatch(match.id);
    setEditForm({
      title: match.title,
      sport: match.sport || 'Football',
      team1Players: match.team1Players || [{ name: '', role: 'Player' }],
      team2Players: match.team2Players || [{ name: '', role: 'Player' }],
      score: match.score,
      status: match.status,
      winner: match.winner || '',
      date: match.date,
      duration: match.duration
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMatch(null);
    setEditForm({});
  };

  // Save match changes
  const saveMatch = async (matchId: string) => {
    try {
      setSaving(true);
      
      // Validate score format based on sport
      const sport = editForm.sport || matches.find(m => m.id === matchId)?.sport || 'Football';
      const sportConfig = sportConfigs[sport];
      
      if (editForm.score && sportConfig && !sportConfig.validation.test(editForm.score)) {
        alert(`Invalid score format for ${sport}. ${sportConfig.helpText}`);
        setSaving(false);
        return;
      }
      
      const result = await realtimeDbUtils.updateData(`matches/${matchId}`, editForm);
      
      if (result.success) {
        console.log('Match updated successfully');
        setEditingMatch(null);
        setEditForm({});
      } else {
        console.error('Failed to update match:', result.error);
      }
    } catch (error) {
      console.error('Error updating match:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete a match
  const deleteMatch = async (matchId: string) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      try {
        const result = await realtimeDbUtils.deleteData(`matches/${matchId}`);
        if (result.success) {
          console.log('Match deleted successfully');
        } else {
          console.error('Failed to delete match:', result.error);
        }
      } catch (error) {
        console.error('Error deleting match:', error);
      }
    }
  };

  // Quick status update
  const updateMatchStatus = async (matchId: string, status: string) => {
    try {
      const result = await realtimeDbUtils.updateData(`matches/${matchId}`, { status });
      if (result.success) {
        console.log('Match status updated successfully');
      }
    } catch (error) {
      console.error('Error updating match status:', error);
    }
  };

  const filteredMatches = matches.filter(match =>
    match.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.player1.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.player2.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Matches Management</h1>
          <p className="text-gray-600 mt-2">Manage matches and tournaments</p>
          
          {/* Quick Instructions */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Quick Guide for Non-Technical Users:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Edit Match:</strong> Click the "Edit" button on any match card to modify details</p>
              <p>• <strong>Update Score:</strong> While editing, change the score (e.g., "3-1") and select the winner</p>
              <p>• <strong>Start Match:</strong> Click the ▶️ button to mark a scheduled match as "live"</p>
              <p>• <strong>End Match:</strong> Click the ⏹️ button to mark a live match as "completed"</p>
              <p>• <strong>Save Changes:</strong> Always click "Save" after editing to update the database</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matches.length}</div>
              <p className="text-xs text-muted-foreground">All matches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matches.filter(m => m.status === 'live').length}</div>
              <p className="text-xs text-muted-foreground">Currently playing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matches.filter(m => m.status === 'completed').length}</div>
              <p className="text-xs text-muted-foreground">Finished matches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matches.filter(m => m.status === 'scheduled').length}</div>
              <p className="text-xs text-muted-foreground">Upcoming matches</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search matches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={refreshMatches}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <Button onClick={showCreateMatchForm} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Match</span>
            </Button>
          </div>
        </div>

        {/* Create Match Form */}
        {showCreateForm && (
          <Card className="mb-6 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <span>Create New Match</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Match Title *
                  </label>
                  <Input
                    value={createForm.title}
                    onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                    placeholder="e.g., LZ vs SZ Championship"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sport *
                  </label>
                  <select
                    value={createForm.sport}
                    onChange={(e) => setCreateForm({...createForm, sport: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Netball">Netball</option>
                    <option value="Kabaddi">Kabaddi</option>
                    <option value="Football">Football</option>
                    <option value="Kho Kho">Kho Kho</option>
                    <option value="Badminton">Badminton</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Match Date *
                  </label>
                  <Input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => setCreateForm({...createForm, date: e.target.value})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone 1 *
                  </label>
                  <select
                    value={createForm.zone1}
                    onChange={(e) => setCreateForm({...createForm, zone1: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LZ">London Zone (LZ)</option>
                    <option value="SZ">South Zone (SZ)</option>
                    <option value="CZ">Central Zone (CZ)</option>
                    <option value="NZ">North Zone (NZ)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone 2 *
                  </label>
                  <select
                    value={createForm.zone2}
                    onChange={(e) => setCreateForm({...createForm, zone2: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LZ">London Zone (LZ)</option>
                    <option value="SZ">South Zone (SZ)</option>
                    <option value="CZ">Central Zone (CZ)</option>
                    <option value="NZ">North Zone (NZ)</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {zoneNames[createForm.zone1 as Zone]} Players *
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Role suggestions: Captain, Vice Captain, Player, Manager, Coach, Leader, Substitute
                  </p>
                  <div className="space-y-2">
                    {createForm.team1Players.map((player, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          value={player.name}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            team1Players: updatePlayer('team1', createForm.team1Players, index, 'name', e.target.value)
                          })}
                          placeholder="Player name"
                          className="flex-1"
                        />
                        <Input
                          value={player.role}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            team1Players: updatePlayer('team1', createForm.team1Players, index, 'role', e.target.value)
                          })}
                          placeholder="e.g., Captain, Player, Manager"
                          className="w-32 text-sm"
                        />
                        {createForm.team1Players.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateForm({
                              ...createForm,
                              team1Players: removePlayer('team1', createForm.team1Players, index)
                            })}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCreateForm({
                        ...createForm,
                        team1Players: addPlayer('team1', createForm.team1Players)
                      })}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Player
                    </Button>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {zoneNames[createForm.zone2 as Zone]} Players *
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Role suggestions: Captain, Vice Captain, Player, Manager, Coach, Leader, Substitute
                  </p>
                  <div className="space-y-2">
                    {createForm.team2Players.map((player, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          value={player.name}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            team2Players: updatePlayer('team2', createForm.team2Players, index, 'name', e.target.value)
                          })}
                          placeholder="Player name"
                          className="flex-1"
                        />
                        <Input
                          value={player.role}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            team2Players: updatePlayer('team2', createForm.team2Players, index, 'role', e.target.value)
                          })}
                          placeholder="e.g., Captain, Player, Manager"
                          className="w-32 text-sm"
                        />
                        {createForm.team2Players.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateForm({
                              ...createForm,
                              team2Players: removePlayer('team2', createForm.team2Players, index)
                            })}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCreateForm({
                        ...createForm,
                        team2Players: addPlayer('team2', createForm.team2Players)
                      })}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Player
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <Input
                    value={createForm.duration}
                    onChange={(e) => setCreateForm({...createForm, duration: e.target.value})}
                    placeholder="e.g., 90 min"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={cancelCreateMatch}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={createMatch} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Creating...' : 'Create Match'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matches List */}
        {filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {matches.length === 0 ? 'No matches found' : 'No matches match your search'}
              </h3>
              <p className="text-gray-500 mb-4">
                {matches.length === 0 
                  ? 'Matches will appear here when they are created in the Firebase Realtime Database.'
                  : 'Try adjusting your search terms to find matches.'
                }
              </p>
              <div className="flex justify-center space-x-2">
                <Button variant="outline" onClick={refreshMatches} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
                <Button onClick={showCreateMatchForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Match
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
            <Card key={match.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  {editingMatch === match.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="text-lg font-semibold"
                      />
                      <select
                        value={editForm.sport || match.sport || 'Football'}
                        onChange={(e) => setEditForm({...editForm, sport: e.target.value})}
                        className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="Netball">Netball</option>
                        <option value="Kabaddi">Kabaddi</option>
                        <option value="Football">Football</option>
                        <option value="Kho Kho">Kho Kho</option>
                        <option value="Badminton">Badminton</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <CardTitle className="text-lg">{match.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {match.sport || 'Cricket'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        match.status === 'live' ? 'default' : 
                        match.status === 'completed' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {match.status}
                    </Badge>
                    {!editingMatch && (
                      <div className="flex space-x-1">
                        {match.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateMatchStatus(match.id, 'live')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        {match.status === 'live' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateMatchStatus(match.id, 'completed')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                          {/* Teams */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant="outline">{zoneNames[match.zone1 as Zone]}</Badge>
                                </div>
                                {editingMatch === match.id ? (
                                  <div className="space-y-1">
                                    {editForm.team1Players?.map((player, index) => (
                                      <div key={index} className="flex space-x-2">
                                        <Input
                                          value={player.name}
                                          onChange={(e) => setEditForm({
                                            ...editForm,
                                            team1Players: updatePlayer('team1', editForm.team1Players, index, 'name', e.target.value)
                                          })}
                                          placeholder="Player name"
                                          className="flex-1 text-sm"
                                        />
                                        <Input
                                          value={player.role}
                                          onChange={(e) => setEditForm({
                                            ...editForm,
                                            team1Players: updatePlayer('team1', editForm.team1Players, index, 'role', e.target.value)
                                          })}
                                          placeholder="Role"
                                          className="w-24 text-xs"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {(match.team1Players || []).map((player, index) => (
                                      <div key={index} className="flex items-center space-x-2">
                                        <span className="text-sm font-medium">{player.name}</span>
                                        <Badge variant="secondary" className="text-xs">{player.role}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-gray-400 mx-4">vs</div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant="outline">{zoneNames[match.zone2 as Zone]}</Badge>
                                </div>
                                {editingMatch === match.id ? (
                                  <div className="space-y-1">
                                    {editForm.team2Players?.map((player, index) => (
                                      <div key={index} className="flex space-x-2">
                                        <Input
                                          value={player.name}
                                          onChange={(e) => setEditForm({
                                            ...editForm,
                                            team2Players: updatePlayer('team2', editForm.team2Players, index, 'name', e.target.value)
                                          })}
                                          placeholder="Player name"
                                          className="flex-1 text-sm"
                                        />
                                        <Input
                                          value={player.role}
                                          onChange={(e) => setEditForm({
                                            ...editForm,
                                            team2Players: updatePlayer('team2', editForm.team2Players, index, 'role', e.target.value)
                                          })}
                                          placeholder="Role"
                                          className="w-24 text-xs"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {(match.team2Players || []).map((player, index) => (
                                      <div key={index} className="flex items-center space-x-2">
                                        <span className="text-sm font-medium">{player.name}</span>
                                        <Badge variant="secondary" className="text-xs">{player.role}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-center">
                            {editingMatch === match.id ? (
                              <div className="space-y-2">
                                <div>
                                  <Input
                                    value={editForm.score}
                                    onChange={(e) => setEditForm({...editForm, score: e.target.value})}
                                    placeholder={sportConfigs[editForm.sport || match.sport || 'Football']?.placeholder || 'e.g., 2-1'}
                                    className="text-center text-2xl font-bold"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    {sportConfigs[editForm.sport || match.sport || 'Football']?.helpText}
                                  </p>
                                </div>
                                <select
                                  value={editForm.winner}
                                  onChange={(e) => setEditForm({...editForm, winner: e.target.value})}
                                  className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                                >
                                  <option value="">Select Winner</option>
                                  <option value={match.zone1}>{zoneNames[match.zone1 as Zone]}</option>
                                  <option value={match.zone2}>{zoneNames[match.zone2 as Zone]}</option>
                                </select>
                              </div>
                            ) : (
                              <div>
                                <div className="text-2xl font-bold text-gray-900">{match.score}</div>
                                <div className="text-xs text-gray-500 mb-1">
                                  {sportConfigs[match.sport || 'Football']?.format}
                                </div>
                                {match.winner && (
                                  <div className="text-sm text-green-600 font-medium">
                                    Winner: {zoneNames[match.winner as Zone]}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                  {/* Match Info */}
                  <div className="flex justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      {editingMatch === match.id ? (
                        <Input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                          className="w-32 text-xs"
                        />
                      ) : (
                        <span>{match.date}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      {editingMatch === match.id ? (
                        <Input
                          value={editForm.duration}
                          onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                          placeholder="e.g., 45 min"
                          className="w-20 text-xs"
                        />
                      ) : (
                        <span>{match.duration}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    {editingMatch === match.id ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => saveMatch(match.id)}
                          disabled={saving}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {saving ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={cancelEditing}
                          className="text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => startEditing(match)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteMatch(match.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
