"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Users, 
  Play, 
  Eye,
  Calendar,
  Award,
  Crown,
  Clock,
  MapPin
} from 'lucide-react'
import { realtimeDbUtils } from '@/lib/firebase-utils'
import { TournamentBracket } from './tournament-bracket'

interface Tournament {
  id: string
  name: string
  sport: string
  zone: string
  format: string
  status: 'draft' | 'active' | 'completed'
  rounds: number
  currentRound: number
  matches: any[]
  participants: string[]
  settings: any
  createdAt: number
  updatedAt: number
}

interface TournamentListProps {
  currentZone: string
  currentUser: any
}

export function TournamentList({ currentZone, currentUser }: TournamentListProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTournaments()
  }, [currentZone])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      
      const path = currentZone === 'ALL' ? 'tournaments' : `zones/${currentZone}/tournaments`
      const result = await realtimeDbUtils.getData(path)
      
      if (result.success && result.data) {
        const tournamentsList = Array.isArray(result.data) 
          ? result.data 
          : Object.entries(result.data).map(([id, tournament]: [string, any]) => ({ id, ...tournament }))
        
        // Sort by creation date (newest first)
        tournamentsList.sort((a, b) => b.createdAt - a.createdAt)
        
        setTournaments(tournamentsList)
      }
      
    } catch (error) {
      console.error('Error loading tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFormatDisplayName = (format: string) => {
    return format.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getCompletedMatchesCount = (tournament: Tournament) => {
    return tournament.matches.filter(match => match.status === 'completed').length
  }

  const getProgressPercentage = (tournament: Tournament) => {
    if (tournament.matches.length === 0) return 0
    return Math.round((getCompletedMatchesCount(tournament) / tournament.matches.length) * 100)
  }

  if (selectedTournament) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setSelectedTournament(null)}
          >
            ← Back to Tournaments
          </Button>
          <h2 className="text-xl font-semibold">{selectedTournament.name}</h2>
        </div>
        
        <TournamentBracket
          tournamentId={selectedTournament.id}
          currentZone={currentZone}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tournaments...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-orange-600" />
            <span>All Tournaments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tournaments found</p>
              <p className="text-sm">Create tournaments in the Tournament Generator section</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map(tournament => (
                <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{tournament.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {tournament.sport}
                          </Badge>
                          <Badge className={getStatusColor(tournament.status)}>
                            {tournament.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTournament(tournament)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          Teams
                        </span>
                        <span className="font-medium">{tournament.participants.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-gray-600">
                          <Award className="h-4 w-4 mr-1" />
                          Format
                        </span>
                        <span className="font-medium">{getFormatDisplayName(tournament.format)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          Rounds
                        </span>
                        <span className="font-medium">{tournament.rounds}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          Progress
                        </span>
                        <span className="font-medium">
                          {getCompletedMatchesCount(tournament)}/{tournament.matches.length} matches
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span>{getProgressPercentage(tournament)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(tournament)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedTournament(tournament)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Bracket
                      </Button>
                    </div>
                    
                    {/* Tournament Status */}
                    {tournament.status === 'active' && (
                      <div className="flex items-center justify-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        <Play className="h-3 w-3" />
                        <span>Live Tournament</span>
                      </div>
                    )}
                    
                    {tournament.status === 'completed' && (
                      <div className="flex items-center justify-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        <Crown className="h-3 w-3" />
                        <span>Tournament Complete</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
