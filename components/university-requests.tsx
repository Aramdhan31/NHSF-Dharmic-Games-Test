"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  GraduationCap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Mail, 
  Phone, 
  Globe,
  Users,
  Trophy,
  Calendar,
  AlertCircle,
  Trash2,
  Edit,
  UserCheck,
  RotateCcw,
  Key
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, where, serverTimestamp, addDoc } from 'firebase/firestore'

interface UniversityRequest {
  id: string
  name: string
  email: string
  username: string
  zone: string
  contactPerson: string
  contactRole: string
  status: 'pending_approval' | 'approved' | 'rejected'
  requestDate: string
  reviewed: boolean
  uid: string
}

interface University {
  id: string
  name: string
  email: string
  username: string
  zone: string
  contactPerson: string
  contactRole: string
  status: 'pending_approval' | 'approved' | 'rejected'
  sports: string[]
  players: any[]
  createdAt: string
}

export function UniversityRequests() {
  const [requests, setRequests] = useState<UniversityRequest[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'requests' | 'approved'>('requests')
  const [selectedRequest, setSelectedRequest] = useState<UniversityRequest | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load university requests
      const requestsRef = collection(db, 'universityRequests')
      const q = query(requestsRef, orderBy('requestDate', 'desc'))
      const requestsSnapshot = await getDocs(q)
      
      const requestsData = requestsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data?.name || 'Unknown University',
          email: data?.email || 'No email',
          username: data?.username || 'No username',
          zone: data?.zone || 'Unknown Zone',
          contactPerson: data?.contactPerson || 'Unknown Contact',
          contactRole: data?.contactRole || 'Unknown Role',
          status: data?.status || 'pending_approval',
          requestDate: data?.requestDate || new Date().toISOString(),
          reviewed: data?.reviewed || false,
          uid: data?.uid || doc.id,
          sports: data?.sports || []
        }
      }) as UniversityRequest[]
      setRequests(requestsData)

      // Load approved universities
      const universitiesRef = collection(db, 'universities')
      const q2 = query(universitiesRef, orderBy('createdAt', 'desc'))
      const universitiesSnapshot = await getDocs(q2)
      
      const universitiesData = universitiesSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data?.name || 'Unknown University',
          email: data?.email || 'No email',
          username: data?.username || 'No username',
          zone: data?.zone || 'Unknown Zone',
          contactPerson: data?.contactPerson || 'Unknown Contact',
          contactRole: data?.contactRole || 'Unknown Role',
          approved: data?.approved || false,
          createdAt: data?.createdAt || new Date().toISOString()
        }
      }) as University[]
      setUniversities(universitiesData)
      
    } catch (err: any) {
      setError('Failed to load university data')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      // Get the full request data
      const request = requests.find(r => r.id === requestId)
      if (!request) {
        setError('Request not found')
        return
      }

      // Call the server-side API to approve the university
      const response = await fetch('/api/approve-university-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          name: request.name,
          email: request.email,
          username: request.username,
          zone: request.zone,
          contactPerson: request.contactPerson,
          contactRole: request.contactRole
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve university')
      }

      // Reload requests
      await loadUniversityRequests()
      
      // Close details dialog if open
      setShowDetails(false)
      setSelectedRequest(null)

    } catch (err: any) {
      setError('Failed to approve university request: ' + err.message)
      console.error('Error approving request:', err)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      // Call the server-side API to reject the university
      const response = await fetch('/api/reject-university', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: requestId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject university')
      }

      // Reload requests
      await loadUniversityRequests()
      
      // Close details dialog if open
      setShowDetails(false)
      setSelectedRequest(null)

    } catch (err: any) {
      setError('Failed to reject university request: ' + err.message)
      console.error('Error rejecting request:', err)
    }
  }

  const handleChangeRejectDecision = async (requestId: string, newStatus: string) => {
    try {
      // Get the request data to find the email
      const request = requests.find(r => r.id === requestId)
      if (!request) {
        setError('Request not found')
        return
      }

      const response = await fetch('/api/change-reject-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: requestId,
          newStatus: newStatus,
          email: request.email
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change decision')
      }

      // Reload requests
      await loadUniversityRequests()
      
      // Close details dialog if open
      setShowDetails(false)
      setSelectedRequest(null)

    } catch (err: any) {
      setError('Failed to change decision: ' + err.message)
      console.error('Error changing decision:', err)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request? This will permanently remove it from the system.')) {
      return
    }

    try {
      const response = await fetch('/api/delete-university-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: requestId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete request')
      }

      // Reload requests
      await loadUniversityRequests()
      
      // Close details dialog if open
      setShowDetails(false)
      setSelectedRequest(null)

    } catch (err: any) {
      setError('Failed to delete request: ' + err.message)
      console.error('Error deleting request:', err)
    }
  }

  const handleResetPassword = async (universityEmail: string) => {
    const newPassword = prompt(`Enter new password for ${universityEmail}:`)
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (!confirm(`Are you sure you want to reset the password for ${universityEmail}?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/reset-university-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: universityEmail, 
          newPassword: newPassword 
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Password reset successfully for ${universityEmail}`)
      } else {
        setError(result.error || 'Failed to reset password')
      }
    } catch (err: any) {
      setError('Failed to reset password: ' + err.message)
      console.error('Error resetting password:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUniversity = async (universityId: string) => {
    if (!confirm('⚠️ WARNING: Are you sure you want to DELETE this university account?\n\nThis will permanently remove:\n• University account\n• All player data\n• All associated records\n\nThis action CANNOT be undone!')) {
      return
    }

    try {
      // Delete from universities collection
      await deleteDoc(doc(db, 'universities', universityId))
      
      // Also delete from universityRequests if it exists there
      const requestsRef = collection(db, 'universityRequests')
      const q = query(requestsRef, where('uid', '==', universityId))
      const requestsSnapshot = await getDocs(q)
      
      requestsSnapshot.forEach(async (requestDoc) => {
        await deleteDoc(requestDoc.ref)
      })

      // Reload data
      await loadData()
      
    } catch (err: any) {
      setError('Failed to delete university')
      console.error('Error deleting university:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading university data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <GraduationCap className="h-6 w-6 mr-2" />
            University Management
          </h2>
          <p className="text-gray-600">
            Manage universities and approved accounts
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'requests'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Signups ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'approved'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Approved Universities ({universities.length})
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'pending_approval').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
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
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>University Management</CardTitle>
          <CardDescription>
            Manage university accounts - add, edit, disable/enable accounts, and remove universities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>University</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Sports</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.name}</div>
                      <div className="text-sm text-gray-500">{request.abbreviation}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.contactPerson}</div>
                      <div className="text-sm text-gray-500">{request.contactRole}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.zone}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(request.sports || []).slice(0, 2).map((sport) => (
                        <Badge key={sport} variant="secondary" className="text-xs">
                          {sport}
                        </Badge>
                      ))}
                      {(request.sports || []).length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(request.sports || []).length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{formatDate(request.requestDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowDetails(true)
                        }}
                      >
                        View Details
                      </Button>
                      {request.status === 'pending_approval' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(request.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No universities found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approved Universities Table */}
      {activeTab === 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>Approved Universities</CardTitle>
            <CardDescription>
              Manage approved university accounts - reset passwords, disable/enable, or delete accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>University</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {universities.map((university) => (
                  <TableRow key={university.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{university.name}</div>
                        <div className="text-sm text-gray-500">{university.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{university.contactPerson}</div>
                        <div className="text-sm text-gray-500">{university.contactRole}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{university.zone}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={university.approved ? "default" : "secondary"}>
                        {university.approved ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(university.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(university.email)}
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUniversity(university.id)}
                          title="Delete University"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {universities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No approved universities found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2" />
              University Details
            </DialogTitle>
            <DialogDescription>
              Review all details before making a decision
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">University Information</h3>
                  <div className="space-y-2">
                    <div><span className="font-medium">Name:</span> {selectedRequest.name}</div>
                    <div><span className="font-medium">Zone:</span> <Badge variant="outline">{selectedRequest.zone}</Badge></div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      <span>{selectedRequest.email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div><span className="font-medium">Contact Person:</span> {selectedRequest.contactPerson}</div>
                    <div><span className="font-medium">Role:</span> {selectedRequest.contactRole}</div>
                  </div>
                </div>
              </div>


              {/* Additional Information */}
              {selectedRequest.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <p className="text-gray-700">{selectedRequest.description}</p>
                </div>
              )}

              {/* Request Details */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Request Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><span className="font-medium">Request Date:</span> {formatDate(selectedRequest.requestDate)}</div>
                  <div><span className="font-medium">Status:</span> {getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending_approval' && (
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleReject(selectedRequest.id)
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Request
                  </Button>
                  <Button
                    onClick={() => {
                      handleApprove(selectedRequest.id)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Request
                  </Button>
                </div>
              )}

              {/* Rejected Request Actions */}
              {selectedRequest.status === 'rejected' && (
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteRequest(selectedRequest.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Request
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleChangeRejectDecision(selectedRequest.id, 'pending_approval')
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Change to Pending
                  </Button>
                  <Button
                    onClick={() => {
                      handleChangeRejectDecision(selectedRequest.id, 'approved')
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Now
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
