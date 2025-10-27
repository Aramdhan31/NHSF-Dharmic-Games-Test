"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { realtimeResultsService } from '@/lib/realtime-results'
import { realtimeDbUtils } from '@/lib/firebase-utils'
import { Play, Square, Trophy, Clock } from 'lucide-react'

interface LiveMatch {
  id: string
  university1: {
    id: string
    university: string
    zone: string
    score: number
  }
  university2: {
    id: string
    university: string
    zone: string
    score: number
  }
  status: 'waiting' | 'active' | 'completed' | 'live'
  sport: string
  startTime: number
  endTime?: number
  winner?: string
  currentScore?: string
  timeRemaining?: string
  period?: string
  venue?: string
}

interface LiveMatchAdminProps {
  currentZone: string
  currentUser: any
}

export function LiveMatchAdmin({ currentZone, currentUser }: LiveMatchAdminProps) {
  const [matches, setMatches] = useState<{ [matchId: string]: LiveMatch }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [scoreUpdate, setScoreUpdate] = useState({
    university1Score: 0,
    university2Score: 0
  })

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true)
        const path = currentZone === 'ALL' ? 'zones' : `zones/${currentZone}`
        const result = await realtimeDbUtils.getData(path)
        
        if (result.success && result.data) {
          const allMatches: { [matchId: string]: LiveMatch } = {}
          
          if (currentZone === 'ALL') {
            // Load matches from all zones
            Object.keys(result.data).forEach(zone => {
              if (result.data[zone].matches) {
                Object.entries(result.data[zone].matches).forEach(([matchId, match]: [string, any]) => {
                  allMatches[matchId] = { ...match, zone }
                })
              }
            })
          } else {
            // Load matches from specific zone
            if (result.data.matches) {
              Object.entries(result.data.matches).forEach(([matchId, match]: [string, any]) => {
                allMatches[matchId] = { ...match, zone: currentZone }
              })
            }
          }
          
          setMatches(allMatches)
        }
      } catch (err) {
        console.error('Error loading matches:', err)
        setError('Failed to load matches')
      } finally {
        setLoading(false)
      }
    }

    loadMatches()

    // Set up real-time listener for matches
    const path = currentZone === 'ALL' ? 'zones' : `zones/${currentZone}`
    const unsubscribe = realtimeDbUtils.listenToData(path, (data) => {
      if (data) {
        const allMatches: { [matchId: string]: LiveMatch } = {}
        
        if (currentZone === 'ALL') {
          Object.keys(data).forEach(zone => {
            if (data[zone].matches) {
              Object.entries(data[zone].matches).forEach(([matchId, match]: [string, any]) => {
                allMatches[matchId] = { ...match, zone }
              })
            }
          })
        } else {
          if (data.matches) {
            Object.entries(data.matches).forEach(([matchId, match]: [string, any]) => {
              allMatches[matchId] = { ...match, zone: currentZone }
            })
          }
        }
        
        setMatches(allMatches)
      }
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [currentZone])

  const handleScoreUpdate = async () => {
    if (!selectedMatch) return

    const match = matches[selectedMatch]
    if (!match) return

    try {
      setError(null)
      setSuccess(null)

      const result = await realtimeResultsService.updateLiveMatchScore(
        selectedMatch,
        scoreUpdate.university1Score,
        scoreUpdate.university2Score,
        match.sport,
        match.zone
      )

      if (result.success) {
        setSuccess('Score updated successfully!')
        // Reset form
        setScoreUpdate({ university1Score: 0, university2Score: 0 })
      } else {
        setError('Failed to update score')
      }
    } catch (err) {
      console.error('Error updating score:', err)
      setError('Failed to update score')
    }
  }

  const handleCompleteMatch = async () => {
    if (!selectedMatch) return

    const match = matches[selectedMatch]
    if (!match) return

    try {
      setError(null)
      setSuccess(null)

      // Determine winner
      let winnerId = ''
      if (scoreUpdate.university1Score > scoreUpdate.university2Score) {
        winnerId = match.university1.id
      } else if (scoreUpdate.university2Score > scoreUpdate.university1Score) {
        winnerId = match.university2.id
      }

      const finalScore = `${scoreUpdate.university1Score}-${scoreUpdate.university2Score}`

      const result = await realtimeResultsService.completeLiveMatch(
        selectedMatch,
        match.zone,
        winnerId,
        finalScore
      )

      if (result.success) {
        setSuccess('Match completed successfully!')
        setSelectedMatch(null)
        setScoreUpdate({ university1Score: 0, university2Score: 0 })
      } else {
        setError('Failed to complete match')
      }
    } catch (err) {
      console.error('Error completing match:', err)
      setError('Failed to complete match')
    }
  }

  const liveMatches = Object.entries(matches).filter(([_, match]) => 
    match.status === 'live' || match.status === 'active'
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5 text-green-600" />
            <span>Live Match Updates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading live matches...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="h-5 w-5 text-green-600" />
          <span>Live Match Updates</span>
          <Badge variant="outline" className="ml-auto">
            {liveMatches.length} Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {liveMatches.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No live matches at the moment</p>
          </div>
        ) : (
          <>
            {/* Match Selection */}
            <div className="space-y-2">
              <Label>Select Live Match</Label>
              <Select value={selectedMatch || ''} onValueChange={setSelectedMatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a live match to update" />
                </SelectTrigger>
                <SelectContent>
                  {liveMatches.map(([matchId, match]) => (
                    <SelectItem key={matchId} value={matchId}>
                      {match.university1.university} vs {match.university2.university} ({match.sport})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Score Update Form */}
            {selectedMatch && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Update Score</h3>
                  <Badge variant="outline">{matches[selectedMatch].sport}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{matches[selectedMatch].university1.university}</Label>
                    <Input
                      type="number"
                      value={scoreUpdate.university1Score}
                      onChange={(e) => setScoreUpdate(prev => ({
                        ...prev,
                        university1Score: parseInt(e.target.value) || 0
                      }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{matches[selectedMatch].university2.university}</Label>
                    <Input
                      type="number"
                      value={scoreUpdate.university2Score}
                      onChange={(e) => setScoreUpdate(prev => ({
                        ...prev,
                        university2Score: parseInt(e.target.value) || 0
                      }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleScoreUpdate} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Update Score
                  </Button>
                  <Button 
                    onClick={handleCompleteMatch} 
                    variant="outline"
                    className="flex-1"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Complete Match
                  </Button>
                </div>
              </div>
            )}

            {/* Live Matches List */}
            <div className="space-y-3">
              <h3 className="font-semibold">Current Live Matches</h3>
              {liveMatches.map(([matchId, match]) => (
                <div key={matchId} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div>
                    <div className="font-medium">
                      {match.university1.university} vs {match.university2.university}
                    </div>
                    <div className="text-sm text-gray-600">
                      {match.sport} • {match.currentScore || '0-0'}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    LIVE
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
