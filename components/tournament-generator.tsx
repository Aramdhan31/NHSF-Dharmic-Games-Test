"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Trophy, 
  Users, 
  Settings, 
  Play, 
  RotateCcw, 
  Award,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Zap
} from 'lucide-react'
import { realtimeDbUtils } from '@/lib/firebase-utils'

interface University {
  id: string
  name: string
  university: string
  zone: string
  sports: string[]
  sportPlayers?: { [sport: string]: number }
}

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
  format: 'single-elimination' | 'double-elimination' | 'round-robin' | 'group-stage'
  status: 'draft' | 'active' | 'completed'
  rounds: number
  currentRound: number
  matches: TournamentMatch[]
  participants: string[]
  settings: {
    teamsPerMatch: number
    maxRounds: number
    timePerMatch: number
    venues: string[]
  }
  createdAt: number
  updatedAt: number
}

interface TournamentGeneratorProps {
  currentZone: string
  currentUser: any
}

export function TournamentGenerator({ currentZone, currentUser }: TournamentGeneratorProps) {
  const [universities, setUniversities] = useState<University[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedSport, setSelectedSport] = useState<string>('')
  const [selectedFormat, setSelectedFormat] = useState<string>('single-elimination')
  const [tournamentName, setTournamentName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Load universities with sports assigned
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load universities for the current zone
        const path = currentZone === 'ALL' ? 'zones' : `zones/${currentZone}`
        const result = await realtimeDbUtils.getData(path)
        
        if (result.success && result.data) {
          const allUniversities: University[] = []
          
          if (currentZone === 'ALL') {
            // Load from all zones
            Object.entries(result.data).forEach(([zone, zoneData]: [string, any]) => {
              if (zoneData.universities) {
                const zoneUnis = Array.isArray(zoneData.universities) 
                  ? zoneData.universities 
                  : Object.entries(zoneData.universities).map(([id, uni]: [string, any]) => ({ id, ...uni }))
                
                zoneUnis.forEach(uni => {
                  allUniversities.push({
                    ...uni,
                    zone,
                    name: uni.name || uni.university || uni.id
                  })
                })
              }
            })
          } else {
            // Load from specific zone
            if (result.data.universities) {
              const zoneUnis = Array.isArray(result.data.universities) 
                ? result.data.universities 
                : Object.entries(result.data.universities).map(([id, uni]: [string, any]) => ({ id, ...uni }))
              
              zoneUnis.forEach(uni => {
                allUniversities.push({
                  ...uni,
                  zone: currentZone,
                  name: uni.name || uni.university || uni.id
                })
              })
            }
          }
          
          // Filter universities that have sports assigned
          const universitiesWithSports = allUniversities.filter(uni => 
            uni.sports && uni.sports.length > 0
          )
          
          setUniversities(universitiesWithSports)
        }
        
        // Load existing tournaments
        await loadTournaments()
        
      } catch (error) {
        console.error('Error loading tournament data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentZone])

  const loadTournaments = async () => {
    try {
      const path = currentZone === 'ALL' ? 'tournaments' : `zones/${currentZone}/tournaments`
      const result = await realtimeDbUtils.getData(path)
      
      if (result.success && result.data) {
        const tournamentsList = Array.isArray(result.data) 
          ? result.data 
          : Object.entries(result.data).map(([id, tournament]: [string, any]) => ({ id, ...tournament }))
        
        setTournaments(tournamentsList)
      }
    } catch (error) {
      console.error('Error loading tournaments:', error)
    }
  }

  // Get available sports from universities
  const getAvailableSports = () => {
    const sportsSet = new Set<string>()
    universities.forEach(uni => {
      if (uni.sports) {
        uni.sports.forEach(sport => sportsSet.add(sport))
      }
    })
    return Array.from(sportsSet)
  }

  // Get universities playing selected sport
  const getUniversitiesForSport = (sport: string) => {
    return universities.filter(uni => uni.sports?.includes(sport))
  }

  // Generate tournament bracket
  const generateTournament = async () => {
    if (!selectedSport || !tournamentName.trim()) {
      alert('Please select a sport and enter a tournament name')
      return
    }

    const participatingUniversities = getUniversitiesForSport(selectedSport)
    
    if (participatingUniversities.length < 2) {
      alert('Need at least 2 universities to create a tournament')
      return
    }

    setGenerating(true)

    try {
      const tournamentId = `tournament_${Date.now()}`
      const tournament: Tournament = {
        id: tournamentId,
        name: tournamentName.trim(),
        sport: selectedSport,
        zone: currentZone,
        format: selectedFormat as any,
        status: 'draft',
        rounds: calculateRounds(participatingUniversities.length, selectedFormat),
        currentRound: 0,
        matches: generateMatches(participatingUniversities, selectedFormat),
        participants: participatingUniversities.map(uni => uni.id),
        settings: {
          teamsPerMatch: 2,
          maxRounds: 8,
          timePerMatch: 90, // minutes
          venues: ['Main Arena', 'Court 1', 'Court 2', 'Court 3']
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // Save tournament to Firebase
      const path = currentZone === 'ALL' ? `tournaments/${tournamentId}` : `zones/${currentZone}/tournaments/${tournamentId}`
      await realtimeDbUtils.setData(path, tournament)

      // Reload tournaments
      await loadTournaments()

      // Reset form
      setTournamentName('')
      setSelectedSport('')

      alert(`Tournament "${tournament.name}" created successfully!`)

    } catch (error) {
      console.error('Error creating tournament:', error)
      alert('Failed to create tournament. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Calculate number of rounds needed
  const calculateRounds = (teamCount: number, format: string): number => {
    switch (format) {
      case 'single-elimination':
        return Math.ceil(Math.log2(teamCount))
      case 'double-elimination':
        return Math.ceil(Math.log2(teamCount)) * 2
      case 'round-robin':
        return teamCount - 1
      case 'group-stage':
        return Math.ceil(teamCount / 4) + Math.ceil(Math.log2(Math.ceil(teamCount / 4)))
      default:
        return Math.ceil(Math.log2(teamCount))
    }
  }

  // Generate matches for tournament
  const generateMatches = (universities: University[], format: string): TournamentMatch[] => {
    const matches: TournamentMatch[] = []
    const shuffled = [...universities].sort(() => Math.random() - 0.5) // Randomize

    switch (format) {
      case 'single-elimination':
        return generateSingleEliminationMatches(shuffled)
      case 'round-robin':
        return generateRoundRobinMatches(shuffled)
      default:
        return generateSingleEliminationMatches(shuffled)
    }
  }

  // Generate single elimination bracket
  const generateSingleEliminationMatches = (universities: University[]): TournamentMatch[] => {
    const matches: TournamentMatch[] = []
    let round = 1
    let currentTeams = [...universities]
    let matchNumber = 1

    // First round - pair up teams
    while (currentTeams.length > 1) {
      const nextRoundTeams: University[] = []
      
      for (let i = 0; i < currentTeams.length; i += 2) {
        const team1 = currentTeams[i]
        const team2 = currentTeams[i + 1] || null // Bye if odd number
        
        matches.push({
          id: `match_${matchNumber}`,
          round: `Round ${round}`,
          matchNumber: matchNumber++,
          team1: team1.id,
          team2: team2?.id,
          status: 'scheduled',
          venue: 'Main Arena',
          date: new Date(Date.now() + (round - 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '14:00'
        })
        
        if (team2) {
          nextRoundTeams.push(null as any) // Winner placeholder
        } else {
          // Bye - team1 advances
          nextRoundTeams.push(team1)
        }
      }
      
      currentTeams = nextRoundTeams
      round++
    }

    return matches
  }

  // Generate round robin matches
  const generateRoundRobinMatches = (universities: University[]): TournamentMatch[] => {
    const matches: TournamentMatch[] = []
    let matchNumber = 1

    for (let i = 0; i < universities.length; i++) {
      for (let j = i + 1; j < universities.length; j++) {
        matches.push({
          id: `match_${matchNumber}`,
          round: 'Round Robin',
          matchNumber: matchNumber++,
          team1: universities[i].id,
          team2: universities[j].id,
          status: 'scheduled',
          venue: 'Main Arena',
          date: new Date(Date.now() + (matchNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '14:00'
        })
      }
    }

    return matches
  }

  // Start tournament
  const startTournament = async (tournament: Tournament) => {
    try {
      const updatedTournament = {
        ...tournament,
        status: 'active' as const,
        currentRound: 1,
        updatedAt: Date.now()
      }

      const path = currentZone === 'ALL' ? `tournaments/${tournament.id}` : `zones/${currentZone}/tournaments/${tournament.id}`
      await realtimeDbUtils.setData(path, updatedTournament)
      
      await loadTournaments()
      alert(`Tournament "${tournament.name}" has started!`)
    } catch (error) {
      console.error('Error starting tournament:', error)
      alert('Failed to start tournament')
    }
  }

  // Delete tournament
  const deleteTournament = async (tournament: Tournament) => {
    if (!confirm(`Are you sure you want to delete "${tournament.name}"?`)) return

    try {
      const path = currentZone === 'ALL' ? `tournaments/${tournament.id}` : `zones/${currentZone}/tournaments/${tournament.id}`
      await realtimeDbUtils.deleteData(path)
      
      await loadTournaments()
      alert(`Tournament "${tournament.name}" deleted`)
    } catch (error) {
      console.error('Error deleting tournament:', error)
      alert('Failed to delete tournament')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tournament data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tournament Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-orange-600" />
            <span>Tournament Generator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input
                id="tournament-name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="e.g., Football Championship 2024"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sport-select">Sport</Label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSports().map(sport => (
                    <SelectItem key={sport} value={sport}>
                      {sport} ({getUniversitiesForSport(sport).length} teams)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format-select">Tournament Format</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-elimination">
                  Single Elimination (Knockout)
                </SelectItem>
                <SelectItem value="double-elimination">
                  Double Elimination
                </SelectItem>
                <SelectItem value="round-robin">
                  Round Robin (Everyone plays everyone)
                </SelectItem>
                <SelectItem value="group-stage">
                  Group Stage + Knockouts
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedSport && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                {selectedSport} Tournament Preview
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Participating Teams:</span>
                  <span className="ml-2 font-medium">{getUniversitiesForSport(selectedSport).length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Total Rounds:</span>
                  <span className="ml-2 font-medium">
                    {calculateRounds(getUniversitiesForSport(selectedSport).length, selectedFormat)}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-blue-700">Teams:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {getUniversitiesForSport(selectedSport).map(uni => (
                    <Badge key={uni.id} variant="outline" className="text-xs">
                      {uni.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={generateTournament}
            disabled={generating || !selectedSport || !tournamentName.trim()}
            className="w-full"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Tournament...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Tournament
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Tournaments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-green-600" />
            <span>Existing Tournaments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tournaments created yet</p>
              <p className="text-sm">Create your first tournament above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map(tournament => (
                <div key={tournament.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{tournament.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={tournament.status === 'active' ? 'default' : 
                                tournament.status === 'completed' ? 'secondary' : 'outline'}
                      >
                        {tournament.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTournament(tournament)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Format: {tournament.format.replace('-', ' ').toUpperCase()}
                    </div>
                    {tournament.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => startTournament(tournament)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Tournament
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
