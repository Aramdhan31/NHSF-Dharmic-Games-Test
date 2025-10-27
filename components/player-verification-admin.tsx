"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  FileText, 
  User, 
  GraduationCap,
  Mail,
  Phone,
  AlertCircle,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Player {
  id: string
  name: string
  studentId: string
  email: string
  phone: string
  year: string
  course: string
  sports: string[]
  emergencyContact: string
  emergencyPhone: string
  medicalInfo?: string
  idVerified: boolean
  idDocument?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  universityId: string
  universityName: string
  submittedAt: string
  verifiedAt?: string
  verifiedBy?: string
  rejectionReason?: string
}

interface PlayerVerificationAdminProps {
  currentUser: any
}

export default function PlayerVerificationAdmin({ currentUser }: PlayerVerificationAdminProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending')
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  // Load players needing verification
  useEffect(() => {
    loadPlayersForVerification()
  }, [])

  // Filter players based on search and status
  useEffect(() => {
    let filtered = players

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(player => player.verificationStatus === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.universityName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPlayers(filtered)
  }, [players, filterStatus, searchTerm])

  const loadPlayersForVerification = async () => {
    try {
      setLoading(true)
      
      // Load all universities and their players
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      const universitiesRef = collection(db, 'universities')
      const universitiesSnapshot = await getDocs(universitiesRef)
      
      const allPlayers: Player[] = []
      
      universitiesSnapshot.forEach(doc => {
        const universityData = doc.data()
        const universityPlayers = universityData.players || []
        
        universityPlayers.forEach((player: any) => {
          allPlayers.push({
            ...player,
            universityId: doc.id,
            universityName: universityData.name || 'Unknown University',
            submittedAt: player.submittedAt || new Date().toISOString(),
            verificationStatus: player.verificationStatus || 'pending',
            idVerified: player.idVerified || false
          })
        })
      })
      
      setPlayers(allPlayers)
    } catch (error) {
      console.error('Error loading players:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPlayer = async (playerId: string, universityId: string, status: 'verified' | 'rejected') => {
    try {
      // Update player verification status
      const { doc, updateDoc, arrayUnion, arrayRemove } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      
      const universityRef = doc(db, 'universities', universityId)
      const universityDoc = await getDocs([universityRef])
      
      if (!universityDoc.empty) {
        const universityData = universityDoc.docs[0].data()
        const players = universityData.players || []
        
        // Find and update the specific player
        const updatedPlayers = players.map((player: any) => {
          if (player.id === playerId) {
            return {
              ...player,
              verificationStatus: status,
              idVerified: status === 'verified',
              verifiedAt: new Date().toISOString(),
              verifiedBy: currentUser?.email || 'Admin',
              rejectionReason: status === 'rejected' ? rejectionReason : undefined
            }
          }
          return player
        })
        
        // Update the university document
        await updateDoc(universityRef, {
          players: updatedPlayers
        })
        
        // Also update in Realtime Database for live updates
        const realtimeDbUtils = await import('@/lib/firebase-utils').then(m => m.realtimeDbUtils)
        const player = updatedPlayers.find((p: any) => p.id === playerId)
        
        if (player) {
          await realtimeDbUtils.setData(`zones/${universityData.zone}/universities/${universityId}/players/${playerId}`, player)
        }
      }
      
      // Reload players
      await loadPlayersForVerification()
      setShowVerificationDialog(false)
      setSelectedPlayer(null)
      setRejectionReason('')
      
    } catch (error) {
      console.error('Error verifying player:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const openVerificationDialog = (player: Player) => {
    setSelectedPlayer(player)
    setRejectionReason(player.rejectionReason || '')
    setShowVerificationDialog(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-2">Loading players for verification...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            Player ID Verification
          </CardTitle>
          <CardDescription>
            Review and verify student ID documents for university players
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold">{players.filter(p => p.verificationStatus === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold">{players.filter(p => p.verificationStatus === 'verified').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{players.filter(p => p.verificationStatus === 'rejected').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Players</p>
                <p className="text-2xl font-bold">{players.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, student ID, email, or university..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Players Table */}
      <Card>
        <CardHeader>
          <CardTitle>Players Requiring Verification</CardTitle>
          <CardDescription>
            Click on a player to review their ID verification documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Sports</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-500">{player.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                      {player.universityName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{player.studentId}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {player.sports.slice(0, 2).map((sport) => (
                        <Badge key={sport} variant="outline" className="text-xs">
                          {sport}
                        </Badge>
                      ))}
                      {player.sports.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{player.sports.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(player.verificationStatus)}
                  </TableCell>
                  <TableCell>
                    {new Date(player.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openVerificationDialog(player)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPlayers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No players found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              ID Verification Review
            </DialogTitle>
            <DialogDescription>
              Review the player's information and ID document
            </DialogDescription>
          </DialogHeader>

          {selectedPlayer && (
            <div className="space-y-6">
              {/* Player Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Player Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                    <p className="text-lg font-medium">{selectedPlayer.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Student ID</Label>
                    <p className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">{selectedPlayer.studentId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-lg">{selectedPlayer.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Phone</Label>
                    <p className="text-lg">{selectedPlayer.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">University</Label>
                    <p className="text-lg">{selectedPlayer.universityName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Academic Year</Label>
                    <p className="text-lg">{selectedPlayer.year}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Course</Label>
                    <p className="text-lg">{selectedPlayer.course}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Sports</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPlayer.sports.map((sport) => (
                        <Badge key={sport} variant="secondary">
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* University Verification Check */}
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-800">
                    <Shield className="h-5 w-5 mr-2" />
                    University Verification Check
                  </CardTitle>
                  <CardDescription className="text-orange-700">
                    Verify this student actually attends the university they're registering for
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <Label className="text-sm font-medium text-gray-500">Student Claims to Attend</Label>
                      <p className="text-lg font-medium text-blue-600">{selectedPlayer.universityName}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <Label className="text-sm font-medium text-gray-500">Email Domain</Label>
                      <p className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">{selectedPlayer.email.split('@')[1]}</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <Label className="text-sm font-medium text-gray-500">Student ID Document</Label>
                    {selectedPlayer.idDocument ? (
                      <div className="mt-2">
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-gray-400" />
                            <span className="font-medium">{selectedPlayer.idDocument}</span>
                          </div>
                          <Button size="sm" variant="outline">
                            View Document
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No ID document uploaded. This player cannot be verified.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Verification Guidelines:</strong><br />
                      1. Does the ID document show the correct university name?<br />
                      2. Does the student ID number on the document match what they entered?<br />
                      3. Does the email domain match the university they're registering for?<br />
                      4. Is the ID document current/valid?<br />
                      <br />
                      <strong>Note:</strong> If unsure, you can approve and monitor, or request additional verification.
                    </AlertDescription>
                  </Alert>

                  {/* Email Domain Guidance */}
                  <div className="bg-white p-4 rounded-lg border">
                    <Label className="text-sm font-medium text-gray-500">Email Domain Check for {selectedPlayer.universityName}</Label>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Expected patterns: <code className="bg-gray-100 px-1 rounded">student@university.ac.uk</code>, <code className="bg-gray-100 px-1 rounded">name@university.ac.uk</code></p>
                      <p className="mt-1 text-amber-700">
                        <strong>Note:</strong> Email domain mismatch could indicate cross-university registration, but some students may use personal emails. Use your judgment.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Contact Name</Label>
                    <p className="text-lg">{selectedPlayer.emergencyContact}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Contact Phone</Label>
                    <p className="text-lg">{selectedPlayer.emergencyPhone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information */}
              {selectedPlayer.medicalInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{selectedPlayer.medicalInfo}</p>
                  </CardContent>
                </Card>
              )}

              {/* Verification Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Verification Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPlayer.verificationStatus === 'rejected' && (
                    <div className="space-y-2">
                      <Label>Rejection Reason</Label>
                      <Input
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g., 'Concern: Student ID appears to be from different university - please verify' or 'Additional verification needed for email domain'"
                        className="h-12"
                      />
                    </div>
                  )}

                  {/* Advisory Notes */}
                  <div className="space-y-2">
                    <Label>Common Concerns (Click to add as note)</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectionReason("Concern: Student ID appears to be from different university - please verify")}
                        className="text-xs"
                      >
                        Different University
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectionReason("Concern: Email domain does not match claimed university - please verify")}
                        className="text-xs"
                      >
                        Email Domain Mismatch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectionReason("Concern: Student ID number does not match document - please verify")}
                        className="text-xs"
                      >
                        ID Number Mismatch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectionReason("Concern: ID document is unclear - additional verification needed")}
                        className="text-xs"
                      >
                        Unclear Document
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      These are advisory notes. You can still approve if you're confident about the player's eligibility.
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowVerificationDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleVerifyPlayer(selectedPlayer.id, selectedPlayer.universityId, 'rejected')}
                      disabled={selectedPlayer.verificationStatus === 'rejected' && !rejectionReason.trim()}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleVerifyPlayer(selectedPlayer.id, selectedPlayer.universityId, 'verified')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
