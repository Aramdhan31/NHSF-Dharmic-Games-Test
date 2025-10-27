"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Trophy, 
  Users, 
  Play, 
  Pause,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  Crown,
  Award
} from 'lucide-react'
import { realtimeDbUtils } from '@/lib/firebase-utils'

interface TournamentMatch {
  id: string
  round: string
  matchNumber: number
  team1?: string
  team2?: string
  team1Score?: number
  team2Score?: number
  winner?: string
  status: 'scheduled' | 'live' | 'completed'
  venue?: string
  date?: string
  time?: string
}

interface Tournament {
  id: string
  name: string
  sport: string
  zone: string
  format: string
  status: 'draft' | 'active' | 'completed'
  rounds: number
  currentRound: number
  matches: TournamentMatch[]
  participants: string[]
  settings: any
  createdAt: number
  updatedAt: number
}

interface University {
  id: string
  name: string
  university: string
  zone: string
}

interface TournamentBracketProps {
  tournamentId: string
  currentZone: string
}

export function TournamentBracket({ tournamentId, currentZone }: TournamentBracketProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [universities, setUniversities] = useState<{ [id: string]: University }>({})
  const [loading, setLoading] = useState(true)
  const [updatingMatch, setUpdatingMatch] = useState<string | null>(null)

  useEffect(() => {
    loadTournament()
  }, [tournamentId, currentZone])

  const loadTournament = async () => {
    try {
      setLoading(true)
      
      // Load tournament data
      const path = currentZone === 'ALL' ? `tournaments/${tournamentId}` : `zones/${currentZone}/tournaments/${tournamentId}`
      const tournamentResult = await realtimeDbUtils.getData(path)
      
      if (tournamentResult.success && tournamentResult.data) {
        setTournament(tournamentResult.data)
        
        // Load universities data for team names
        await loadUniversities(tournamentResult.data.participants)
      }
      
    } catch (error) {
      console.error('Error loading tournament:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUniversities = async (participantIds: string[]) => {
    try {
      const universitiesMap: { [id: string]: University } = {}
      
      if (currentZone === 'ALL') {
        // Load from all zones
        const zonesResult = await realtimeDbUtils.getData('zones')
        if (zonesResult.success && zonesResult.data) {
          Object.entries(zonesResult.data).forEach(([zone, zoneData]: [string, any]) => {
            if (zoneData.universities) {
              const zoneUnis = Array.isArray(zoneData.universities) 
                ? zoneData.universities 
                : Object.entries(zoneData.universities).map(([id, uni]: [string, any]) => ({ id, ...uni }))
              
              zoneUnis.forEach(uni => {
                if (participantIds.includes(uni.id)) {
                  universitiesMap[uni.id] = {
                    id: uni.id,
                    name: uni.name || uni.university || uni.id,
                    university: uni.university || uni.name || uni.id,
                    zone: uni.zone || zone
                  }
                }
              })
            }
          })
        }
      } else {
        // Load from specific zone
        const universitiesResult = await realtimeDbUtils.getData(`zones/${currentZone}/universities`)
        if (universitiesResult.success && universitiesResult.data) {
          const zoneUnis = Array.isArray(universitiesResult.data) 
            ? universitiesResult.data 
            : Object.entries(universitiesResult.data).map(([id, uni]: [string, any]) => ({ id, ...uni }))
          
          zoneUnis.forEach(uni => {
            if (participantIds.includes(uni.id)) {
              universitiesMap[uni.id] = {
                id: uni.id,
                name: uni.name || uni.university || uni.id,
                university: uni.university || uni.name || uni.id,
                zone: uni.zone || currentZone
              }
            }
          })
        }
      }
      
      setUniversities(universitiesMap)
    } catch (error) {
      console.error('Error loading universities:', error)
    }
  }

  const updateMatchScore = async (matchId: string, team1Score: number, team2Score: number) => {
    if (!tournament) return

    setUpdatingMatch(matchId)
    
    try {
      const winner = team1Score > team2Score ? 'team1' : team2Score > team1Score ? 'team2' : null
      
      const updatedMatches = tournament.matches.map(match => {
        if (match.id === matchId) {
          return {
            ...match,
            team1Score,
            team2Score,
            winner,
            status: 'completed' as const
          }
        }
        return match
      })

      const updatedTournament = {
        ...tournament,
        matches: updatedMatches,
        updatedAt: Date.now()
      }

      // Save to Firebase
      const path = currentZone === 'ALL' ? `tournaments/${tournamentId}` : `zones/${currentZone}/tournaments/${tournamentId}`
      await realtimeDbUtils.setData(path, updatedTournament)
      
      setTournament(updatedTournament)
      
    } catch (error) {
      console.error('Error updating match score:', error)
      alert('Failed to update match score')
    } finally {
      setUpdatingMatch(null)
    }
  }

  const startMatch = async (matchId: string) => {
    if (!tournament) return

    try {
      const updatedMatches = tournament.matches.map(match => {
        if (match.id === matchId) {
          return { ...match, status: 'live' as const }
        }
        return match
      })

      const updatedTournament = {
        ...tournament,
        matches: updatedMatches,
        updatedAt: Date.now()
      }

      const path = currentZone === 'ALL' ? `tournaments/${tournamentId}` : `zones/${currentZone}/tournaments/${tournamentId}`
      await realtimeDbUtils.setData(path, updatedTournament)
      
      setTournament(updatedTournament)
      
    } catch (error) {
      console.error('Error starting match:', error)
      alert('Failed to start match')
    }
  }

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'TBD'
    return universities[teamId]?.name || universities[teamId]?.university || teamId
  }

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return <Play className="h-3 w-3" />
      case 'completed': return <CheckCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  // Group matches by round
  const groupMatchesByRound = (matches: TournamentMatch[]) => {
    const rounds: { [round: string]: TournamentMatch[] } = {}
    
    matches.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = []
      }
      rounds[match.round].push(match)
    })
    
    // Sort matches within each round by match number
    Object.keys(rounds).forEach(round => {
      rounds[round].sort((a, b) => a.matchNumber - b.matchNumber)
    })
    
    return rounds
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tournament bracket...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tournament) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Tournament not found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const matchesByRound = groupMatchesByRound(tournament.matches)
  const roundNames = Object.keys(matchesByRound).sort()

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-orange-600" />
                <span>{tournament.name}</span>
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                <span className="flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  {tournament.sport}
                </span>
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {tournament.participants.length} teams
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {tournament.rounds} rounds
                </span>
              </div>
            </div>
            <Badge 
              variant={tournament.status === 'active' ? 'default' : 
                      tournament.status === 'completed' ? 'secondary' : 'outline'}
              className="text-lg px-4 py-2"
            >
              {tournament.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tournament Bracket */}
      <div className="space-y-8">
        {roundNames.map((roundName, roundIndex) => (
          <Card key={roundName}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {roundIndex === roundNames.length - 1 ? (
                  <Crown className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Trophy className="h-5 w-5 text-orange-600" />
                )}
                <span>{roundName}</span>
                {roundIndex === roundNames.length - 1 && (
                  <Badge variant="outline" className="ml-2">Final</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchesByRound[roundName].map((match) => (
                  <div key={match.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getMatchStatusColor(match.status)}>
                        {getMatchStatusIcon(match.status)}
                        <span className="ml-1">{match.status}</span>
                      </Badge>
                      <span className="text-sm text-gray-500">#{match.matchNumber}</span>
                    </div>

                    <div className="space-y-3">
                      {/* Team 1 */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{getTeamName(match.team1)}</span>
                        {match.status === 'completed' && (
                          <span className="font-bold text-lg">
                            {match.team1Score !== undefined ? match.team1Score : '-'}
                          </span>
                        )}
                      </div>

                      {/* VS */}
                      <div className="text-center text-gray-500 text-sm font-semibold">
                        VS
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{getTeamName(match.team2)}</span>
                        {match.status === 'completed' && (
                          <span className="font-bold text-lg">
                            {match.team2Score !== undefined ? match.team2Score : '-'}
                          </span>
                        )}
                      </div>

                      {/* Winner */}
                      {match.winner && match.status === 'completed' && (
                        <div className="text-center">
                          <Badge variant="default" className="bg-green-600">
                            <Crown className="h-3 w-3 mr-1" />
                            {match.winner === 'team1' ? getTeamName(match.team1) : getTeamName(match.team2)} WINS!
                          </Badge>
                        </div>
                      )}

                      {/* Match Details */}
                      <div className="text-xs text-gray-600 space-y-1">
                        {match.venue && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {match.venue}
                          </div>
                        )}
                        {match.date && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {match.date} {match.time}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {tournament.status === 'active' && (
                        <div className="space-y-2">
                          {match.status === 'scheduled' && (
                            <Button
                              size="sm"
                              onClick={() => startMatch(match.id)}
                              className="w-full"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Match
                            </Button>
                          )}
                          
                          {match.status === 'live' && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="number"
                                  placeholder="Score 1"
                                  min="0"
                                  onChange={(e) => {
                                    const team1Score = parseInt(e.target.value) || 0
                                    const team2Score = match.team2Score || 0
                                    updateMatchScore(match.id, team1Score, team2Score)
                                  }}
                                />
                                <Input
                                  type="number"
                                  placeholder="Score 2"
                                  min="0"
                                  onChange={(e) => {
                                    const team1Score = match.team1Score || 0
                                    const team2Score = parseInt(e.target.value) || 0
                                    updateMatchScore(match.id, team1Score, team2Score)
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tournament Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Completed Matches</span>
              <span className="font-semibold">
                {tournament.matches.filter(m => m.status === 'completed').length} / {tournament.matches.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(tournament.matches.filter(m => m.status === 'completed').length / tournament.matches.length) * 100}%` 
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Current Round: {tournament.currentRound}</span>
              <span>Total Rounds: {tournament.rounds}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
