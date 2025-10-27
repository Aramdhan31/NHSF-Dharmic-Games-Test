"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"
import { useFirebase } from "@/lib/firebase-context"
import { Header } from "@/components/header"

export default function AdminPage() {
  const { currentUser, loading, signOut } = useFirebase()
  const router = useRouter()
  
  const userIsAdmin = currentUser?.role === 'super_admin' || currentUser?.permissions?.canManageAllZones

  // Handle redirect for non-admin users
  useEffect(() => {
    if (!loading && (!currentUser || !userIsAdmin)) {
      router.push('/admin/login')
    }
  }, [currentUser, loading, userIsAdmin, router])

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

  if (!userIsAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <AdminDashboard currentUser={currentUser} />
      </div>
    </div>
  )
}
