"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/lib/firebase-context"
import { checkAdminStatus, logAdminAccess } from "@/lib/admin-auth"
import { ref, onValue, update, get } from "firebase/database"
import { realtimeDb } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Shield, 
  Users, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  UserCheck,
  GraduationCap,
  Trophy,
  Gamepad2
} from "lucide-react"
import { ZoneSwitcher } from "@/components/zone-switcher"

interface Player {
  id: string
  name: string
  university: string
  sport: string
  zone: string
  checkedIn: boolean
  checkInTime?: number
}

export default function CheckInPage() {
  const router = useRouter()
  const { user, loading } = useFirebase()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // Data states
  const [universities, setUniversities] = useState<any[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Filters
  const [selectedZone, setSelectedZone] = useState('ALL')
  const [selectedUniversity, setSelectedUniversity] = useState('ALL')
  const [selectedSport, setSelectedSport] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Check-in states
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (user) {
        const adminCheck = checkAdminStatus(user);
        logAdminAccess(user, 'Check-in Page');
        
        if (adminCheck.isAdmin) {
          setIsLoggedIn(true)
          loadData()
        } else {
          setIsLoggedIn(false)
          router.push('/admin/login')
        }
      } else {
        setIsLoggedIn(false)
        router.push('/admin/login')
      }
    }
  }, [user, loading, router])

  const loadData = async () => {
    try {
      setLoadingData(true)
      console.log('🔍 Loading check-in data...')
      
      // Load universities
      const universitiesRef = ref(realtimeDb, 'universities')
      const universitiesSnapshot = await get(universitiesRef)
      
      let universitiesData = []
      if (universitiesSnapshot.exists()) {
        const data = universitiesSnapshot.val()
        if (data && typeof data === 'object') {
          universitiesData = Object.entries(data).map(([id, value]: [string, any]) => ({
            id,
            ...value,
            name: value.name || value.universityName || 'Unknown University',
            zone: value.zone || 'Unknown',
            sports: value.sports || []
          }))
        }
      }
      
      setUniversities(universitiesData)
      
      // Build players list from universities
      const allPlayers: Player[] = []
      universitiesData.forEach(uni => {
        if (uni.players && typeof uni.players === 'object') {
          Object.entries(uni.players).forEach(([sport, players]: [string, any]) => {
            if (Array.isArray(players)) {
              players.forEach((player: any, index: number) => {
                allPlayers.push({
                  id: `${uni.id}-${sport}-${index}`,
                  name: player.name || `Player ${index + 1}`,
                  university: uni.name,
                  sport: sport,
                  zone: uni.zone,
                  checkedIn: player.checkedIn || false,
                  checkInTime: player.checkInTime
                })
              })
            }
          })
        }
      })
      
      setPlayers(allPlayers)
      console.log('✅ Check-in data loaded:', { universities: universitiesData.length, players: allPlayers.length })
      
    } catch (error) {
      console.error('❌ Error loading check-in data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  // Filter players based on search and filters
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.university.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesZone = selectedZone === 'ALL' || player.zone === selectedZone
    const matchesUniversity = selectedUniversity === 'ALL' || player.university === selectedUniversity
    const matchesSport = selectedSport === 'ALL' || player.sport === selectedSport
    
    return matchesSearch && matchesZone && matchesUniversity && matchesSport
  })

  // Individual player check-in
  const handlePlayerCheckIn = async (playerId: string, checkedIn: boolean) => {
    try {
      setCheckingIn(playerId)
      
      // Find the player and their university/sport info
      const player = players.find(p => p.id === playerId)
      if (!player) return
      
      // Update in Firebase
      const [uniId, sport, playerIndex] = playerId.split('-')
      const playerRef = ref(realtimeDb, `universities/${uniId}/players/${sport}/${playerIndex}`)
      
      await update(playerRef, {
        checkedIn,
        checkInTime: checkedIn ? Date.now() : null
      })
      
      // Update local state
      setPlayers(prev => prev.map(p => 
        p.id === playerId 
          ? { ...p, checkedIn, checkInTime: checkedIn ? Date.now() : undefined }
          : p
      ))
      
      console.log(`✅ Player ${checkedIn ? 'checked in' : 'checked out'}: ${player.name}`)
      
    } catch (error) {
      console.error('❌ Error updating player check-in:', error)
    } finally {
      setCheckingIn(null)
    }
  }

  // Bulk check-in for selected players
  const handleBulkCheckIn = async (checkedIn: boolean) => {
    try {
      console.log(`🔄 Bulk ${checkedIn ? 'check-in' : 'check-out'}: ${selectedPlayers.length} players`)
      
      const updates: {[key: string]: any} = {}
      
      selectedPlayers.forEach(playerId => {
        const player = players.find(p => p.id === playerId)
        if (player) {
          const [uniId, sport, playerIndex] = playerId.split('-')
          updates[`universities/${uniId}/players/${sport}/${playerIndex}/checkedIn`] = checkedIn
          updates[`universities/${uniId}/players/${sport}/${playerIndex}/checkInTime`] = checkedIn ? Date.now() : null
        }
      })
      
      // Update all at once
      const rootRef = ref(realtimeDb)
      await update(rootRef, updates)
      
      // Update local state
      setPlayers(prev => prev.map(p => 
        selectedPlayers.includes(p.id)
          ? { ...p, checkedIn, checkInTime: checkedIn ? Date.now() : undefined }
          : p
      ))
      
      setSelectedPlayers([])
      console.log(`✅ Bulk ${checkedIn ? 'check-in' : 'check-out'} completed`)
      
    } catch (error) {
      console.error('❌ Error bulk check-in:', error)
    }
  }

  // Check-in all players from a university
  const handleUniversityPlayersCheckIn = async (university: string, checkedIn: boolean) => {
    try {
      const uniPlayers = players.filter(p => p.university === university)
      console.log(`🔄 Checking ${checkedIn ? 'in' : 'out'} all players from ${university}: ${uniPlayers.length} players`)
      
      const updates: {[key: string]: any} = {}
      
      uniPlayers.forEach(player => {
        const [uniId, sport, playerIndex] = player.id.split('-')
        updates[`universities/${uniId}/players/${sport}/${playerIndex}/checkedIn`] = checkedIn
        updates[`universities/${uniId}/players/${sport}/${playerIndex}/checkInTime`] = checkedIn ? Date.now() : null
      })
      
      const rootRef = ref(realtimeDb)
      await update(rootRef, updates)
      
      setPlayers(prev => prev.map(p => 
        p.university === university
          ? { ...p, checkedIn, checkInTime: checkedIn ? Date.now() : undefined }
          : p
      ))
      
      console.log(`✅ All players ${checkedIn ? 'checked in' : 'checked out'} from ${university}`)
      
    } catch (error) {
      console.error('❌ Error checking in university players:', error)
    }
  }

  // Check-in all players from a specific sport
  const handleSportPlayersCheckIn = async (university: string, sport: string, checkedIn: boolean) => {
    try {
      const sportPlayers = players.filter(p => p.university === university && p.sport === sport)
      console.log(`🔄 Checking ${checkedIn ? 'in' : 'out'} all ${sport} players from ${university}: ${sportPlayers.length} players`)
      
      const updates: {[key: string]: any} = {}
      
      sportPlayers.forEach(player => {
        const [uniId, sportName, playerIndex] = player.id.split('-')
        updates[`universities/${uniId}/players/${sportName}/${playerIndex}/checkedIn`] = checkedIn
        updates[`universities/${uniId}/players/${sportName}/${playerIndex}/checkInTime`] = checkedIn ? Date.now() : null
      })
      
      const rootRef = ref(realtimeDb)
      await update(rootRef, updates)
      
      setPlayers(prev => prev.map(p => 
        p.university === university && p.sport === sport
          ? { ...p, checkedIn, checkInTime: checkedIn ? Date.now() : undefined }
          : p
      ))
      
      console.log(`✅ All ${sport} players ${checkedIn ? 'checked in' : 'checked out'} from ${university}`)
      
    } catch (error) {
      console.error('❌ Error checking in sport players:', error)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading check-in data...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  // Group players by university and sport for easier management
  const groupedPlayers = filteredPlayers.reduce((acc, player) => {
    if (!acc[player.university]) {
      acc[player.university] = {}
    }
    if (!acc[player.university][player.sport]) {
      acc[player.university][player.sport] = []
    }
    acc[player.university][player.sport].push(player)
    return acc
  }, {} as Record<string, Record<string, Player[]>>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Player Check-in</h1>
            <p className="text-gray-600">Quick check-in system for players and teams</p>
            <div className="mt-4 flex justify-center">
              <ZoneSwitcher
                currentZone={selectedZone}
                availableZones={['ALL', 'NZ+CZ', 'LZ+SZ']}
                onZoneChange={setSelectedZone}
              />
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search Players</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name or university"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="zone">Zone</Label>
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Zones</SelectItem>
                      <SelectItem value="NZ+CZ">North & Central</SelectItem>
                      <SelectItem value="LZ+SZ">London & South</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="university">University</Label>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Universities</SelectItem>
                      {Array.from(new Set(players.map(p => p.university))).map(uni => (
                        <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sport">Sport</Label>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Sports</SelectItem>
                      {Array.from(new Set(players.map(p => p.sport))).map(sport => (
                        <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedPlayers.length > 0 && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      {selectedPlayers.length} player(s) selected
                    </h3>
                    <p className="text-sm text-blue-700">Select actions to perform on selected players</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleBulkCheckIn(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Check In Selected Players
                    </Button>
                    <Button 
                      onClick={() => handleBulkCheckIn(false)}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Check Out Selected Players
                    </Button>
                    <Button 
                      onClick={() => setSelectedPlayers([])}
                      variant="outline"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Players List */}
          <div className="space-y-8">
            {/* Zone Separators for Super Admins */}
            {selectedZone === 'ALL' && (
              <>
                {/* North & Central Zone Section */}
                <div className="border-t-4 border-blue-500 pt-6">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">N</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-blue-900">North & Central Zone (NZ+CZ)</h2>
                      <p className="text-sm text-blue-700">Players from North and Central regions</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {Object.entries(groupedPlayers)
                      .filter(([university, sports]) => 
                        Object.values(sports).some(players => players.some(p => p.zone === 'NZ+CZ'))
                      )
                      .map(([university, sports]) => (
                        <Card key={university}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center space-x-2">
                                <GraduationCap className="h-5 w-5" />
                                <span>{university}</span>
                              </CardTitle>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUniversityPlayersCheckIn(university, true)}
                                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Check In All Players
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUniversityPlayersCheckIn(university, false)}
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Check Out All Players
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {Object.entries(sports)
                                .filter(([sport, players]) => players.some(p => p.zone === 'NZ+CZ'))
                                .map(([sport, sportPlayers]) => {
                                  const nzCzPlayers = sportPlayers.filter(p => p.zone === 'NZ+CZ')
                                  return (
                                    <div key={sport} className="border rounded-lg p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <Gamepad2 className="h-4 w-4 text-blue-600" />
                                          <h4 className="font-semibold">{sport}</h4>
                                          <Badge variant="outline">{nzCzPlayers.length} players</Badge>
                                        </div>
                                        <div className="flex space-x-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSportPlayersCheckIn(university, sport, true)}
                                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                          >
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Check In All {sport} Players
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSportPlayersCheckIn(university, sport, false)}
                                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                          >
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Check Out All {sport} Players
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {nzCzPlayers.map((player) => (
                                          <div key={player.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Checkbox
                                              checked={selectedPlayers.includes(player.id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedPlayers([...selectedPlayers, player.id])
                                                } else {
                                                  setSelectedPlayers(selectedPlayers.filter(id => id !== player.id))
                                                }
                                              }}
                                            />
                                            
                                            <div className="flex-1">
                                              <p className="font-medium text-sm">{player.name}</p>
                                              <p className="text-xs text-gray-500">{player.zone}</p>
                                            </div>
                                            
                                            <Button
                                              size="sm"
                                              variant={player.checkedIn ? "destructive" : "default"}
                                              onClick={() => handlePlayerCheckIn(player.id, !player.checkedIn)}
                                              disabled={checkingIn === player.id}
                                              className={player.checkedIn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                                            >
                                              {player.checkedIn ? (
                                                <XCircle className="h-3 w-3" />
                                              ) : (
                                                <CheckCircle className="h-3 w-3" />
                                              )}
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>

                {/* London & South Zone Section */}
                <div className="border-t-4 border-green-500 pt-6">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">L</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-green-900">London & South Zone (LZ+SZ)</h2>
                      <p className="text-sm text-green-700">Players from London and South regions</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {Object.entries(groupedPlayers)
                      .filter(([university, sports]) => 
                        Object.values(sports).some(players => players.some(p => p.zone === 'LZ+SZ'))
                      )
                      .map(([university, sports]) => (
                        <Card key={university}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center space-x-2">
                                <GraduationCap className="h-5 w-5" />
                                <span>{university}</span>
                              </CardTitle>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUniversityPlayersCheckIn(university, true)}
                                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Check In All Players
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUniversityPlayersCheckIn(university, false)}
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Check Out All Players
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {Object.entries(sports)
                                .filter(([sport, players]) => players.some(p => p.zone === 'LZ+SZ'))
                                .map(([sport, sportPlayers]) => {
                                  const lzSzPlayers = sportPlayers.filter(p => p.zone === 'LZ+SZ')
                                  return (
                                    <div key={sport} className="border rounded-lg p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                          <Gamepad2 className="h-4 w-4 text-green-600" />
                                          <h4 className="font-semibold">{sport}</h4>
                                          <Badge variant="outline">{lzSzPlayers.length} players</Badge>
                                        </div>
                                        <div className="flex space-x-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSportPlayersCheckIn(university, sport, true)}
                                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                          >
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Check In All {sport} Players
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSportPlayersCheckIn(university, sport, false)}
                                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                          >
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Check Out All {sport} Players
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {lzSzPlayers.map((player) => (
                                          <div key={player.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Checkbox
                                              checked={selectedPlayers.includes(player.id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedPlayers([...selectedPlayers, player.id])
                                                } else {
                                                  setSelectedPlayers(selectedPlayers.filter(id => id !== player.id))
                                                }
                                              }}
                                            />
                                            
                                            <div className="flex-1">
                                              <p className="font-medium text-sm">{player.name}</p>
                                              <p className="text-xs text-gray-500">{player.zone}</p>
                                            </div>
                                            
                                            <Button
                                              size="sm"
                                              variant={player.checkedIn ? "destructive" : "default"}
                                              onClick={() => handlePlayerCheckIn(player.id, !player.checkedIn)}
                                              disabled={checkingIn === player.id}
                                              className={player.checkedIn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                                            >
                                              {player.checkedIn ? (
                                                <XCircle className="h-3 w-3" />
                                              ) : (
                                                <CheckCircle className="h-3 w-3" />
                                              )}
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Fallback: Original layout for single zone or filtered view */}
            {selectedZone !== 'ALL' && (
              <div className="space-y-6">
                {Object.entries(groupedPlayers).map(([university, sports]) => (
                  <Card key={university}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <GraduationCap className="h-5 w-5" />
                          <span>{university}</span>
                        </CardTitle>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUniversityPlayersCheckIn(university, true)}
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Check In All Players
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUniversityPlayersCheckIn(university, false)}
                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Check Out All Players
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(sports).map(([sport, sportPlayers]) => (
                          <div key={sport} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Gamepad2 className="h-4 w-4 text-blue-600" />
                                <h4 className="font-semibold">{sport}</h4>
                                <Badge variant="outline">{sportPlayers.length} players</Badge>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSportPlayersCheckIn(university, sport, true)}
                                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Check In All {sport} Players
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSportPlayersCheckIn(university, sport, false)}
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Check Out All {sport} Players
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {sportPlayers.map((player) => (
                                <div key={player.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                  <Checkbox
                                    checked={selectedPlayers.includes(player.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedPlayers([...selectedPlayers, player.id])
                                      } else {
                                        setSelectedPlayers(selectedPlayers.filter(id => id !== player.id))
                                      }
                                    }}
                                  />
                                  
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{player.name}</p>
                                    <p className="text-xs text-gray-500">{player.zone}</p>
                                  </div>
                                  
                                  <Button
                                    size="sm"
                                    variant={player.checkedIn ? "destructive" : "default"}
                                    onClick={() => handlePlayerCheckIn(player.id, !player.checkedIn)}
                                    disabled={checkingIn === player.id}
                                    className={player.checkedIn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                                  >
                                    {player.checkedIn ? (
                                      <XCircle className="h-3 w-3" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          {filteredPlayers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No players found matching your filters</p>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}