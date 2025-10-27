"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Gamepad2, Plus, Edit, Trash2, AlertCircle, CheckCircle, Clock, Trophy, GraduationCap, Play, Square, Award } from "lucide-react"
import { realtimeDbUtils } from "@/lib/firebase-utils"
import { realtimeResultsService } from "@/lib/realtime-results"

interface Match {
  id: string
  team1: string
  team2: string
  sport: string
  venue: string
  date: string
  time: string
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  score?: string
  winner?: string
  wickets?: string
  cricketStats?: {
    wickets1: number
    wickets2: number
    substitutions: Array<{ playerOut: string; playerIn: string; time: string }>
    target: number
  }
  createdAt: Date
}

interface University {
  id: string
  name: string
  abbreviation: string
  zone: string
  createdAt: Date
}

interface FormData {
  team1: string
  team2: string
  sport: string
  venue: string
  date: string
  time: string
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
}

interface MatchManagementProps {
  currentZone: string
}

export function MatchManagement({ currentZone }: MatchManagementProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [liveScore, setLiveScore] = useState<{ [matchId: string]: { team1: number; team2: number } }>({})
  const [cricketStats, setCricketStats] = useState<{ [matchId: string]: { 
    wickets1: number; 
    wickets2: number; 
    substitutions: Array<{ playerOut: string; playerIn: string; time: string }>;
    target: number;
  } }>({})
  const [formData, setFormData] = useState<FormData>({
    team1: "",
    team2: "",
    sport: "",
    venue: "",
    date: "",
    time: "",
    status: "scheduled"
  })

  const sports = [
    { value: "football", label: "Football" },
    { value: "basketball", label: "Basketball" },
    { value: "cricket", label: "Cricket" },
    { value: "tennis", label: "Tennis" },
    { value: "badminton", label: "Badminton" },
    { value: "volleyball", label: "Volleyball" }
  ]

  // Sport-specific scoring configurations
  const sportScoringConfig = {
    football: {
      name: "Goals",
      increment: 1,
      maxScore: 20,
      displayFormat: (team1: number, team2: number) => `${team1}-${team2}`,
      isCricket: false
    },
    basketball: {
      name: "Points",
      increment: 1,
      maxScore: 200,
      displayFormat: (team1: number, team2: number) => `${team1}-${team2}`,
      isCricket: false
    },
    cricket: {
      name: "Runs",
      increment: 1,
      maxScore: 500,
      displayFormat: (team1: number, team2: number) => `${team1}/${team2}`,
      isCricket: true,
      targetLogic: true // Team 2 needs 1 more run than team 1
    },
    tennis: {
      name: "Sets",
      increment: 1,
      maxScore: 5,
      displayFormat: (team1: number, team2: number) => `${team1}-${team2}`,
      isCricket: false
    },
    badminton: {
      name: "Points",
      increment: 1,
      maxScore: 30,
      displayFormat: (team1: number, team2: number) => `${team1}-${team2}`,
      isCricket: false
    },
    volleyball: {
      name: "Points",
      increment: 1,
      maxScore: 50,
      displayFormat: (team1: number, team2: number) => `${team1}-${team2}`,
      isCricket: false
    }
  }

  const statuses = [
    { value: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-800" },
    { value: "live", label: "Live", color: "bg-green-100 text-green-800" },
    { value: "completed", label: "Completed", color: "bg-gray-100 text-gray-800" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" }
  ]

  // Load universities
  const loadUniversities = async () => {
    try {
      const result = await realtimeDbUtils.getData(`zones/${currentZone}/universities`)
      if (result.success && result.data) {
        // Convert object to array if needed
        const universitiesData = Array.isArray(result.data) 
          ? result.data 
          : Object.entries(result.data).map(([firebaseId, university]: [string, any]) => ({ 
            ...(university as any),
            id: firebaseId // Use Firebase-generated ID as the id field (overwrite any existing id)
          }))
        setUniversities(universitiesData)
      } else {
        setUniversities([])
      }
    } catch (err) {
      console.error("Failed to load universities:", err)
      setUniversities([])
    }
  }

  // Load matches
  const loadMatches = async () => {
    try {
      setLoading(true)
      const result = await realtimeDbUtils.getData(`zones/${currentZone}/matches`)
      if (result.success && result.data) {
        // Convert object to array if needed
        const matchesData = Array.isArray(result.data) 
          ? result.data 
          : Object.entries(result.data).map(([id, match]: [string, any]) => ({ 
            id, 
            ...(match as object)
          }))
        setMatches(matchesData)
      } else {
        setMatches([])
      }
    } catch (err) {
      setError("Failed to load matches")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
    loadUniversities()
  }, [currentZone])

  // Sync live matches to realtime results when matches change
  const syncLiveMatches = async () => {
    try {
      await realtimeResultsService.syncLiveMatchesFromZones()
    } catch (error) {
      console.error('Failed to sync live matches:', error)
    }
  }

  // Start a match (change status to live)
  const handleStartMatch = async (matchId: string) => {
    try {
      const match = matches.find(m => m.id === matchId)
      if (!match) return
      
      const sportConfig = sportScoringConfig[match.sport as keyof typeof sportScoringConfig] || sportScoringConfig.football
      const initialScore = sportConfig.displayFormat(0, 0)
      
      const result = await realtimeDbUtils.updateData(
        `zones/${currentZone}/matches/${matchId}`,
        { 
          status: 'live', 
          startedAt: new Date().toISOString(),
          score: initialScore
        }
      )
      if (result.success) {
        setSuccess("Match started successfully")
        loadMatches()
        syncLiveMatches()
        // Initialize live score
        setLiveScore(prev => ({ ...prev, [matchId]: { team1: 0, team2: 0 } }))
      } else {
        setError("Failed to start match")
      }
    } catch (err) {
      setError("Failed to start match")
    }
  }

  // End a match (change status to completed)
  const handleEndMatch = async (matchId: string) => {
    try {
      const match = matches.find(m => m.id === matchId)
      if (!match) return
      
      const sportConfig = sportScoringConfig[match.sport as keyof typeof sportScoringConfig] || sportScoringConfig.football
      const currentScore = liveScore[matchId] || { team1: 0, team2: 0 }
      const formattedScore = sportConfig.displayFormat(currentScore.team1, currentScore.team2)
      
      // Update match status to completed
      const result = await realtimeDbUtils.updateData(
        `zones/${currentZone}/matches/${matchId}`,
        { 
          status: 'completed', 
          score: formattedScore,
          endedAt: new Date().toISOString()
        }
      )
      
      if (result.success) {
        // Remove from live matches
        await realtimeDbUtils.deleteData(`liveMatches/${matchId}`)
        
        setSuccess("Match ended successfully")
        loadMatches()
        syncLiveMatches()
        // Clear live score
        setLiveScore(prev => {
          const newScore = { ...prev }
          delete newScore[matchId]
          return newScore
        })
      } else {
        setError("Failed to end match")
      }
    } catch (err) {
      setError("Failed to end match")
    }
  }

  // Update live score with sport-specific logic
  const handleUpdateScore = async (matchId: string, team: 'team1' | 'team2', action: 'increment' | 'decrement') => {
    try {
      // Find the match to get sport type
      const match = matches.find(m => m.id === matchId)
      if (!match) return
      
      const sportConfig = sportScoringConfig[match.sport as keyof typeof sportScoringConfig] || sportScoringConfig.football
      const currentScore = liveScore[matchId] || { team1: 0, team2: 0 }
      const newScore = { ...currentScore }
      
      if (action === 'increment') {
        newScore[team] = Math.min(sportConfig.maxScore, newScore[team] + sportConfig.increment)
      } else {
        newScore[team] = Math.max(0, newScore[team] - sportConfig.increment)
      }
      
      setLiveScore(prev => ({ ...prev, [matchId]: newScore }))
      
      // Update score in database with sport-specific format
      const formattedScore = sportConfig.displayFormat(newScore.team1, newScore.team2)
      await realtimeDbUtils.updateData(
        `zones/${currentZone}/matches/${matchId}`,
        { score: formattedScore }
      )
      
      // Sync to live matches
      syncLiveMatches()
    } catch (err) {
      setError("Failed to update score")
    }
  }

  // Cricket-specific functions
  const handleCricketWicket = async (matchId: string, team: 'team1' | 'team2', action: 'increment' | 'decrement') => {
    try {
      const currentStats = cricketStats[matchId] || { wickets1: 0, wickets2: 0, substitutions: [], target: 0 }
      const newStats = { ...currentStats }
      
      if (action === 'increment') {
        newStats[team === 'team1' ? 'wickets1' : 'wickets2'] = Math.min(10, newStats[team === 'team1' ? 'wickets1' : 'wickets2'] + 1)
      } else {
        newStats[team === 'team1' ? 'wickets1' : 'wickets2'] = Math.max(0, newStats[team === 'team1' ? 'wickets1' : 'wickets2'] - 1)
      }
      
      setCricketStats(prev => ({ ...prev, [matchId]: newStats }))
      
      // Update wickets in database
      await realtimeDbUtils.updateData(
        `zones/${currentZone}/matches/${matchId}`,
        { 
          wickets: `${newStats.wickets1}/${newStats.wickets2}`,
          cricketStats: newStats
        }
      )
      
      syncLiveMatches()
    } catch (err) {
      setError("Failed to update wickets")
    }
  }

  const handleCricketSubstitution = async (matchId: string, playerOut: string, playerIn: string) => {
    try {
      const currentStats = cricketStats[matchId] || { wickets1: 0, wickets2: 0, substitutions: [], target: 0 }
      const newSubstitution = {
        playerOut,
        playerIn,
        time: new Date().toLocaleTimeString()
      }
      
      const newStats = {
        ...currentStats,
        substitutions: [...currentStats.substitutions, newSubstitution]
      }
      
      setCricketStats(prev => ({ ...prev, [matchId]: newStats }))
      
      // Update substitutions in database
      await realtimeDbUtils.updateData(
        `zones/${currentZone}/matches/${matchId}`,
        { cricketStats: newStats }
      )
      
      setSuccess(`Substitution: ${playerOut} out, ${playerIn} in`)
    } catch (err) {
      setError("Failed to record substitution")
    }
  }

  const calculateCricketTarget = (team1Score: number) => {
    return team1Score + 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validate that both teams are selected and different
    if (!formData.team1 || !formData.team2) {
      setError("Please select both teams")
      return
    }
    
    if (formData.team1 === formData.team2) {
      setError("Team 1 and Team 2 must be different universities")
      return
    }

    // Validate that sport is selected
    if (!formData.sport) {
      setError("Sport is required")
      return
    }

    // Validate that venue is provided
    if (!formData.venue || formData.venue.trim() === "") {
      setError("Venue is required")
      return
    }

    // Validate that date and time are provided
    if (!formData.date) {
      setError("Date is required")
      return
    }
    
    if (!formData.time) {
      setError("Time is required")
      return
    }

    // Validate that the date is not in the past
    const selectedDate = new Date(formData.date + 'T' + formData.time)
    const now = new Date()
    
    if (selectedDate < now) {
      setError("Match date and time cannot be in the past")
      return
    }

    try {
      if (editingMatch) {
        // Update existing match
        const updateResult = await realtimeDbUtils.updateData(
          `zones/${currentZone}/matches/${editingMatch.id}`,
          formData
        )
        if (updateResult.success) {
          setSuccess("Match updated successfully")
        } else {
          setError("Failed to update match")
          return
        }
      } else {
        // Create new match
        const createResult = await realtimeDbUtils.pushData(
          `zones/${currentZone}/matches`,
          formData
        )
        if (createResult.success) {
          setSuccess("Match created successfully")
        } else {
          setError("Failed to create match")
          return
        }
      }
      
      setIsDialogOpen(false)
      setEditingMatch(null)
      setFormData({
        team1: "",
        team2: "",
        sport: "",
        venue: "",
        date: "",
        time: "",
        status: "scheduled"
      })
      loadMatches()
      // Sync live matches to realtime results
      syncLiveMatches()
    } catch (err) {
      setError("Failed to save match")
    }
  }

  const handleEdit = (match: Match) => {
    setEditingMatch(match)
    setFormData({
      team1: match.team1,
      team2: match.team2,
      sport: match.sport,
      venue: match.venue,
      date: match.date,
      time: match.time,
      status: match.status
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (matchId: string) => {
    if (confirm("Are you sure you want to delete this match?")) {
      try {
        setLoading(true)
        setError(null)
        setSuccess(null)
        
        // First, remove from live matches if it's live
        const match = matches.find(m => m.id === matchId)
        if (match && match.status === 'live') {
          console.log('Removing from live matches:', matchId)
          await realtimeDbUtils.deleteData(`liveMatches/${matchId}`)
        }
        
        // Then delete from zone matches
        console.log('Deleting from zone matches:', `zones/${currentZone}/matches/${matchId}`)
        const deleteResult = await realtimeDbUtils.deleteData(
          `zones/${currentZone}/matches/${matchId}`
        )
        
        if (deleteResult.success) {
          console.log('Match deleted successfully from database')
          setSuccess("Match deleted successfully")
          
          // Immediately update local state to remove the match
          setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId))
          
          // Also clear live score if it exists
          setLiveScore(prev => {
            const newScore = { ...prev }
            delete newScore[matchId]
            return newScore
          })
          
          // Clear cricket stats if they exist
          setCricketStats(prev => {
            const newStats = { ...prev }
            delete newStats[matchId]
            return newStats
          })
          
          // Sync live matches to realtime results
          await syncLiveMatches()
          
          // Add a small delay to ensure deletion is processed
          setTimeout(async () => {
            await loadMatches()
          }, 100)
        } else {
          console.error('Failed to delete match:', deleteResult.error)
          setError("Failed to delete match")
        }
      } catch (err) {
        console.error('Error deleting match:', err)
        setError("Failed to delete match")
      } finally {
        setLoading(false)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = statuses.find(s => s.value === status)
    return (
      <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="h-6 w-6 text-orange-600" />
              <CardTitle>Match Management</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingMatch(null)
                  setFormData({
                    team1: "",
                    team2: "",
                    sport: "",
                    venue: "",
                    date: "",
                    time: "",
                    status: "scheduled"
                  })
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Match
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingMatch ? "Edit Match" : "Add New Match"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {universities.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No universities found for this zone. Please add universities first before creating matches.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="team1">Team 1 (University) <span className="text-red-500">*</span></Label>
                        <Select value={formData.team1} onValueChange={(value) => setFormData({ ...formData, team1: value })}>
                          <SelectTrigger className={!formData.team1 ? "border-red-300" : ""}>
                            <SelectValue placeholder="Select university" />
                          </SelectTrigger>
                          <SelectContent>
                            {universities.map((university, index) => (
                              <SelectItem key={university.id || `university-${index}`} value={university.name}>
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4" />
                                  <span>{university.name}</span>
                                  <span className="text-sm text-muted-foreground">({university.abbreviation})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team2">Team 2 (University) <span className="text-red-500">*</span></Label>
                        <Select value={formData.team2} onValueChange={(value) => setFormData({ ...formData, team2: value })}>
                          <SelectTrigger className={!formData.team2 ? "border-red-300" : ""}>
                            <SelectValue placeholder="Select university" />
                          </SelectTrigger>
                          <SelectContent>
                            {universities.map((university, index) => (
                              <SelectItem key={university.id || `university-${index}`} value={university.name}>
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4" />
                                  <span>{university.name}</span>
                                  <span className="text-sm text-muted-foreground">({university.abbreviation})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sport">Sport <span className="text-red-500">*</span></Label>
                      <Select value={formData.sport} onValueChange={(value) => setFormData({ ...formData, sport: value })}>
                        <SelectTrigger className={!formData.sport ? "border-red-300" : ""}>
                          <SelectValue placeholder="Select sport" />
                        </SelectTrigger>
                        <SelectContent>
                          {sports.map((sport, index) => (
                            <SelectItem key={sport.value || `sport-${index}`} value={sport.value}>
                              {sport.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue <span className="text-red-500">*</span></Label>
                      <Input
                        id="venue"
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        required
                        className={!formData.venue ? "border-red-300" : ""}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className={!formData.date ? "border-red-300" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time <span className="text-red-500">*</span></Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                        className={!formData.time ? "border-red-300" : ""}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status, index) => (
                          <SelectItem key={status.value || `status-${index}`} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    <span className="text-red-500">*</span> Required fields
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={universities.length === 0}>
                      {editingMatch ? "Update" : "Create"} Match
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8">
              <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No matches found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teams</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches && Array.isArray(matches) && matches.map((match, index) => (
                      <TableRow key={match.id || `match-table-${index}`}>
                        <TableCell>
                          <div className="font-medium">
                            {match.team1} vs {match.team2}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{match.sport}</TableCell>
                        <TableCell>{match.venue}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{match.date}</div>
                            <div className="text-gray-500">{match.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(match.status)}</TableCell>
                        <TableCell>
                          {match.status === 'live' ? (
                            <div className="space-y-2">
                              <div className="text-xs text-gray-500 text-center">
                                {sportScoringConfig[match.sport as keyof typeof sportScoringConfig]?.name || 'Points'}
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateScore(match.id, 'team1', 'decrement')}
                                    className="h-6 w-6 p-0"
                                  >
                                    -
                                  </Button>
                                  <span className="font-bold min-w-[3rem] text-center">
                                    {liveScore[match.id]?.team1 || 0}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateScore(match.id, 'team1', 'increment')}
                                    className="h-6 w-6 p-0"
                                  >
                                    +
                                  </Button>
                                </div>
                                <span className="text-gray-400">-</span>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateScore(match.id, 'team2', 'decrement')}
                                    className="h-6 w-6 p-0"
                                  >
                                    -
                                  </Button>
                                  <span className="font-bold min-w-[3rem] text-center">
                                    {liveScore[match.id]?.team2 || 0}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateScore(match.id, 'team2', 'increment')}
                                    className="h-6 w-6 p-0"
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Cricket Target */}
                              {sportScoringConfig[match.sport as keyof typeof sportScoringConfig]?.isCricket && liveScore[match.id]?.team1 > 0 && (
                                <div className="text-xs text-blue-600 text-center">
                                  Target: {calculateCricketTarget(liveScore[match.id]?.team1 || 0)}
                                </div>
                              )}
                            </div>
                          ) : match.status === 'completed' ? (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500 text-center">
                                {sportScoringConfig[match.sport as keyof typeof sportScoringConfig]?.name || 'Points'}
                              </div>
                              <div className="font-bold text-green-600 text-center">
                                {match.score || 'N/A'}
                              </div>
                              {sportScoringConfig[match.sport as keyof typeof sportScoringConfig]?.isCricket && match.cricketStats && (
                                <div className="text-xs text-gray-600 text-center">
                                  Wickets: {match.cricketStats.wickets1}/{match.cricketStats.wickets2}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400">-</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {match.status === 'scheduled' && (
                              <Button
                                size="sm"
                                onClick={() => handleStartMatch(match.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start
                              </Button>
                            )}
                            {match.status === 'live' && (
                              <Button
                                size="sm"
                                onClick={() => handleEndMatch(match.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <Square className="h-3 w-3 mr-1" />
                                End
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(match)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(match.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {matches && Array.isArray(matches) && matches.map((match, index) => (
                  <Card key={match.id || `match-card-${index}`} className="p-4">
                    <div className="space-y-3">
                      {/* Match Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{match.team1} vs {match.team2}</h3>
                          <p className="text-sm text-gray-600 capitalize">{match.sport}</p>
                        </div>
                        {getStatusBadge(match.status)}
                      </div>

                      {/* Match Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Venue:</span>
                          <p className="font-medium">{match.venue}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Date & Time:</span>
                          <p className="font-medium">{match.date}</p>
                          <p className="text-gray-600">{match.time}</p>
                        </div>
                      </div>

                      {/* Score Section */}
                      <div className="border-t pt-3">
                        {match.status === 'live' ? (
                          <div className="space-y-3">
                            <div className="text-center">
                              <span className="text-sm text-gray-500">
                                {sportScoringConfig[match.sport as keyof typeof sportScoringConfig]?.name || 'Points'}
                              </span>
                            </div>
                            
                            {/* Regular Score Controls */}
                            <div className="flex items-center justify-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateScore(match.id, 'team1', 'decrement')}
                                  className="h-8 w-8 p-0"
                                >
                                  -
                                </Button>
                                <span className="font-bold text-xl min-w-[2rem] text-center">
                                  {liveScore[match.id]?.team1 || 0}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateScore(match.id, 'team1', 'increment')}
                                  className="h-8 w-8 p-0"
                                >
                                  +
                                </Button>
                              </div>
                              <span className="text-gray-400 text-xl">-</span>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateScore(match.id, 'team2', 'decrement')}
                                  className="h-8 w-8 p-0"
                                >
                                  -
                                </Button>
                                <span className="font-bold text-xl min-w-[2rem] text-center">
                                  {liveScore[match.id]?.team2 || 0}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateScore(match.id, 'team2', 'increment')}
                                  className="h-8 w-8 p-0"
                                >
                                  +
                                </Button>
                              </div>
                            </div>

                            {/* Cricket-specific features */}
                            {sportScoringConfig[match.sport as keyof typeof sportScoringConfig]?.isCricket && (
                              <div className="space-y-3 border-t pt-3">
                                {/* Target for Team 2 */}
                                {liveScore[match.id]?.team1 > 0 && (
                                  <div className="text-center">
                                    <span className="text-sm text-blue-600 font-semibold">
                                      Target: {calculateCricketTarget(liveScore[match.id]?.team1 || 0)} runs
                                    </span>
                                  </div>
                                )}

                                {/* Wickets */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-center">
                                    <span className="text-xs text-gray-500">Team 1 Wickets</span>
                                    <div className="flex items-center justify-center space-x-2 mt-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCricketWicket(match.id, 'team1', 'decrement')}
                                        className="h-6 w-6 p-0"
                                      >
                                        -
                                      </Button>
                                      <span className="font-bold text-lg">
                                        {cricketStats[match.id]?.wickets1 || 0}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCricketWicket(match.id, 'team1', 'increment')}
                                        className="h-6 w-6 p-0"
                                      >
                                        +
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs text-gray-500">Team 2 Wickets</span>
                                    <div className="flex items-center justify-center space-x-2 mt-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCricketWicket(match.id, 'team2', 'decrement')}
                                        className="h-6 w-6 p-0"
                                      >
                                        -
                                      </Button>
                                      <span className="font-bold text-lg">
                                        {cricketStats[match.id]?.wickets2 || 0}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCricketWicket(match.id, 'team2', 'increment')}
                                        className="h-6 w-6 p-0"
                                      >
                                        +
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Quick Substitution */}
                                <div className="space-y-2">
                                  <span className="text-xs text-gray-500 text-center block">Quick Substitution</span>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const playerOut = prompt("Player going out:")
                                        const playerIn = prompt("Player coming in:")
                                        if (playerOut && playerIn) {
                                          handleCricketSubstitution(match.id, playerOut, playerIn)
                                        }
                                      }}
                                      className="flex-1 text-xs"
                                    >
                                      Player In/Out
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : match.status === 'completed' ? (
                          <div className="text-center space-y-1">
                            <div className="text-sm text-gray-500">
                              {sportScoringConfig[match.sport as keyof typeof sportScoringConfig]?.name || 'Points'}
                            </div>
                            <div className="font-bold text-green-600 text-xl">
                              {match.score || 'N/A'}
                            </div>
                            {sportScoringConfig[match.sport as keyof typeof sportScoringConfig]?.isCricket && match.cricketStats && (
                              <div className="text-sm text-gray-600">
                                Wickets: {match.cricketStats.wickets1}/{match.cricketStats.wickets2}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-gray-400">Score not available</div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t">
                        {match.status === 'scheduled' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartMatch(match.id)}
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Match
                          </Button>
                        )}
                        {match.status === 'live' && (
                          <Button
                            size="sm"
                            onClick={() => handleEndMatch(match.id)}
                            className="bg-red-600 hover:bg-red-700 text-white flex-1"
                          >
                            <Square className="h-4 w-4 mr-2" />
                            End Match
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(match)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(match.id)}
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}