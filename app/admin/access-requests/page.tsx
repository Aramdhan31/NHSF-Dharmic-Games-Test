"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// Removed Firebase context import - using server-side APIs only
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Shield, 
  UserCheck, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Mail,
  MapPin,
  Menu,
  X,
  LogOut,
  User,
  UserCog
} from "lucide-react"
// Removed user management service - using server-side APIs only

type CombinedZone = 'NZ+CZ' | 'LZ+SZ' | 'ALL';

interface AdminRequest {
  requestId: string
  email: string
  passwordHash: string
  passwordSalt: string
  displayName: string
  firstName: string
  lastName: string
  zone: CombinedZone
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function AccessRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check if admin is logged in via localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if we're in the browser (not during build)
    if (typeof window === 'undefined') return
    
    const adminEmail = localStorage.getItem('adminEmail')
    if (adminEmail) {
      setIsLoggedIn(true)
    } else {
      router.push('/admin/login')
    }
  }, [router])

  // Load pending admin requests
  useEffect(() => {
    if (!isLoggedIn) return
    
    const loadRequests = async () => {
      setLoadingRequests(true)
      try {
        // Load from adminAccessRequests collection
        const { db } = await import('@/lib/firebase')
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        
        console.log('Loading admin requests...')
        
        const requestsRef = collection(db, 'adminAccessRequests')
        const q = query(requestsRef, where('status', '==', 'pending'))
        const querySnapshot = await getDocs(q)
        
        const pendingRequests: AdminRequest[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          pendingRequests.push({
            requestId: doc.id,
            email: data.email,
            passwordHash: data.passwordHash,
            passwordSalt: data.passwordSalt,
            displayName: data.displayName,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            zone: data.zone,
            requestedAt: data.requestedAt || '',
            status: data.status
          })
        })
        
        setRequests(pendingRequests)
      } catch (error) {
        console.error('Error loading requests:', error)
        setError('Failed to load admin access requests')
      } finally {
        setLoadingRequests(false)
      }
    }

    loadRequests()
  }, [isLoggedIn])

  const handleApprove = async (requestId: string, email: string, zone: CombinedZone) => {
    setProcessing(requestId)
    setError(null)
    setSuccess(null)

    try {
      // Get the full request data
      const request = requests.find(r => r.requestId === requestId)
      if (!request) {
        setError('Request not found')
        setProcessing(null)
        return
      }

      // Call server-side API to approve the admin request
      const response = await fetch('/api/approve-admin-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: requestId,
          email: request.email,
          zone: zone
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve admin request')
      }
      
      setSuccess(`Admin access approved for ${email}. Account created successfully!`)
      // Remove from list
      setRequests(requests.filter(r => r.requestId !== requestId))

    } catch (error: any) {
      console.error('Error approving request:', error)
      setError('An error occurred while approving the request: ' + (error.message || 'Unknown error'))
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (requestId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to reject the admin access request from ${email}?`)) {
      return
    }

    setProcessing(requestId)
    setError(null)
    setSuccess(null)

    try {
      // Delete the request from adminAccessRequests collection
      const { db } = await import('@/lib/firebase')
      const { doc, deleteDoc } = await import('firebase/firestore')
      
      await deleteDoc(doc(db, 'adminAccessRequests', requestId))
      
      setSuccess(`Admin access request rejected for ${email}`)
      // Remove from list
      setRequests(requests.filter(r => r.requestId !== requestId))
    } catch (error: any) {
      console.error('Error rejecting request:', error)
      setError('An error occurred while rejecting the request: ' + (error.message || 'Unknown error'))
    } finally {
      setProcessing(null)
    }
  }

  // Don't render during build time
  if (typeof window === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (loadingRequests) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading access requests...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  const zoneNames = {
    'ALL': 'All Zones (Multi-Zone Access)',
    'NZ+CZ': 'North & Central Zone (Nov 22)',
    'LZ+SZ': 'London & South Zone (Nov 23)',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-lg"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center px-4 py-6 border-b">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">NHSF (UK) Admin</span>
            </div>
          </div>

          {/* Zone Selection */}
          <div className="px-4 py-4 border-b">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Select Zone</h3>
            <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
              All Zones (Super Admin)
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <button 
              onClick={() => {
                router.push('/admin')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
            >
              <Shield className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            {/* Access Requests - Current Page */}
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left bg-orange-50 text-orange-700"
            >
              <UserCog className="h-5 w-5" />
              <span>Access Requests</span>
              <Badge variant="outline" className="ml-auto text-xs">
                Super Admin
              </Badge>
            </button>

            <button 
              onClick={() => {
                router.push('/admin')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
            >
              <Shield className="h-5 w-5" />
              <span>Universities</span>
            </button>

            <button 
              onClick={() => {
                router.push('/admin')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
            >
              <Shield className="h-5 w-5" />
              <span>Sports</span>
            </button>

            <button 
              onClick={() => {
                router.push('/admin')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
            >
              <Shield className="h-5 w-5" />
              <span>Live Matches</span>
            </button>

            <button 
              onClick={() => {
                router.push('/admin')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
            >
              <Shield className="h-5 w-5" />
              <span>Matches</span>
            </button>

            <button 
              onClick={() => {
                router.push('/admin')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
            >
              <Shield className="h-5 w-5" />
              <span>Live Results</span>
            </button>

            {/* Users Section - Only for Super Admins */}
            <button 
              onClick={() => {
                router.push('/admin')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
            >
              <UserCog className="h-5 w-5" />
              <span>Users</span>
              <Badge variant="outline" className="ml-auto text-xs">
                Super Admin
              </Badge>
            </button>

            <button 
              onClick={() => {
                router.push('/admin')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
            >
              <Shield className="h-5 w-5" />
              <span>Analytics</span>
            </button>

            <button 
              onClick={() => {
                router.push('/admin')
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-gray-700 hover:bg-gray-100"
            >
              <Shield className="h-5 w-5" />
              <span>Tournament Automation</span>
            </button>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-2">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={currentUser?.photoURL} />
                    <AvatarFallback>
                      {currentUser?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{currentUser?.displayName}</p>
                    <p className="text-xs text-gray-500">Super Admin</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push('/admin')}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="h-8 w-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Access Requests</h1>
            </div>
            <p className="text-gray-600">Review and manage pending admin access requests</p>
          </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Super Admin</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{currentUser?.displayName}</div>
              <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Role</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Super Administrator</div>
              <p className="text-xs text-muted-foreground">Full access</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Requests</h3>
              <p className="text-gray-500">
                All admin access requests have been reviewed. New requests will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <Card key={request.requestId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center space-x-2">
                        <span>{request.displayName}</span>
                        <Badge variant="outline" className="ml-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Requested {new Date(request.requestedAt).toLocaleDateString()} at{' '}
                        {new Date(request.requestedAt).toLocaleTimeString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* User Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="text-sm font-medium">{request.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Requested Zone</p>
                          <p className="text-sm font-medium">{zoneNames[request.zone]}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4 border-t">
                      <Button
                        onClick={() => handleApprove(request.requestId, request.email, request.zone)}
                        disabled={processing === request.requestId}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {processing === request.requestId ? 'Approving...' : 'Approve & Grant Admin Access'}
                      </Button>
                      
                      <Button
                        onClick={() => handleReject(request.requestId, request.email)}
                        disabled={processing === request.requestId}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {processing === request.requestId ? 'Rejecting...' : 'Reject Request'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

