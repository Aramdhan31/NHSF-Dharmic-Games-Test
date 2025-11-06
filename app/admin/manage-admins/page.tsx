"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/lib/firebase-context"
import { checkAdminStatus } from "@/lib/admin-auth"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/ui/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Shield,
  Users,
  UserPlus,
  Edit,
  Trash2,
  Crown,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Ban,
  UserCheck
} from "lucide-react"

interface Admin {
  id: string
  email: string
  name?: string
  displayName?: string
  role?: string
  zone?: string
  zones?: string[]
  isActive?: boolean
  createdAt?: number
  approvedAt?: number
  lastLoginAt?: number | any
  permissions?: {
    canManageAllZones?: boolean
    canManageOwnZone?: boolean
    canManageUsers?: boolean
    canViewAnalytics?: boolean
    canUpdateResults?: boolean
    canCreateMatches?: boolean
  }
}

type CombinedZone = 'NZ+CZ' | 'LZ+SZ' | 'ALL'

interface AdminRequest {
  requestId: string
  email: string
  displayName: string
  firstName?: string
  lastName?: string
  zone: CombinedZone
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function ManageAdminsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useFirebase()
  const [mounted, setMounted] = useState(false)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "admin",
    zones: [] as string[]
  })
  const [tempPassword, setTempPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if user is superadmin
  useEffect(() => {
    if (!authLoading && mounted && user) {
      const adminCheck = checkAdminStatus(user as any)
      if (!adminCheck.isSuperAdmin) {
        router.push("/admin")
      }
    } else if (!authLoading && !user) {
      router.push("/admin/login")
    }
  }, [user, authLoading, mounted, router])

  // Load admins and requests
  useEffect(() => {
    if (mounted && user) {
      loadAdmins()
      loadAdminRequests()
    }
  }, [mounted, user])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin-management")
      const data = await response.json()

      if (data.success) {
        // Also load from users collection to get complete data
        const { db } = await import("@/lib/firebase")
        const { collection, getDocs, query, where } = await import("firebase/firestore")

        const usersRef = collection(db, "users")
        const usersSnapshot = await getDocs(usersRef)
        const usersMap = new Map()

        usersSnapshot.forEach((doc) => {
          const userData = doc.data()
          if (userData.role === "admin" || userData.role === "zone_admin" || userData.role === "super_admin") {
            usersMap.set(userData.email?.toLowerCase(), {
              ...userData,
              id: doc.id
            })
          }
        })

        // Merge admins and users data
        const mergedAdmins = data.admins.map((admin: Admin) => {
          const userData = usersMap.get(admin.email?.toLowerCase())
          return {
            ...admin,
            ...userData,
            id: admin.id || userData?.id || admin.email
          }
        })

        // Add users that aren't in admins collection
        usersMap.forEach((userData, email) => {
          if (!data.admins.find((a: Admin) => a.email?.toLowerCase() === email)) {
            mergedAdmins.push({
              ...userData,
              id: userData.id || email
            })
          }
        })

        setAdmins(mergedAdmins)
      } else {
        setError("Failed to load admins")
      }
    } catch (error: any) {
      console.error("Error loading admins:", error)
      setError("Failed to load admins: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAdminRequests = async () => {
    try {
      setLoadingRequests(true)
      const { db } = await import("@/lib/firebase")
      const { collection, query, where, getDocs } = await import("firebase/firestore")

      const requestsRef = collection(db, "adminAccessRequests")
      const q = query(requestsRef, where("status", "==", "pending"))
      const querySnapshot = await getDocs(q)

      const pendingRequests: AdminRequest[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        pendingRequests.push({
          requestId: doc.id,
          email: data.email,
          displayName: data.displayName || data.name || data.email,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          zone: data.zone || "ALL",
          requestedAt: data.requestedAt || data.createdAt || "",
          status: data.status || "pending"
        })
      })

      setAdminRequests(pendingRequests)
    } catch (error: any) {
      console.error("Error loading admin requests:", error)
      setError("Failed to load admin requests: " + error.message)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin)
    setFormData({
      email: admin.email,
      name: admin.name || admin.displayName || "",
      role: admin.role || "admin",
      zones: admin.zones || (admin.zone ? [admin.zone] : [])
    })
    setIsEditDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedAdmin(null)
    setFormData({
      email: "",
      name: "",
      role: "admin",
      zones: []
    })
    setTempPassword("")
    setIsCreateDialogOpen(true)
  }

  const handleDelete = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsDeleteDialogOpen(true)
  }

  const handleChangePassword = (admin: Admin) => {
    setSelectedAdmin(admin)
    setNewPassword("")
    setIsPasswordDialogOpen(true)
  }

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return

    setProcessing("update")
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/admin-management", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role,
          name: formData.name,
          zones: formData.zones
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Admin updated successfully")
        setIsEditDialogOpen(false)
        loadAdmins()
      } else {
        setError(data.error || "Failed to update admin")
      }
    } catch (error: any) {
      console.error("Error updating admin:", error)
      setError("Failed to update admin: " + error.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleCreateAdmin = async () => {
    if (!formData.email || !formData.name || !tempPassword) {
      setError("Please fill in all required fields")
      return
    }

    setProcessing("create")
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/admin-management", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: tempPassword,
          role: formData.role,
          name: formData.name,
          zones: formData.zones
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Admin created successfully")
        setIsCreateDialogOpen(false)
        setFormData({ email: "", name: "", role: "admin", zones: [] })
        setTempPassword("")
        loadAdmins()
      } else {
        setError(data.error || "Failed to create admin")
      }
    } catch (error: any) {
      console.error("Error creating admin:", error)
      setError("Failed to create admin: " + error.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return

    setProcessing("delete")
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin-management?email=${encodeURIComponent(selectedAdmin.email)}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Admin deleted successfully")
        setIsDeleteDialogOpen(false)
        setSelectedAdmin(null)
        loadAdmins()
      } else {
        setError(data.error || "Failed to delete admin")
      }
    } catch (error: any) {
      console.error("Error deleting admin:", error)
      setError("Failed to delete admin: " + error.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleChangePasswordSubmit = async () => {
    if (!selectedAdmin || !newPassword) {
      setError("Please enter a new password")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setProcessing("password")
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/admin-management", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: selectedAdmin.email,
          newPassword: newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Password changed successfully")
        setIsPasswordDialogOpen(false)
        setSelectedAdmin(null)
        setNewPassword("")
      } else {
        setError(data.error || "Failed to change password")
      }
    } catch (error: any) {
      console.error("Error changing password:", error)
      setError("Failed to change password: " + error.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleApproveRequest = async (request: AdminRequest) => {
    setProcessing(request.requestId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/approve-admin-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requestId: request.requestId,
          email: request.email,
          zone: request.zone
        })
      })

      const data = await response.json()

      if (data.success || response.ok) {
        setSuccess(`Admin access approved for ${request.email}. Account created successfully!`)
        setAdminRequests(adminRequests.filter((r) => r.requestId !== request.requestId))
        loadAdmins() // Reload admins to show the new one
      } else {
        setError(data.error || "Failed to approve admin request")
      }
    } catch (error: any) {
      console.error("Error approving request:", error)
      setError("Failed to approve admin request: " + error.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectRequest = async () => {
    if (!selectedRequest) return

    setProcessing(selectedRequest.requestId)
    setError(null)
    setSuccess(null)

    try {
      const { db } = await import("@/lib/firebase")
      const { doc, deleteDoc } = await import("firebase/firestore")

      await deleteDoc(doc(db, "adminAccessRequests", selectedRequest.requestId))

      setSuccess(`Admin access request rejected for ${selectedRequest.email}`)
      setAdminRequests(adminRequests.filter((r) => r.requestId !== selectedRequest.requestId))
      setIsRejectDialogOpen(false)
      setSelectedRequest(null)
    } catch (error: any) {
      console.error("Error rejecting request:", error)
      setError("Failed to reject admin request: " + error.message)
    } finally {
      setProcessing(null)
    }
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-300">Super Admin</Badge>
      case "zone_admin":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Zone Admin</Badge>
      case "admin":
        return <Badge className="bg-green-100 text-green-700 border-green-300">Admin</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredAdmins = admins.filter((admin) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      admin.email?.toLowerCase().includes(searchLower) ||
      admin.name?.toLowerCase().includes(searchLower) ||
      admin.displayName?.toLowerCase().includes(searchLower) ||
      admin.role?.toLowerCase().includes(searchLower)
    )
  })

  if (authLoading || loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const adminCheck = user ? checkAdminStatus(user as any) : null
  if (!adminCheck?.isSuperAdmin) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 p-6 ml-64 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <Crown className="h-8 w-8 text-orange-600" />
                    Admin Management
                  </h1>
                  <p className="text-gray-600">Manage regular admins and their permissions</p>
                </div>
                <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Admin
                </Button>
              </div>
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{admins.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {admins.filter((a) => a.role === "super_admin").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Zone Admins</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {admins.filter((a) => a.role === "zone_admin").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Regular Admins</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {admins.filter((a) => a.role === "admin").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Admin Requests */}
            {adminRequests.length > 0 && (
              <Card className="mb-6 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Pending Admin Requests ({adminRequests.length})
                  </CardTitle>
                  <CardDescription>
                    Review and approve or reject admin access requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminRequests.map((request) => {
                      const zoneNames: Record<CombinedZone, string> = {
                        'ALL': 'All Zones (Multi-Zone Access)',
                        'NZ+CZ': 'North & Central Zone (Nov 22)',
                        'LZ+SZ': 'London & South Zone (Nov 23)',
                      }
                      return (
                        <div
                          key={request.requestId}
                          className="p-4 bg-white rounded-lg border border-orange-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{request.displayName}</h4>
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  <span>{request.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{zoneNames[request.zone]}</span>
                                </div>
                                {request.requestedAt && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      Requested: {new Date(request.requestedAt).toLocaleDateString()} at{' '}
                                      {new Date(request.requestedAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveRequest(request)}
                                disabled={processing === request.requestId}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {processing === request.requestId ? 'Approving...' : 'Approve'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setIsRejectDialogOpen(true)
                                }}
                                disabled={processing === request.requestId}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search admins by email, name, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Admins List */}
            {filteredAdmins.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Admins Found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? "Try adjusting your search terms" : "Create your first admin to get started"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredAdmins.map((admin) => (
                  <Card key={admin.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {admin.name || admin.displayName || admin.email}
                            </h3>
                            {getRoleBadge(admin.role)}
                            {admin.isActive === false && (
                              <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{admin.email}</span>
                            </div>
                            {admin.zone && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>Zone: {admin.zone}</span>
                              </div>
                            )}
                            {admin.zones && admin.zones.length > 0 && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>Zones: {admin.zones.join(", ")}</span>
                              </div>
                            )}
                            {admin.createdAt && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Created: {new Date(admin.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {admin.lastLoginAt && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  Last login: {admin.lastLoginAt.toDate ? new Date(admin.lastLoginAt.toDate()).toLocaleString() : new Date(admin.lastLoginAt).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {!admin.lastLoginAt && (
                              <div className="flex items-center gap-2 text-gray-400">
                                <Clock className="h-4 w-4" />
                                <span>Last login: Never</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(admin)}
                            disabled={admin.role === "super_admin"}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangePassword(admin)}
                            className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Change Password
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(admin)}
                            disabled={admin.role === "super_admin" || admin.email === user?.email}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Admin</DialogTitle>
                  <DialogDescription>Update admin role and permissions</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={formData.email} disabled />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="zone_admin">Zone Admin</SelectItem>
                        <SelectItem value="super_admin" disabled>Super Admin (Cannot change)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Zones (comma-separated)</Label>
                    <Input
                      value={formData.zones.join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          zones: e.target.value.split(",").map((z) => z.trim()).filter(Boolean)
                        })
                      }
                      placeholder="LZ+SZ, NZ+CZ"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateAdmin} disabled={processing === "update"}>
                    {processing === "update" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Admin</DialogTitle>
                  <DialogDescription>Create a new admin account</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Admin Name"
                    />
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Temporary password"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      User will need to change this on first login
                    </p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="zone_admin">Zone Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Zones (comma-separated)</Label>
                    <Input
                      value={formData.zones.join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          zones: e.target.value.split(",").map((z) => z.trim()).filter(Boolean)
                        })
                      }
                      placeholder="LZ+SZ, NZ+CZ"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAdmin} disabled={processing === "create"}>
                    {processing === "create" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the admin account for{" "}
                    <strong>{selectedAdmin?.email}</strong>. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAdmin}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={processing === "delete"}
                  >
                    {processing === "delete" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Change the password for <strong>{selectedAdmin?.email}</strong>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>New Password *</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleChangePasswordSubmit} disabled={processing || !newPassword}>
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}

