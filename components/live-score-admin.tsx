"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trophy, Play, Pause, Square, Clock, Target, Save, RefreshCw } from 'lucide-react';
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

interface LiveScoreAdminProps {
  currentZone?: string;
}

export function LiveScoreAdmin({ currentZone = 'all' }: LiveScoreAdminProps) {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [status, setStatus] = useState<'scheduled' | 'live' | 'completed' | 'paused'>('scheduled');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, [currentZone]);

  const loadMatches = async () => {
    try {
      const matchesRef = ref(realtimeDb, 'matches');
      const unsubscribe = onValue(matchesRef, (snapshot) => {
        if (snapshot.exists()) {
          const matchesData = snapshot.val();
          const matchesList = Object.entries(matchesData).map(([id, match]: [string, any]) => ({
            id,
            ...match,
            lastUpdated: match.lastUpdated || Date.now()
          }));

          const filteredMatches = currentZone === 'all' 
            ? matchesList 
            : matchesList.filter(match => match.zone === currentZone);

          setMatches(filteredMatches);
        } else {
          setMatches([]);
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Failed to load matches');
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedMatch) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const matchId = `match-${Date.now()}`;
      const matchData: LiveMatch = {
        id: matchId,
        teamA: selectedMatch.split(' vs ')[0] || 'Team A',
        teamB: selectedMatch.split(' vs ')[1] || 'Team B',
        scoreA: 0,
        scoreB: 0,
        sport: 'Kho Kho', // Default sport
        zone: currentZone,
        status: 'scheduled',
        lastUpdated: Date.now()
      };

      await set(ref(realtimeDb, `matches/${matchId}`), matchData);
      setSuccess('Match created successfully!');
      
      // Reset form
      setSelectedMatch('');
      setScoreA(0);
      setScoreB(0);
      setStatus('scheduled');
      setAdminNotes('');
    } catch (err) {
      console.error('Error creating match:', err);
      setError('Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async () => {
    if (!selectedMatch) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const match = matches.find(m => m.id === selectedMatch);
      if (!match) return;

      const updates: any = {
        scoreA,
        scoreB,
        status,
        lastUpdated: Date.now()
      };

      // Add timestamps based on status
      if (status === 'live' && match.status !== 'live') {
        updates.startTime = Date.now();
      }
      if (status === 'completed' && match.status !== 'completed') {
        updates.endTime = Date.now();
      }
      if (adminNotes) {
        updates.adminNotes = adminNotes;
      }

      await update(ref(realtimeDb, `matches/${selectedMatch}`), updates);
      setSuccess('Score updated successfully!');
      
      // Reset form
      setScoreA(0);
      setScoreB(0);
      setAdminNotes('');
    } catch (err) {
      console.error('Error updating score:', err);
      setError('Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchSelect = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(matchId);
      setScoreA(match.scoreA);
      setScoreB(match.scoreB);
      setStatus(match.status);
      setAdminNotes(match.adminNotes || '');
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

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Create New Match */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Create New Match
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="teamA">Team A</Label>
              <Input
                id="teamA"
                placeholder="e.g., University of Manchester"
                value={selectedMatch.split(' vs ')[0] || ''}
                onChange={(e) => setSelectedMatch(`${e.target.value} vs ${selectedMatch.split(' vs ')[1] || ''}`)}
              />
            </div>
            <div>
              <Label htmlFor="teamB">Team B</Label>
              <Input
                id="teamB"
                placeholder="e.g., Imperial College"
                value={selectedMatch.split(' vs ')[1] || ''}
                onChange={(e) => setSelectedMatch(`${selectedMatch.split(' vs ')[0] || ''} vs ${e.target.value}`)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleCreateMatch}
            disabled={loading || !selectedMatch}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trophy className="h-4 w-4 mr-2" />
            )}
            Create Match
          </Button>
        </CardContent>
      </Card>

      {/* Update Existing Match */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Update Match Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select Match */}
          <div>
            <Label htmlFor="matchSelect">Select Match</Label>
            <Select value={selectedMatch} onValueChange={handleMatchSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a match to update" />
              </SelectTrigger>
              <SelectContent>
                {matches.map((match) => (
                  <SelectItem key={match.id} value={match.id}>
                    <div className="flex items-center gap-2">
                      <span>{match.teamA} vs {match.teamB}</span>
                      {getStatusBadge(match.status)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMatch && (
            <>
              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scoreA">Score A</Label>
                  <Input
                    id="scoreA"
                    type="number"
                    min="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="scoreB">Score B</Label>
                  <Input
                    id="scoreB"
                    type="number"
                    min="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Match Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Scheduled
                      </div>
                    </SelectItem>
                    <SelectItem value="live">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Live
                      </div>
                    </SelectItem>
                    <SelectItem value="paused">
                      <div className="flex items-center gap-2">
                        <Pause className="h-4 w-4" />
                        Paused
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <Square className="h-4 w-4" />
                        Completed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add any notes about the match..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              {/* Update Button */}
              <Button 
                onClick={handleUpdateScore}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Score
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Current Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Current Matches ({matches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No matches found. Create a new match to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className={`p-3 rounded border ${
                    match.status === 'live' 
                      ? 'border-red-200 bg-red-50' 
                      : match.status === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{match.teamA} vs {match.teamB}</span>
                      <span className="text-sm text-gray-500">({match.sport})</span>
                      {getStatusBadge(match.status)}
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {match.scoreA} - {match.scoreB}
                    </div>
                  </div>
                  {match.adminNotes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Note:</strong> {match.adminNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
