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
import { GraduationCap, Plus, Edit, Trash2, AlertCircle, CheckCircle, Trophy, X, Eye, EyeOff } from "lucide-react"
import { User } from "@/lib/user-management"
import { realtimeDbUtils } from "@/lib/firebase-utils"
import { universities as websiteUniversities } from "@/app/teams/page"

interface University {
  id: string
  name: string
  zone: string
  abbreviation: string
  isActive: boolean
  sports: string[]
  sportPlayers?: { [sport: string]: number } // Number of players per sport
  isCompeting: boolean
  members: number
  wins: number
  losses: number
  points: number
  description: string
  tournamentDate: string
  createdAt: any
  withdrawnSports?: string[] // Sports they've withdrawn from
  withdrawalReason?: string // Reason for withdrawal
}

interface UniversityManagementProps {
  currentZone: string
  currentUser: User | null
}

export const UniversityManagement = ({ currentZone, currentUser }: UniversityManagementProps) => {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    zone: currentZone === 'ALL' ? 'NZ+CZ' : currentZone, // Default to NZ+CZ if ALL zones
    isActive: true,
    sports: [] as string[],
    sportPlayers: {} as { [sport: string]: number },
    isCompeting: true,
    members: 0,
    wins: 0,
    losses: 0,
    points: 0,
    description: "",
    tournamentDate: "",
    withdrawnSports: [] as string[],
    withdrawalReason: ""
  })


  const zones = [
    { value: "NZ+CZ", label: "North & Central Zone (Nov 22)" },
    { value: "LZ+SZ", label: "London & South Zone (Nov 23)" }
  ]
  
  // If user has ALL zones access, allow them to select any zone for new universities
  const availableZones = currentZone === 'ALL' ? zones : zones.filter(z => z.value === currentZone)

  const availableSports = [
    "Netball",
    "Football", 
    "Kabaddi",
    "Kho kho",
    "Badminton"
  ]

  const tournamentDates = [
    { value: "Nov 22, 2025", label: "Nov 22, 2025" },
    { value: "Nov 23, 2025", label: "Nov 23, 2025" }
  ]

  // Process universities data (used by both loadUniversities and real-time listeners)
  const processUniversitiesData = (data: any) => {
    try {
      let zoneUniversities = []
      let databaseUniversities = []

      if (currentZone === 'ALL') {
        // For ALL zones, get universities from all zones
        zoneUniversities = websiteUniversities
        if (data && data['NZ+CZ'] && data['NZ+CZ'].universities) {
          databaseUniversities = [...databaseUniversities, ...Object.values(data['NZ+CZ'].universities)]
        }
        if (data && data['LZ+SZ'] && data['LZ+SZ'].universities) {
          databaseUniversities = [...databaseUniversities, ...Object.values(data['LZ+SZ'].universities)]
        }
      } else {
        // For specific zones
        const zoneUnis = websiteUniversities.filter(uni => uni.zone === currentZone)
        zoneUniversities = zoneUnis
        
        if (data && data.universities) {
          databaseUniversities = Object.values(data.universities)
        }
      }

      // Merge website and database data
      const mergedUniversities = zoneUniversities.map(websiteUni => {
        const dbUni = databaseUniversities.find((db: any) => db.name === websiteUni.name)
        if (dbUni) {
          return {
            ...dbUni,
            name: websiteUni.name,
            zone: websiteUni.zone,
            abbreviation: websiteUni.abbreviation || websiteUni.name.substring(0, 3).toUpperCase()
          }
        } else {
          return {
            ...websiteUni,
            abbreviation: websiteUni.abbreviation || websiteUni.name.substring(0, 3).toUpperCase(),
            isActive: true,
            isCompeting: websiteUni.isCompeting || false,
            sports: websiteUni.sports || [],
            sportPlayers: websiteUni.sportPlayers || {},
            members: websiteUni.members || 0,
            wins: websiteUni.wins || 0,
            losses: websiteUni.losses || 0,
            points: websiteUni.points || 0,
            description: websiteUni.description || "",
            tournamentDate: websiteUni.tournamentDate || "",
            withdrawnSports: websiteUni.withdrawnSports || [],
            withdrawalReason: websiteUni.withdrawalReason || "",
            createdAt: new Date().toISOString()
          }
        }
      })

      setUniversities(mergedUniversities)
      setSuccess(null) // Clear any previous success messages
    } catch (error) {
      console.error('Error processing universities data:', error)
      setError('Error processing university data')
    }
  }

  // Load universities from website data and sync with database
  const loadUniversities = async () => {
    // Filter website universities by current zone
    // If user has ALL zones access, show all universities
    const zoneUniversities = currentZone === 'ALL' 
      ? websiteUniversities 
      : websiteUniversities.filter(uni => uni.zone === currentZone)
    
    try {
      setLoading(true)
      console.log('Loading universities for zone:', currentZone)
      console.log('Website universities for zone:', zoneUniversities.length, zoneUniversities)
      
      // Try to load from database
      // If user has ALL zones access, load from both zones
      let databaseUniversities: University[] = []
      
      if (currentZone === 'ALL') {
        // Load universities from both zones
        const zones = ['NZ+CZ', 'LZ+SZ']
        for (const zone of zones) {
          const path = `zones/${zone}/universities`
          const result = await realtimeDbUtils.getData(path)
          
          if (result.success && result.data) {
            let zoneUniversities: University[] = []
            if (Array.isArray(result.data)) {
              zoneUniversities = result.data
            } else if (typeof result.data === 'object' && result.data !== null) {
              zoneUniversities = Object.entries(result.data).map(([firebaseId, university]: [string, any]) => ({ 
                ...(university as any),
                id: firebaseId
              }))
            }
            databaseUniversities.push(...zoneUniversities)
          }
        }
      } else {
        // Load universities from specific zone
        const path = `zones/${currentZone}/universities`
        const result = await realtimeDbUtils.getData(path)
        
        if (result.success && result.data) {
          if (Array.isArray(result.data)) {
            databaseUniversities = result.data
          } else if (typeof result.data === 'object' && result.data !== null) {
            databaseUniversities = Object.entries(result.data).map(([firebaseId, university]: [string, any]) => ({ 
              ...(university as any),
              id: firebaseId
            }))
          }
        }
      }
      
      console.log('Database universities:', databaseUniversities.length)
      
      // Merge website data with database data
      const mergedUniversities = zoneUniversities.map(websiteUni => {
        // Find matching database university
        const dbUni = databaseUniversities.find(db => db.id === websiteUni.id)
        
        if (dbUni) {
          // Use database data but keep website name and zone
          return {
            ...dbUni,
            name: websiteUni.name,
            zone: websiteUni.zone,
            abbreviation: websiteUni.abbreviation || websiteUni.name.substring(0, 3).toUpperCase()
          }
        } else {
          // Use website data as base, add database fields with defaults
          return {
            ...websiteUni,
            abbreviation: websiteUni.abbreviation || websiteUni.name.substring(0, 3).toUpperCase(),
            isActive: true,
            isCompeting: websiteUni.isCompeting || false,
            createdAt: new Date().toISOString()
          }
        }
      })
      
      console.log('Merged universities:', mergedUniversities.length)
      console.log('Final universities data:', mergedUniversities)
      setUniversities(mergedUniversities)
      
      // Sync new universities to database
      const newUniversities = mergedUniversities.filter(uni => 
        !databaseUniversities.find(db => db.id === uni.id)
      )
      
      if (newUniversities.length > 0) {
        console.log('Syncing new universities to database...', newUniversities.length)
        for (const uni of newUniversities) {
          // Sync to the appropriate zone in the database
          const syncPath = currentZone === 'ALL' 
            ? `zones/${uni.zone}/universities/${uni.id}`
            : `zones/${currentZone}/universities/${uni.id}`
          await realtimeDbUtils.setData(syncPath, uni)
          console.log('Synced university:', uni.name, 'to zone:', uni.zone)
        }
      }
      
    } catch (err) {
      console.error('Error loading universities:', err)
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      
      // Fallback: Show website universities even if database fails
      console.log('Falling back to website universities only...')
      const fallbackUniversities = zoneUniversities.map(websiteUni => ({
        ...websiteUni,
        abbreviation: websiteUni.abbreviation || websiteUni.name.substring(0, 3).toUpperCase(),
        isActive: true,
        isCompeting: websiteUni.isCompeting || false,
        createdAt: new Date().toISOString()
      }))
      
      setUniversities(fallbackUniversities)
      setError(`Database connection failed, showing website data only: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('UniversityManagement: Loading universities for zone:', currentZone)
    
    // Test Firebase Realtime Database connection first
    const testConnection = async () => {
      try {
        const testResult = await realtimeDbUtils.getData('test')
        console.log('Firebase Realtime Database test:', testResult)
      } catch (err) {
        console.error('Firebase Realtime Database test failed:', err)
      }
    }
    
    testConnection()
    loadUniversities()
    
    // Set up real-time listeners for universities data
    const setupRealtimeListeners = () => {
      try {
        const path = currentZone === 'ALL' ? 'zones' : `zones/${currentZone}`
        
        // Listen for real-time updates
        const unsubscribe = realtimeDbUtils.listenToData(path, (data) => {
          if (data) {
            console.log('Real-time update received for zone:', currentZone, data)
            // Process the data similar to loadUniversities
            processUniversitiesData(data)
          }
        })
        
        return unsubscribe
      } catch (error) {
        console.error('Error setting up real-time listeners:', error)
        return null
      }
    }
    
    const unsubscribe = setupRealtimeListeners()
    
    // Cleanup listener on unmount or zone change
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [currentZone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      if (editingUniversity) {
        // Update existing university
        const updateResult = await realtimeDbUtils.updateData(
          `zones/${currentZone}/universities/${editingUniversity.id}`,
          formData
        )
        if (updateResult.success) {
          setSuccess("University updated successfully")
        } else {
          setError("Failed to update university")
          return
        }
      } else {
        // Create new university
        const universityData = {
          ...formData,
          createdAt: new Date().toISOString()
        }
        
        const createResult = await realtimeDbUtils.pushData(
          `zones/${currentZone}/universities`,
          universityData
        )
        
        if (createResult.success) {
          setSuccess("University created successfully")
        } else {
          setError(`Failed to create university: ${createResult.error || 'Unknown error'}`)
          return
        }
      }
      
      setIsDialogOpen(false)
      setEditingUniversity(null)
      setFormData({ 
        name: "", 
        zone: currentZone === 'ALL' ? 'NZ+CZ' : currentZone, // Default to NZ+CZ if ALL zones
        isActive: true,
        sports: [],
        isCompeting: true,
        members: 0,
        wins: 0,
        losses: 0,
        points: 0,
        description: "",
        tournamentDate: ""
      })
      loadUniversities()
    } catch (err) {
      setError("Failed to save university")
    }
  }

  const handleEdit = (university: University) => {
    setEditingUniversity(university)
    setFormData({
      name: university.name,
      abbreviation: university.abbreviation,
      zone: university.zone,
      isActive: university.isActive,
      sports: university.sports || [],
      sportPlayers: university.sportPlayers || {},
      isCompeting: university.isCompeting !== undefined ? university.isCompeting : true,
      members: university.members || 0,
      wins: university.wins || 0,
      losses: university.losses || 0,
      points: university.points || 0,
      description: university.description || "",
      tournamentDate: university.tournamentDate || "",
      withdrawnSports: university.withdrawnSports || [],
      withdrawalReason: university.withdrawalReason || ""
    })
    setIsDialogOpen(true)
  }

  const toggleSport = (sport: string) => {
    setFormData(prev => {
      const isCurrentlySelected = prev.sports.includes(sport);
      const newSports = isCurrentlySelected
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport];
      
      // Update sportPlayers accordingly
      const newSportPlayers = { ...prev.sportPlayers };
      if (isCurrentlySelected) {
        // Remove sport from sportPlayers
        delete newSportPlayers[sport];
      } else {
        // Add sport with default 15 players
        newSportPlayers[sport] = 15;
      }
      
      return {
        ...prev,
        sports: newSports,
        sportPlayers: newSportPlayers
      };
    });
  }

  const removeSport = (sport: string) => {
    setFormData(prev => {
      const newSportPlayers = { ...prev.sportPlayers };
      delete newSportPlayers[sport];
      
      return {
        ...prev,
        sports: prev.sports.filter(s => s !== sport),
        sportPlayers: newSportPlayers
      };
    });
  }

  const updateSportPlayers = (sport: string, players: number) => {
    setFormData(prev => ({
      ...prev,
      sportPlayers: {
        ...prev.sportPlayers,
        [sport]: players
      }
    }));
  }

  const toggleWithdrawal = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      withdrawnSports: (prev.withdrawnSports || []).includes(sport)
        ? (prev.withdrawnSports || []).filter(s => s !== sport)
        : [...(prev.withdrawnSports || []), sport]
    }))
  }

  const removeWithdrawal = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      withdrawnSports: (prev.withdrawnSports || []).filter(s => s !== sport)
    }))
  }

  const toggleCompetingStatus = async (universityId: string, currentStatus: boolean) => {
    try {
      setLoading(true)
      const updateResult = await realtimeDbUtils.updateData(
        `zones/${currentZone}/universities/${universityId}`,
        { isCompeting: !currentStatus }
      )
      if (updateResult.success) {
        setSuccess(`University ${!currentStatus ? 'enabled' : 'disabled'} for competition`)
        loadUniversities()
      } else {
        setError("Failed to update competing status")
      }
    } catch (err) {
      setError("Failed to update competing status")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (universityId: string) => {
    if (confirm("Are you sure you want to delete this university?")) {
      try {
        setLoading(true)
        setError(null)
        setSuccess(null)
        
        console.log('Deleting university:', `zones/${currentZone}/universities/${universityId}`)
        
        // First, let's check if the university exists before deletion
        const checkResult = await realtimeDbUtils.getData(`zones/${currentZone}/universities/${universityId}`)
        console.log('University exists before deletion:', checkResult)
        
        const deleteResult = await realtimeDbUtils.deleteData(
          `zones/${currentZone}/universities/${universityId}`
        )
        
        console.log('Delete result:', deleteResult)
        
        // Check if it's actually deleted
        const verifyResult = await realtimeDbUtils.getData(`zones/${currentZone}/universities/${universityId}`)
        console.log('University exists after deletion:', verifyResult)
        
        if (deleteResult.success) {
          console.log('University deleted successfully from database')
          setSuccess("University deleted successfully")
          
          // Immediately update local state to remove the university
          setUniversities(prevUniversities => {
            const filtered = prevUniversities.filter(u => u.id !== universityId)
            console.log('Updated universities list:', filtered.length, filtered)
            return filtered
          })
          
          // Don't reload immediately - let the local state update handle it
          // setTimeout(async () => {
          //   await loadUniversities()
          // }, 100)
        } else {
          console.error('Failed to delete university:', deleteResult.error)
          setError("Failed to delete university")
        }
      } catch (err) {
        console.error('Error deleting university:', err)
        setError("Failed to delete university")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Help Text */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>How to use:</strong> Select a university from the dropdown to edit their sports, competing status, and details. 
          The universities are loaded from the website data and synced with the database automatically.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <span>University Management</span>
            </CardTitle>
             <div className="flex items-center space-x-2">
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={loadUniversities}
                 disabled={loading}
               >
                 {loading ? "Loading..." : "Refresh"}
               </Button>
             </div>
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

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold">Universities in {currentZone}</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingUniversity(null)
                  setFormData({ 
                    name: "", 
                    abbreviation: "", 
                    zone: currentZone, 
                    isActive: true,
                    sports: [],
                    isCompeting: true,
                    members: 0,
                    wins: 0,
                    losses: 0,
                    points: 0,
                    description: "",
                    tournamentDate: ""
                  })
                }} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add University
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingUniversity ? "Edit University" : "Add New University"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Quick University Selector */}
                  {!editingUniversity && (
                    <div className="space-y-2">
                      <Label htmlFor="university-selector">Quick Select from Website</Label>
                      <Select onValueChange={(value) => {
                        const selectedUni = websiteUniversities.find(uni => uni.id === value)
                        if (selectedUni) {
                          setFormData({
                            name: selectedUni.name,
                            zone: selectedUni.zone,
                            isActive: true,
                            sports: selectedUni.sports || [],
                            isCompeting: selectedUni.isCompeting || false,
                            members: selectedUni.members || 0,
                            wins: selectedUni.wins || 0,
                            losses: selectedUni.losses || 0,
                            points: selectedUni.points || 0,
                            description: selectedUni.description || "",
                            tournamentDate: selectedUni.tournamentDate || "",
                            withdrawnSports: selectedUni.withdrawnSports || [],
                            withdrawalReason: selectedUni.withdrawalReason || ""
                          })
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a university to edit" />
                        </SelectTrigger>
                        <SelectContent>
                          {websiteUniversities
                            .filter(uni => uni.zone === currentZone)
                            .map((uni) => (
                              <SelectItem key={uni.id} value={uni.id}>
                                {uni.name} ({uni.zone})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">University Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter university name"
                      required
                    />
                  </div>
                  
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone</Label>
                    <Select value={formData.zone} onValueChange={(value) => setFormData({ ...formData, zone: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableZones.map((zone) => (
                          <SelectItem key={zone.value} value={zone.value}>
                            {zone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                    <div className="space-y-2">
                      <Label htmlFor="tournamentDate">Tournament Date</Label>
                      <Select value={formData.tournamentDate} onValueChange={(value) => setFormData({ ...formData, tournamentDate: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tournament date" />
                        </SelectTrigger>
                        <SelectContent>
                          {tournamentDates.map((date) => (
                            <SelectItem key={date.value} value={date.value}>
                              {date.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Sports - Assign/Remove Sports</Label>
                    <p className="text-sm text-gray-600">
                      Click sports to assign them to this university. Click the X to remove.
                    </p>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {availableSports.map((sport) => (
                          <Button
                            key={sport}
                            type="button"
                            variant={formData.sports.includes(sport) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSport(sport)}
                          >
                            <Trophy className="w-3 h-3 mr-1" />
                            {sport}
                          </Button>
                        ))}
                      </div>
                      {formData.sports.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-sm text-gray-600">Selected sports:</span>
                          {formData.sports.map((sport) => (
                            <div key={sport} className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                              <Badge variant="secondary" className="flex items-center gap-1">
                                {sport}
                                <X 
                                  className="w-3 h-3 cursor-pointer hover:text-red-600" 
                                  onClick={() => removeSport(sport)}
                                />
                              </Badge>
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`players-${sport}`} className="text-sm">Players:</Label>
                                <Input
                                  id={`players-${sport}`}
                                  type="number"
                                  value={formData.sportPlayers[sport] || 15}
                                  onChange={(e) => updateSportPlayers(sport, parseInt(e.target.value) || 15)}
                                  className="w-16 h-8 text-sm"
                                  min="1"
                                  max="50"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Withdrawal Section */}
                  {formData.sports.length > 0 && (
                    <div className="space-y-2">
                      <Label>Withdrawals - Mark Sports as Withdrawn</Label>
                      <p className="text-sm text-gray-600">
                        Mark specific sports as withdrawn (different from not competing - they were competing but withdrew)
                      </p>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.sports.map((sport) => (
                            <Button
                              key={sport}
                              type="button"
                              variant={(formData.withdrawnSports || []).includes(sport) ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => toggleWithdrawal(sport)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              {sport} {(formData.withdrawnSports || []).includes(sport) ? "(Withdrawn)" : "(Withdraw)"}
                            </Button>
                          ))}
                        </div>
                        {(formData.withdrawnSports || []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-gray-600">Withdrawn sports:</span>
                            {(formData.withdrawnSports || []).map((sport) => (
                              <Badge key={sport} variant="destructive" className="flex items-center gap-1">
                                {sport}
                                <X 
                                  className="w-3 h-3 cursor-pointer hover:bg-red-700" 
                                  onClick={() => removeWithdrawal(sport)}
                                />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {(formData.withdrawnSports || []).length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="withdrawalReason">Withdrawal Reason (Optional)</Label>
                          <Input
                            id="withdrawalReason"
                            value={formData.withdrawalReason}
                            onChange={(e) => setFormData(prev => ({ ...prev, withdrawalReason: e.target.value }))}
                            placeholder="e.g., Injury, scheduling conflict, etc."
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="University description"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="members">Members</Label>
                      <Input
                        id="members"
                        type="number"
                        value={formData.members}
                        onChange={(e) => setFormData({ ...formData, members: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wins">Wins</Label>
                      <Input
                        id="wins"
                        type="number"
                        value={formData.wins}
                        onChange={(e) => setFormData({ ...formData, wins: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="losses">Losses</Label>
                      <Input
                        id="losses"
                        type="number"
                        value={formData.losses}
                        onChange={(e) => setFormData({ ...formData, losses: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="points">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isCompeting"
                      checked={formData.isCompeting}
                      onChange={(e) => setFormData({ ...formData, isCompeting: e.target.checked })}
                    />
                    <Label htmlFor="isCompeting">Competing in Tournament</Label>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingUniversity ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading universities...</p>
            </div>
          ) : universities.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No universities found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Sports & Players</TableHead>
                      <TableHead>Competing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {universities && Array.isArray(universities) && universities.map((university) => (
                      <TableRow key={university.id}>
                        <TableCell className="font-medium">{university.name}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              university.zone === 'NZ+CZ' 
                                ? 'border-red-500 text-red-700 bg-red-50' 
                                : university.zone === 'LZ+SZ'
                                ? 'border-blue-500 text-blue-700 bg-blue-50'
                                : 'border-gray-500 text-gray-700 bg-gray-50'
                            }
                          >
                            {university.zone}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {(university.sports || []).map((sport) => (
                              <div key={sport} className="flex items-center gap-1 text-xs">
                                <Badge variant="secondary" className="text-xs">
                                  {sport}
                                </Badge>
                                <span className="text-gray-500">
                                  ({university.sportPlayers?.[sport] || 15} players)
                                </span>
                              </div>
                            ))}
                            {(!university.sports || university.sports.length === 0) && (
                              <span className="text-gray-400 text-xs">No sports</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={university.isCompeting !== false ? "default" : "secondary"}
                            onClick={() => toggleCompetingStatus(university.id, university.isCompeting !== false)}
                            disabled={loading}
                          >
                            {university.isCompeting !== false ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Competing
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Not Competing
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant={university.isActive ? "default" : "secondary"}>
                            {university.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(university)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(university.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
                {universities && Array.isArray(universities) && universities.map((university) => (
                  <Card key={university.id} className="p-4">
                    <div className="space-y-3">
                      {/* University Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{university.name}</h3>
                          <p className="text-sm text-gray-600">{university.abbreviation}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge variant={university.isActive ? "default" : "secondary"}>
                            {university.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            size="sm"
                            variant={university.isCompeting !== false ? "default" : "secondary"}
                            onClick={() => toggleCompetingStatus(university.id, university.isCompeting !== false)}
                            disabled={loading}
                            className="text-xs"
                          >
                            {university.isCompeting !== false ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Competing
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Not Competing
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* University Details */}
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Zone:</span>
                          <div className="font-medium">
                            <Badge variant="outline" className="ml-2">{university.zone}</Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Sports:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(university.sports || []).map((sport) => (
                              <Badge key={sport} variant="secondary" className="text-xs">
                                {sport}
                              </Badge>
                            ))}
                            {(!university.sports || university.sports.length === 0) && (
                              <span className="text-gray-400 text-xs">No sports assigned</span>
                            )}
                          </div>
                        </div>
                        {university.tournamentDate && (
                          <div>
                            <span className="text-gray-500">Tournament Date:</span>
                            <p className="font-medium">{university.tournamentDate}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(university)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(university.id)}
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