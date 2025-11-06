"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Users, ArrowRight, Plus, X, AlertCircle } from "lucide-react"
import { collection, getDocs, onSnapshot, doc, updateDoc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore"
import { ref, get, set, update, remove } from "firebase/database"
import { db, realtimeDb } from "@/lib/firebase"
import { universities as staticUniversities, sportsConfig } from "@/app/teams/page"

interface WaitingListTeam {
  id: string
  university: string
  sport: string
  teamType: "A" | "B"
  addedAt: number
}

interface WaitingListManagementProps {
  adminCheck?: {
    isAdmin: boolean
    isSuperAdmin: boolean
  }
}

export function WaitingListManagement({ adminCheck }: WaitingListManagementProps) {
  const [waitingList, setWaitingList] = useState<WaitingListTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState<WaitingListTeam | null>(null)
  const [newTeam, setNewTeam] = useState({ university: "", sport: "", teamType: "A" as "A" | "B" })
  const [universities, setUniversities] = useState<any[]>([])

  // Load universities
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        // Load from Firestore
        const universitiesRef = collection(db, "universities")
        const snapshot = await getDocs(universitiesRef)
        const firestoreUnis = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Merge with static competing universities
        const staticCompetingUnis = staticUniversities.filter(uni => uni.isCompeting === true)
        const allUnis = [...firestoreUnis, ...staticCompetingUnis]
        
        // Remove duplicates and sort
        const uniqueUnis = Array.from(
          new Map(allUnis.map(uni => [uni.name, uni])).values()
        ).sort((a, b) => a.name.localeCompare(b.name))

        setUniversities(uniqueUnis)
      } catch (error) {
        console.error("Error loading universities:", error)
      }
    }

    loadUniversities()
  }, [])

  // Load waiting list from Firestore
  useEffect(() => {
    const waitingListRef = collection(db, "waitingList")
    const q = query(waitingListRef, orderBy("addedAt", "asc"))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WaitingListTeam[]
      setWaitingList(teams)
      setLoading(false)
    }, (error) => {
      console.error("Error loading waiting list:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleAddToWaitingList = async () => {
    if (!newTeam.university || !newTeam.sport) return

    try {
      const teamId = `waiting-${newTeam.university}-${newTeam.sport}-${newTeam.teamType}-${Date.now()}`
      const waitingListRef = collection(db, "waitingList")
      
      await setDoc(doc(waitingListRef, teamId), {
        university: newTeam.university,
        sport: newTeam.sport,
        teamType: newTeam.teamType,
        addedAt: Date.now()
      })

      // Also update Realtime Database
      const realtimeRef = ref(realtimeDb, `waitingList/${teamId}`)
      await set(realtimeRef, {
        university: newTeam.university,
        sport: newTeam.sport,
        teamType: newTeam.teamType,
        addedAt: Date.now()
      })

      setNewTeam({ university: "", sport: "", teamType: "A" })
      setShowAddDialog(false)
    } catch (error) {
      console.error("Error adding to waiting list:", error)
    }
  }

  const handleMoveToConfirmed = async (team: WaitingListTeam) => {
    try {
      // Find the university
      const university = universities.find(uni => uni.name === team.university)
      if (!university) {
        console.error("University not found:", team.university)
        return
      }

      // Update university's teamInfo to open the team
      const universityRef = doc(db, "universities", university.id || `uni-${team.university}`)
      const currentTeamInfo = university.teamInfo || {}
      
      if (!currentTeamInfo[team.sport]) {
        currentTeamInfo[team.sport] = {}
      }
      
      if (team.teamType === "A") {
        currentTeamInfo[team.sport].teamA = { isOpen: true }
      } else {
        currentTeamInfo[team.sport].teamB = { isOpen: true }
      }

      // Ensure the sport is in the sports array
      const currentSports = university.sports || []
      if (!currentSports.includes(team.sport)) {
        currentSports.push(team.sport)
      }

      // Update Firestore
      await updateDoc(universityRef, {
        teamInfo: currentTeamInfo,
        sports: currentSports
      })

      // Update Realtime Database
      const realtimeRef = ref(realtimeDb, `universities/${university.id || `uni-${team.university}`}`)
      const currentData = await get(realtimeRef)
      const currentDataVal = currentData.val() || {}
      
      await update(realtimeRef, {
        teamInfo: currentTeamInfo,
        sports: currentSports
      })

      // Remove from waiting list
      await deleteDoc(doc(db, "waitingList", team.id))
      const waitingRealtimeRef = ref(realtimeDb, `waitingList/${team.id}`)
      await remove(waitingRealtimeRef)

      setShowMoveDialog(null)
    } catch (error) {
      console.error("Error moving team to confirmed:", error)
    }
  }

  const handleRemoveFromWaitingList = async (team: WaitingListTeam) => {
    try {
      await deleteDoc(doc(db, "waitingList", team.id))
      const waitingRealtimeRef = ref(realtimeDb, `waitingList/${team.id}`)
      await remove(waitingRealtimeRef)
    } catch (error) {
      console.error("Error removing from waiting list:", error)
    }
  }

  // Group waiting list by sport
  const waitingListBySport = waitingList.reduce((acc, team) => {
    if (!acc[team.sport]) {
      acc[team.sport] = []
    }
    acc[team.sport].push(team)
    return acc
  }, {} as Record<string, WaitingListTeam[]>)

  const sports = Object.keys(sportsConfig)

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading waiting list...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Waiting List Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage teams on the waiting list and move them to confirmed when spots open</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add to Waiting List
        </Button>
      </div>

      {/* Add to Waiting List Dialog */}
      <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Team to Waiting List</AlertDialogTitle>
            <AlertDialogDescription>
              Add a team to the waiting list for a specific sport.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">University</label>
              <Select value={newTeam.university} onValueChange={(value) => setNewTeam({ ...newTeam, university: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((uni) => (
                    <SelectItem key={uni.id || uni.name} value={uni.name}>
                      {uni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sport</label>
              <Select value={newTeam.sport} onValueChange={(value) => setNewTeam({ ...newTeam, sport: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Team Type</label>
              <Select value={newTeam.teamType} onValueChange={(value: "A" | "B") => setNewTeam({ ...newTeam, teamType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Team A</SelectItem>
                  <SelectItem value="B">Team B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddToWaitingList}>Add to Waiting List</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move to Confirmed Dialog */}
      <AlertDialog open={!!showMoveDialog} onOpenChange={(open) => !open && setShowMoveDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move Team to Confirmed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move {showMoveDialog?.university} {showMoveDialog?.sport} Team {showMoveDialog?.teamType} from the waiting list to confirmed? This will open the team for registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => showMoveDialog && handleMoveToConfirmed(showMoveDialog)}>
              Move to Confirmed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Waiting List by Sport */}
      {sports.map((sport) => {
        const teams = waitingListBySport[sport] || []
        const config = sportsConfig[sport as keyof typeof sportsConfig]
        const confirmedTeams = universities.reduce((count, uni) => {
          if (!uni.sports || !uni.sports.includes(sport)) return count
          const teamInfo = uni.teamInfo?.[sport]
          let teamCount = 0
          if (teamInfo?.teamA?.isOpen !== false) teamCount++
          if (teamInfo?.teamB?.isOpen === true) teamCount++
          return count + teamCount
        }, 0)
        const availableSpots = config.maxCapacity - confirmedTeams

        return (
          <Card key={sport}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {sport}
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Badge variant={availableSpots > 0 ? "default" : "destructive"}>
                    {availableSpots > 0 ? `${availableSpots} spots available` : "Full"}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {confirmedTeams}/{config.maxCapacity} confirmed
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {teams.length > 0 ? (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">{team.university}</div>
                          <div className="text-sm text-gray-600">Team {team.teamType}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {availableSpots > 0 && (
                          <Button
                            size="sm"
                            onClick={() => setShowMoveDialog(team)}
                            className="flex items-center gap-2"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Move to Confirmed
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveFromWaitingList(team)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No teams on waiting list for {sport}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

