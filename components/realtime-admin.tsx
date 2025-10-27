"use client";

import React, { useState } from 'react';
import { realtimeResultsService } from '@/lib/realtime-results';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Trophy, 
  Users, 
  Target,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function RealtimeAdmin() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Match update form
  const [matchForm, setMatchForm] = useState({
    matchId: '',
    player1Score: 0,
    player2Score: 0,
    winner: ''
  });

  // Player score update form
  const [playerForm, setPlayerForm] = useState({
    playerId: '',
    zone: '',
    newScore: 0,
    isWin: false
  });

  // Zone reset form
  const [zoneReset, setZoneReset] = useState({
    zone: ''
  });

  const handleMatchUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await realtimeResultsService.updateMatchResult(
        matchForm.matchId,
        matchForm.player1Score,
        matchForm.player2Score,
        matchForm.winner
      );

      if (result.success) {
        setSuccess('Match results updated successfully!');
        setMatchForm({ matchId: '', player1Score: 0, player2Score: 0, winner: '' });
      } else {
        setError(result.error || 'Failed to update match results');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerScoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await realtimeResultsService.updatePlayerScore(
        playerForm.playerId,
        playerForm.zone,
        playerForm.newScore,
        playerForm.isWin
      );

      if (result.success) {
        setSuccess('Player score updated successfully!');
        setPlayerForm({ playerId: '', zone: '', newScore: 0, isWin: false });
      } else {
        setError(result.error || 'Failed to update player score');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleZoneReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await realtimeResultsService.resetZoneData(zoneReset.zone);

      if (result.success) {
        setSuccess(`${zoneReset.zone} zone data reset successfully!`);
        setZoneReset({ zone: '' });
      } else {
        setError(result.error || 'Failed to reset zone data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const startLiveMatch = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const matchId = `match_${Date.now()}`;
      const matchData = {
        id: matchId,
        player1: {
          id: 'player1',
          name: 'Player 1',
          zone: 'LZ',
          score: 0
        },
        player2: {
          id: 'player2',
          name: 'Player 2',
          zone: 'SZ',
          score: 0
        },
        status: 'waiting' as const,
        gameType: 'Quiz',
        startTime: Date.now(),
        round: 1,
        totalRounds: 5
      };

      const result = await realtimeResultsService.startLiveMatch(matchData);

      if (result.success) {
        setSuccess(`Live match ${matchId} started successfully!`);
      } else {
        setError(result.error || 'Failed to start live match');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span>{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={startLiveMatch} 
              disabled={loading}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Play className="h-6 w-6" />
              <span>Start Live Match</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Target className="h-6 w-6" />
              <span>Refresh Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Match Results Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Update Match Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMatchUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="matchId">Match ID</Label>
                <Input
                  id="matchId"
                  value={matchForm.matchId}
                  onChange={(e) => setMatchForm({ ...matchForm, matchId: e.target.value })}
                  placeholder="Enter match ID"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="winner">Winner</Label>
                <Select value={matchForm.winner} onValueChange={(value) => setMatchForm({ ...matchForm, winner: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select winner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player1">Player 1</SelectItem>
                    <SelectItem value="player2">Player 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="player1Score">Player 1 Score</Label>
                <Input
                  id="player1Score"
                  type="number"
                  value={matchForm.player1Score}
                  onChange={(e) => setMatchForm({ ...matchForm, player1Score: parseInt(e.target.value) || 0 })}
                  placeholder="Enter score"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="player2Score">Player 2 Score</Label>
                <Input
                  id="player2Score"
                  type="number"
                  value={matchForm.player2Score}
                  onChange={(e) => setMatchForm({ ...matchForm, player2Score: parseInt(e.target.value) || 0 })}
                  placeholder="Enter score"
                  required
                />
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Update Match Results'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Player Score Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-500" />
            <span>Update Player Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePlayerScoreUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="playerId">Player ID</Label>
                <Input
                  id="playerId"
                  value={playerForm.playerId}
                  onChange={(e) => setPlayerForm({ ...playerForm, playerId: e.target.value })}
                  placeholder="Enter player ID"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="zone">Zone</Label>
                <Select value={playerForm.zone} onValueChange={(value) => setPlayerForm({ ...playerForm, zone: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LZ">London Zone (LZ)</SelectItem>
                    <SelectItem value="SZ">South Zone (SZ)</SelectItem>
                    <SelectItem value="CZ">Central Zone (CZ)</SelectItem>
                    <SelectItem value="NZ">North Zone (NZ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="newScore">New Score</Label>
                <Input
                  id="newScore"
                  type="number"
                  value={playerForm.newScore}
                  onChange={(e) => setPlayerForm({ ...playerForm, newScore: parseInt(e.target.value) || 0 })}
                  placeholder="Enter new score"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isWin"
                  checked={playerForm.isWin}
                  onChange={(e) => setPlayerForm({ ...playerForm, isWin: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isWin">Is Win</Label>
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Update Player Score'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Zone Reset */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Square className="h-5 w-5 text-red-500" />
            <span>Reset Zone Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleZoneReset} className="space-y-4">
            <div>
              <Label htmlFor="resetZone">Zone to Reset</Label>
              <Select value={zoneReset.zone} onValueChange={(value) => setZoneReset({ zone: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone to reset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LZ">London Zone (LZ)</SelectItem>
                  <SelectItem value="SZ">South Zone (SZ)</SelectItem>
                  <SelectItem value="CZ">Central Zone (CZ)</SelectItem>
                  <SelectItem value="NZ">North Zone (NZ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading} 
              variant="destructive" 
              className="w-full"
            >
              {loading ? 'Resetting...' : 'Reset Zone Data'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
