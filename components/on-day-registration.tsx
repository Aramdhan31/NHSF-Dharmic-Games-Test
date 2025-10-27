"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserPlus, 
  GraduationCap, 
  Users, 
  Trophy, 
  MapPin, 
  Mail, 
  Phone, 
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Edit
} from 'lucide-react'

interface PlayerRegistration {
  name: string
  studentId: string
  email: string
  phone: string
  university: string
  year: string
  course: string
  sports: string[]
  emergencyContact: string
  emergencyPhone: string
  medicalInfo: string
}

interface UniversityRegistration {
  name: string
  abbreviation: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  postcode: string
  zone: string
  contactPerson: string
  contactRole: string
  sports: string[]
  estimatedPlayers: number
  description: string
}

const availableSports = [
  'Football', 'Basketball', 'Volleyball', 'Cricket', 'Badminton', 'Table Tennis',
  'Tennis', 'Swimming', 'Athletics', 'Chess', 'Kabaddi', 'Kho-Kho'
]

const zones = [
  { value: 'NZ+CZ', label: 'North & Central Zone' },
  { value: 'LZ+SZ', label: 'London & South Zone' }
]

const years = [
  'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'
]

interface OnDayRegistrationProps {
  currentZone: string
  currentUser: any
}

export function OnDayRegistration({ currentZone, currentUser }: OnDayRegistrationProps) {
  const [activeTab, setActiveTab] = useState('player')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Player registration state
  const [playerForm, setPlayerForm] = useState<PlayerRegistration>({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    university: '',
    year: '',
    course: '',
    sports: [],
    emergencyContact: '',
    emergencyPhone: '',
    medicalInfo: ''
  })
  
  // University registration state
  const [universityForm, setUniversityForm] = useState<UniversityRegistration>({
    name: '',
    abbreviation: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    postcode: '',
    zone: currentZone || 'NZ+CZ',
    contactPerson: '',
    contactRole: '',
    sports: [],
    estimatedPlayers: 0,
    description: ''
  })

  const [registeredToday, setRegisteredToday] = useState<{
    players: PlayerRegistration[]
    universities: UniversityRegistration[]
  }>({
    players: [],
    universities: []
  })

  const handlePlayerInputChange = (field: keyof PlayerRegistration, value: any) => {
    setPlayerForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUniversityInputChange = (field: keyof UniversityRegistration, value: any) => {
    setUniversityForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePlayerSportToggle = (sport: string) => {
    setPlayerForm(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }))
  }

  const handleUniversitySportToggle = (sport: string) => {
    setUniversityForm(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }))
  }

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate required fields
      if (!playerForm.name || !playerForm.studentId || !playerForm.email || !playerForm.university) {
        throw new Error('Please fill in all required fields')
      }

      if (playerForm.sports.length === 0) {
        throw new Error('Please select at least one sport')
      }

      // Add to registered today list
      const newPlayer = { ...playerForm, id: Date.now().toString() }
      setRegisteredToday(prev => ({
        ...prev,
        players: [...prev.players, newPlayer]
      }))

      // Save to Firebase via API (creates request, not immediate account)
      const response = await fetch('/api/on-day-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'player',
          data: newPlayer
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register player')
      }

      console.log('On-the-day player registration submitted for approval')

      setSuccess('Player checked in successfully!')
      
      // Reset form
      setPlayerForm({
        name: '',
        studentId: '',
        email: '',
        phone: '',
        university: '',
        year: '',
        course: '',
        sports: [],
        emergencyContact: '',
        emergencyPhone: '',
        medicalInfo: ''
      })

    } catch (err: any) {
      setError(err.message || 'Failed to register player')
    } finally {
      setLoading(false)
    }
  }

  const handleUniversitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate required fields
      if (!universityForm.name || !universityForm.email || !universityForm.contactPerson) {
        throw new Error('Please fill in all required fields')
      }

      if (universityForm.sports.length === 0) {
        throw new Error('Please select at least one sport')
      }

      // Add to registered today list
      const newUniversity = { ...universityForm, id: Date.now().toString() }
      setRegisteredToday(prev => ({
        ...prev,
        universities: [...prev.universities, newUniversity]
      }))

      // Save to Firebase via API (creates request, not immediate account)
      const response = await fetch('/api/on-day-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'university',
          data: newUniversity
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register university')
      }

      console.log('On-the-day university registration submitted for approval')

      setSuccess('Team marked as full house successfully!')
      
      // Reset form
      setUniversityForm({
        name: '',
        abbreviation: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        postcode: '',
        zone: currentZone || 'NZ+CZ',
        contactPerson: '',
        contactRole: '',
        sports: [],
        estimatedPlayers: 0,
        description: ''
      })

    } catch (err: any) {
      setError(err.message || 'Failed to register university')
    } finally {
      setLoading(false)
    }
  }

  const removePlayer = (playerId: string) => {
    setRegisteredToday(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }))
  }

  const removeUniversity = (universityId: string) => {
    setRegisteredToday(prev => ({
      ...prev,
      universities: prev.universities.filter(u => u.id !== universityId)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <UserPlus className="h-6 w-6 mr-2" />
            On-the-Day Check-In
          </h2>
          <p className="text-gray-600">
            Check in registered users and track team attendance
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <Clock className="w-3 h-3 mr-1" />
          Event Day
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Players Checked In</p>
                <p className="text-2xl font-bold">{registeredToday.players.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Teams with Full House</p>
                <p className="text-2xl font-bold">{registeredToday.universities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Registration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="player">Player Check-In</TabsTrigger>
          <TabsTrigger value="university">Team Attendance</TabsTrigger>
        </TabsList>

        {/* Player Registration Tab */}
        <TabsContent value="player" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Player Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Check In Player
                </CardTitle>
                <CardDescription>
                  Mark a registered player as present for the event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlayerSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="player-search">Search Registered Player</Label>
                    <Input
                      id="player-search"
                      value={playerForm.name}
                      onChange={(e) => handlePlayerInputChange('name', e.target.value)}
                      placeholder="Enter player name, email, or student ID"
                      required
                    />
                    <p className="text-sm text-gray-500">
                      Search for a player who has already registered
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Sports Participation</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableSports.map((sport) => (
                        <div key={sport} className="flex items-center space-x-2">
                          <Checkbox
                            id={`player-${sport}`}
                            checked={playerForm.sports.includes(sport)}
                            onCheckedChange={() => handlePlayerSportToggle(sport)}
                          />
                          <Label htmlFor={`player-${sport}`} className="text-sm font-normal">
                            {sport}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Checking In Player...' : 'Check In Player'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Today's Player Registrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Players Checked In Today</span>
                  <Badge variant="secondary">{registeredToday.players.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Players who have checked in for today's event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {registeredToday.players.map((player, index) => (
                    <div key={player.id || index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{player.name}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePlayer(player.id || index.toString())}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>{player.university} • {player.studentId}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {player.sports.map((sport) => (
                            <Badge key={sport} variant="outline" className="text-xs">
                              {sport}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {registeredToday.players.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No players checked in today yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* University Registration Tab */}
        <TabsContent value="university" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* University Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Mark Team as Full House
                </CardTitle>
                <CardDescription>
                  Mark a university team as having full attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUniversitySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="uni-search">Search Registered University</Label>
                    <Input
                      id="uni-search"
                      value={universityForm.name}
                      onChange={(e) => handleUniversityInputChange('name', e.target.value)}
                      placeholder="Enter university name or email"
                      required
                    />
                    <p className="text-sm text-gray-500">
                      Search for a university that has already registered
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Sports with Full Attendance</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableSports.map((sport) => (
                        <div key={sport} className="flex items-center space-x-2">
                          <Checkbox
                            id={`uni-${sport}`}
                            checked={universityForm.sports.includes(sport)}
                            onCheckedChange={() => handleUniversitySportToggle(sport)}
                          />
                          <Label htmlFor={`uni-${sport}`} className="text-sm font-normal">
                            {sport}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated-players">Players Present</Label>
                    <Input
                      id="estimated-players"
                      type="number"
                      min="1"
                      value={universityForm.estimatedPlayers}
                      onChange={(e) => handleUniversityInputChange('estimatedPlayers', parseInt(e.target.value) || 0)}
                      placeholder="Enter number of players present"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Marking as Full House...' : 'Mark as Full House'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Today's University Registrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Teams with Full House</span>
                  <Badge variant="secondary">{registeredToday.universities.length}</Badge>
                </CardTitle>
                <CardDescription>
                  University teams with complete attendance today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {registeredToday.universities.map((university, index) => (
                    <div key={university.id || index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{university.name}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeUniversity(university.id || index.toString())}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>{university.contactPerson} • {university.zone}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {university.sports.map((sport) => (
                            <Badge key={sport} variant="outline" className="text-xs">
                              {sport}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {registeredToday.universities.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No teams with full house yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for on-the-day registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">View All Registrations</div>
                <div className="text-sm text-gray-500">See complete list</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <MapPin className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Print Badges</div>
                <div className="text-sm text-gray-500">Generate event badges</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Export Data</div>
                <div className="text-sm text-gray-500">Download registrations</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
