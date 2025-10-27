'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Users, 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Target,
  Activity
} from 'lucide-react';

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
  createdAt: number;
  updatedAt: number;
}

interface SportsScoringProps {
  user: any;
}

export function SportsScoring({ user }: SportsScoringProps) {
  console.log('SportsScoring component rendering with user:', user);
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    sport: '',
    team1: '',
    team2: '',
    team1Score: 0,
    team2Score: 0,
    status: 'scheduled'
  });

  const sports = [
    'Kho Kho',
    'Badminton', 
    'Netball',
    'Kabaddi',
    'Football'
  ];

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matches');
      const result = await response.json();
      
      if (result.success) {
        setMatches(result.matches || []);
      } else {
        setMessage({type: 'error', text: 'Failed to load matches'});
      }
    } catch (error: any) {
      setMessage({type: 'error', text: `Failed to load matches: ${error.message}`});
    } finally {
      setLoading(false);
    }
  };

  const handleAddMatch = async () => {
    if (!newMatch.sport || !newMatch.team1 || !newMatch.team2) {
      setMessage({type: 'error', text: 'Please fill in all required fields'});
      return;
    }

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatch)
      });

      const result = await response.json();

      if (result.success) {
        setMessage({type: 'success', text: 'Match created successfully'});
        setShowAddMatch(false);
        setNewMatch({
          sport: '',
          team1: '',
          team2: '',
          team1Score: 0,
          team2Score: 0,
          status: 'scheduled'
        });
        loadMatches();
      } else {
        setMessage({type: 'error', text: result.error || 'Failed to create match'});
      }
    } catch (error: any) {
      setMessage({type: 'error', text: `Failed to create match: ${error.message}`});
    }
  };

  const handleUpdateScore = async (matchId: string, team: 'team1' | 'team2', score: number) => {
    try {
      const response = await fetch('/api/matches/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          team,
          score
        })
      });

      const result = await response.json();

      if (result.success) {
        loadMatches();
      } else {
        setMessage({type: 'error', text: result.error || 'Failed to update score'});
      }
    } catch (error: any) {
      setMessage({type: 'error', text: `Failed to update score: ${error.message}`});
    }
  };

  const handleUpdateStatus = async (matchId: string, status: Match['status']) => {
    try {
      const response = await fetch('/api/matches/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          status
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({type: 'success', text: `Match status updated to ${status}`});
        loadMatches();
      } else {
        setMessage({type: 'error', text: result.error || 'Failed to update status'});
      }
    } catch (error: any) {
      setMessage({type: 'error', text: `Failed to update status: ${error.message}`});
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2">Loading matches...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug info */}
      <div className="bg-yellow-100 p-4 rounded-lg">
        <p className="text-sm">DEBUG: SportsScoring component is rendering</p>
        <p className="text-sm">User: {user?.email || 'No user'}</p>
        <p className="text-sm">Matches count: {matches.length}</p>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sports Scoring</h2>
          <p className="text-gray-600">Manage matches and update scores in real-time</p>
        </div>
        <Button 
          onClick={() => setShowAddMatch(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Match
        </Button>
      </div>

      {/* Message Display */}
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Matches List */}
      <div className="grid gap-4">
        {matches.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No matches found</p>
              <p className="text-sm text-gray-500">Create your first match to get started</p>
            </CardContent>
          </Card>
        ) : (
          matches.map((match) => (
            <Card key={match.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-5 w-5 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-lg">{match.sport}</h3>
                      <p className="text-sm text-gray-600">
                        {match.team1} vs {match.team2}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(match.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingMatch(match)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Score Display */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-lg">{match.team1Score}</p>
                    <p className="text-sm text-gray-600">{match.team1}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-lg">{match.team2Score}</p>
                    <p className="text-sm text-gray-600">{match.team2}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {match.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(match.id, 'live')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start Match
                      </Button>
                    )}
                    {match.status === 'live' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(match.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Square className="h-4 w-4 mr-1" />
                          End Match
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(match.id, 'scheduled')}
                          variant="outline"
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      </>
                    )}
                    {match.status === 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(match.id, 'live')}
                        variant="outline"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Restart
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Updated: {new Date(match.updatedAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Match Modal */}
      {showAddMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add New Match</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMatch(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sport">Sport *</Label>
                <Select
                  value={newMatch.sport || ''}
                  onValueChange={(value) => setNewMatch({...newMatch, sport: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="team1">Team 1 *</Label>
                <Input
                  id="team1"
                  value={newMatch.team1 || ''}
                  onChange={(e) => setNewMatch({...newMatch, team1: e.target.value})}
                  placeholder="Enter team 1 name"
                />
              </div>

              <div>
                <Label htmlFor="team2">Team 2 *</Label>
                <Input
                  id="team2"
                  value={newMatch.team2 || ''}
                  onChange={(e) => setNewMatch({...newMatch, team2: e.target.value})}
                  placeholder="Enter team 2 name"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMatch(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMatch}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Match
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Update Scores</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMatch(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold">{editingMatch.sport}</h3>
                <p className="text-sm text-gray-600">
                  {editingMatch.team1} vs {editingMatch.team2}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="team1Score">{editingMatch.team1} Score</Label>
                  <Input
                    id="team1Score"
                    type="number"
                    value={editingMatch.team1Score}
                    onChange={(e) => {
                      const score = parseInt(e.target.value) || 0;
                      handleUpdateScore(editingMatch.id, 'team1', score);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="team2Score">{editingMatch.team2} Score</Label>
                  <Input
                    id="team2Score"
                    type="number"
                    value={editingMatch.team2Score}
                    onChange={(e) => {
                      const score = parseInt(e.target.value) || 0;
                      handleUpdateScore(editingMatch.id, 'team2', score);
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingMatch(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
