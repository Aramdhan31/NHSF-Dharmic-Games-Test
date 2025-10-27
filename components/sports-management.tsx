"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Target,
  Calendar,
  Clock,
  MapPin
} from "lucide-react"
import { realtimeDbUtils } from "@/lib/firebase-utils"
import { universities as websiteUniversities } from "@/app/teams/page"

interface University {
  id: string
  name: string
  zone: string
  abbreviation: string
  isActive: boolean
  sports: string[]
  isCompeting: boolean
  members: number
  wins: number
  losses: number
  points: number
  description: string
  tournamentDate: string
  createdAt: any
  withdrawnSports?: string[]
  withdrawalReason?: string
}

interface Match {
  id: string
  sport: string
  university1: string
  university2: string
  university1Score?: number
  university2Score?: number
  status: 'scheduled' | 'live' | 'completed'
  scheduledTime?: string
  venue?: string
  zone: string
  createdAt: string
  updatedAt: string
}

interface SportsManagementProps {
  currentZone: string
  currentUser: any
}

export const SportsManagement = ({ currentZone, currentUser }: SportsManagementProps) => {
  const [universities, setUniversities] = useState<University[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [matchFormData, setMatchFormData] = useState({
    sport: "",
    university1: "",
    university2: "",
    scheduledTime: "",
    venue: "",
    status: "scheduled" as const
  })

  const availableSports = [
    "Netball",
    "Football", 
    "Kabaddi",
    "Kho kho",
    "Badminton"
  ]

  // Load universities and matches
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load universities (filtered by zone)
      const zoneUniversities = currentZone === 'ALL' 
        ? websiteUniversities 
        : websiteUniversities.filter(uni => uni.zone === currentZone)
      
      setUniversities(zoneUniversities)

      // Load matches
      const matchesPath = currentZone === 'ALL' 
        ? 'matches' 
        : `zones/${currentZone}/matches`
      
      const matchesResult = await realtimeDbUtils.getData(matchesPath)
      if (matchesResult.success && matchesResult.data) {
        const matchesData = Array.isArray(matchesResult.data)
          ? matchesResult.data
          : Object.entries(matchesResult.data).map(([firebaseId, match]: [string, any]) => ({
              ...(match as any),
              id: firebaseId
            }))
        setMatches(matchesData)
      } else {
        setMatches([])
      }
      
    } catch (err) {
      console.error('Error loading sports data:', err)
      setError("Failed to load sports data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentZone])

  // Get universities by sport
  const getUniversitiesBySport = (sport: string) => {
    return universities.filter(uni => 
      uni.sports && uni.sports.includes(sport) && !uni.withdrawnSports?.includes(sport)
    )
  }

  // Get matches by sport
  const getMatchesBySport = (sport: string) => {
    return matches.filter(match => match.sport === sport)
  }

  // Create new match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const newMatch: Omit<Match, 'id'> = {
        sport: matchFormData.sport,
        university1: matchFormData.university1,
        university2: matchFormData.university2,
        status: matchFormData.status,
        scheduledTime: matchFormData.scheduledTime,
        venue: matchFormData.venue,
        zone: currentZone === 'ALL' ? 'ALL' : currentZone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const path = currentZone === 'ALL' ? 'matches' : `zones/${currentZone}/matches`
      const result = await realtimeDbUtils.pushData(path, newMatch)

      if (result.success) {
        setSuccess("Match created successfully!")
        setIsMatchDialogOpen(false)
        setMatchFormData({
          sport: "",
          university1: "",
          university2: "",
          scheduledTime: "",
          venue: "",
          status: "scheduled"
        })
        loadData() // Reload data
      } else {
        setError(`Failed to create match: ${result.error}`)
      }
    } catch (err) {
      setError("Failed to create match")
    }
  }

  // Update match score
  const updateMatchScore = async (matchId: string, university1Score: number, university2Score: number) => {
    try {
      const path = currentZone === 'ALL' ? `matches/${matchId}` : `zones/${currentZone}/matches/${matchId}`
      const updates = {
        university1Score,
        university2Score,
        status: 'completed' as const,
        updatedAt: new Date().toISOString()
      }

      const result = await realtimeDbUtils.updateData(path, updates)
      if (result.success) {
        setSuccess("Match score updated successfully!")
        loadData()
      } else {
        setError(`Failed to update score: ${result.error}`)
      }
    } catch (err) {
      setError("Failed to update match score")
    }
  }

  // Start live match
  const startLiveMatch = async (matchId: string) => {
    try {
      const path = currentZone === 'ALL' ? `matches/${matchId}` : `zones/${currentZone}/matches/${matchId}`
      const updates = {
        status: 'live' as const,
        updatedAt: new Date().toISOString()
      }

      const result = await realtimeDbUtils.updateData(path, updates)
      if (result.success) {
        setSuccess("Match started live!")
        loadData()
      } else {
        setError(`Failed to start match: ${result.error}`)
      }
    } catch (err) {
      setError("Failed to start live match")
    }
  }

  // Add sport to university
  const addSportToUniversity = async (universityId: string, sport: string) => {
    try {
      const uni = universities.find(u => u.id === universityId)
      if (!uni) return

      const updatedSports = [...(uni.sports || []), sport]
      const path = currentZone === 'ALL' 
        ? `zones/${uni.zone}/universities/${universityId}` 
        : `zones/${currentZone}/universities/${universityId}`
      
      const updates = {
        sports: updatedSports,
        updatedAt: new Date().toISOString()
      }

      const result = await realtimeDbUtils.updateData(path, updates)
      if (result.success) {
        setSuccess(`${uni.name} added to ${sport}!`)
        loadData()
      } else {
        setError(`Failed to add sport: ${result.error}`)
      }
    } catch (err) {
      setError("Failed to add sport to university")
    }
  }

  // Remove sport from university
  const removeSportFromUniversity = async (universityId: string, sport: string) => {
    try {
      const uni = universities.find(u => u.id === universityId)
      if (!uni) return

      const updatedSports = (uni.sports || []).filter(s => s !== sport)
      const path = currentZone === 'ALL' 
        ? `zones/${uni.zone}/universities/${universityId}` 
        : `zones/${currentZone}/universities/${universityId}`
      
      const updates = {
        sports: updatedSports,
        updatedAt: new Date().toISOString()
      }

      const result = await realtimeDbUtils.updateData(path, updates)
      if (result.success) {
        setSuccess(`${uni.name} removed from ${sport}!`)
        loadData()
      } else {
        setError(`Failed to remove sport: ${result.error}`)
      }
    } catch (err) {
      setError("Failed to remove sport from university")
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading sports data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sports Management</h2>
          <p className="text-gray-600">Manage university sports assignments and matches</p>
        </div>
        <Button onClick={loadData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Sports Overview Tabs */}
      <Tabs defaultValue={availableSports[0]} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          {availableSports.map((sport) => (
            <TabsTrigger key={sport} value={sport} className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>{sport}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {availableSports.map((sport) => (
          <TabsContent key={sport} value={sport} className="space-y-6">
            {/* Sport Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Universities Playing This Sport */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Universities Playing {sport}</span>
                    </div>
                    {getUniversitiesBySport(sport).length > 0 && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          getUniversitiesBySport(sport).forEach(uni => removeSportFromUniversity(uni.id, sport))
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove All
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Universities currently playing this sport */}
                    {getUniversitiesBySport(sport).length > 0 ? (
                      getUniversitiesBySport(sport).map((uni) => (
                        <div key={uni.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{uni.name}</p>
                            <Badge 
                              variant="outline" 
                              className={
                                uni.zone === 'NZ+CZ' 
                                  ? 'border-red-500 text-red-700 bg-red-50' 
                                  : 'border-blue-500 text-blue-700 bg-blue-50'
                              }
                            >
                              {uni.zone}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={uni.isCompeting ? "default" : "secondary"}>
                              {uni.isCompeting ? "Competing" : "Not Competing"}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => removeSportFromUniversity(uni.id, sport)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No universities playing {sport}</p>
                    )}

                    {/* Universities that can be added to this sport */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Add University to {sport}:</h4>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const availableUnis = universities.filter(uni => 
                              !uni.sports?.includes(sport) && 
                              uni.isCompeting &&
                              (currentZone === 'ALL' || uni.zone === currentZone)
                            )
                            availableUnis.forEach(uni => addSportToUniversity(uni.id, sport))
                          }}
                          disabled={universities.filter(uni => 
                            !uni.sports?.includes(sport) && 
                            uni.isCompeting &&
                            (currentZone === 'ALL' || uni.zone === currentZone)
                          ).length === 0}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add All Available
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {universities
                          .filter(uni => 
                            !uni.sports?.includes(sport) && 
                            uni.isCompeting &&
                            (currentZone === 'ALL' || uni.zone === currentZone)
                          )
                          .map((uni) => (
                            <div key={uni.id} className="flex items-center justify-between p-2 border rounded-lg">
                              <div>
                                <p className="text-sm font-medium">{uni.name}</p>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    uni.zone === 'NZ+CZ' 
                                      ? 'border-red-500 text-red-700 bg-red-50' 
                                      : 'border-blue-500 text-blue-700 bg-blue-50'
                                  }
                                >
                                  {uni.zone}
                                </Badge>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => addSportToUniversity(uni.id, sport)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add to {sport}
                              </Button>
                            </div>
                          ))}
                        {universities.filter(uni => 
                          !uni.sports?.includes(sport) && 
                          uni.isCompeting &&
                          (currentZone === 'ALL' || uni.zone === currentZone)
                        ).length === 0 && (
                          <p className="text-gray-500 text-sm text-center py-2">
                            All competing universities are already assigned to {sport}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Matches for This Sport */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>{sport} Matches</span>
                    </div>
                    <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setMatchFormData(prev => ({ ...prev, sport }))}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Match
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create New {sport} Match</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateMatch} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="university1">University 1</Label>
                            <Select 
                              value={matchFormData.university1} 
                              onValueChange={(value) => setMatchFormData(prev => ({ ...prev, university1: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select university" />
                              </SelectTrigger>
                              <SelectContent>
                                {getUniversitiesBySport(sport).map((uni) => (
                                  <SelectItem key={uni.id} value={uni.name}>
                                    {uni.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="university2">University 2</Label>
                            <Select 
                              value={matchFormData.university2} 
                              onValueChange={(value) => setMatchFormData(prev => ({ ...prev, university2: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select university" />
                              </SelectTrigger>
                              <SelectContent>
                                {getUniversitiesBySport(sport)
                                  .filter(uni => uni.name !== matchFormData.university1)
                                  .map((uni) => (
                                    <SelectItem key={uni.id} value={uni.name}>
                                      {uni.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="scheduledTime">Scheduled Time</Label>
                            <Input
                              id="scheduledTime"
                              type="datetime-local"
                              value={matchFormData.scheduledTime}
                              onChange={(e) => setMatchFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="venue">Venue</Label>
                            <Input
                              id="venue"
                              value={matchFormData.venue}
                              onChange={(e) => setMatchFormData(prev => ({ ...prev, venue: e.target.value }))}
                              placeholder="Enter venue"
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsMatchDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">
                              Create Match
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getMatchesBySport(sport).length > 0 ? (
                      getMatchesBySport(sport).map((match) => (
                        <div key={match.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={
                                  match.status === 'completed' ? 'default' :
                                  match.status === 'live' ? 'destructive' : 'outline'
                                }
                              >
                                {match.status.toUpperCase()}
                              </Badge>
                              {match.scheduledTime && (
                                <Badge variant="outline">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(match.scheduledTime).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              {match.status === 'scheduled' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => startLiveMatch(match.id)}
                                >
                                  Start Live
                                </Button>
                              )}
                              {match.status === 'live' && (
                                <MatchScoreEditor 
                                  match={match}
                                  onUpdateScore={updateMatchScore}
                                />
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="font-medium">{match.university1}</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {match.university1Score ?? '--'}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{match.university2}</p>
                              <p className="text-2xl font-bold text-red-600">
                                {match.university2Score ?? '--'}
                              </p>
                            </div>
                          </div>

                          {match.venue && (
                            <div className="mt-3 text-center text-sm text-gray-600">
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {match.venue}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No matches scheduled for {sport}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

// Match Score Editor Component
interface MatchScoreEditorProps {
  match: Match
  onUpdateScore: (matchId: string, score1: number, score2: number) => void
}

const MatchScoreEditor = ({ match, onUpdateScore }: MatchScoreEditorProps) => {
  const [score1, setScore1] = useState(match.university1Score || 0)
  const [score2, setScore2] = useState(match.university2Score || 0)

  const handleUpdate = () => {
    onUpdateScore(match.id, score1, score2)
  }

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="number"
        value={score1}
        onChange={(e) => setScore1(parseInt(e.target.value) || 0)}
        className="w-16 text-center"
        placeholder="0"
      />
      <span className="text-gray-500">-</span>
      <Input
        type="number"
        value={score2}
        onChange={(e) => setScore2(parseInt(e.target.value) || 0)}
        className="w-16 text-center"
        placeholder="0"
      />
      <Button size="sm" onClick={handleUpdate}>
        Update
      </Button>
    </div>
  )
}
