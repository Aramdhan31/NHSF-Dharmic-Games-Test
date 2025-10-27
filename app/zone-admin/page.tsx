"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ZoneSpecificDashboard } from "@/components/zone-specific-dashboard"
import { useFirebase } from "@/lib/firebase-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, AlertCircle } from "lucide-react"

type Zone = 'LZ' | 'SZ' | 'CZ' | 'NZ'

export default function ZoneAdminPage() {
  const { user: currentUser, loading } = useFirebase()
  const router = useRouter()
  const [userZone, setUserZone] = useState<Zone | undefined>(undefined)

  // Get user's zone from Firebase user data
  useEffect(() => {
    if (currentUser?.zone && currentUser.zone !== 'ALL') {
      setUserZone(currentUser.zone as Zone)
    }
  }, [currentUser])

  // Check if user is zone admin
  const isZoneAdmin = currentUser?.role === 'zone_admin' || currentUser?.role === 'super_admin'

  // Handle redirect for non-zone admins
  useEffect(() => {
    if (!loading && (!currentUser || !isZoneAdmin)) {
      router.push('/login')
    }
  }, [currentUser, loading, isZoneAdmin, router])

  // Show loading while user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isZoneAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (!userZone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-yellow-600">Zone Not Assigned</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Your zone assignment is not configured. Please contact the super admin.
            </p>
            <Button asChild>
              <a href="/admin">Go to Admin Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ZoneSpecificDashboard 
      currentZone={userZone}
      currentUser={currentUser}
    />
  )
}
