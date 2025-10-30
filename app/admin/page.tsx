"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useFirebase } from "@/lib/firebase-context"
import { checkAdminStatus } from "@/lib/admin-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { 
  Shield, 
  Users, 
  Trophy, 
  Settings, 
  LogIn, 
  UserCheck, 
  Crown,
  CheckCircle,
  ArrowRight,
  Info,
  AlertCircle
} from "lucide-react"

export default function AdminInfoPage() {
  const router = useRouter()
  const { user, loading } = useFirebase()

  // Redirect logged-in admins to dashboard
  useEffect(() => {
    if (!loading && user) {
      const adminCheck = checkAdminStatus(user)
      if (adminCheck.isAdmin) {
        router.push('/admin/dashboard')
      }
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render info page if user is logged in (redirect will happen)
  if (user) {
    const adminCheck = checkAdminStatus(user)
    if (adminCheck.isAdmin) {
      return null // Redirect in progress
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-yellow-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">NHSF (UK) Admin Portal</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage the NHSF (UK) Dharmic Games competition, oversee universities, players, and matches
          </p>
        </div>

        {/* Who Should Be Admin */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Crown className="h-6 w-6 text-yellow-500 mr-2" />
              Who Should Be Admin?
            </CardTitle>
            <CardDescription>
              Admin access is granted to trusted NHSF (UK) team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-green-700">✅ Eligible Members</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    NHSF (UK) National Committee members
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Zone coordinators and regional leads
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Event organizers and competition managers
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Technical team members
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Trusted volunteers with specific roles
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3 text-red-700">❌ Not Eligible</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    General university students
                  </li>
                  <li className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    Non-NHSF members
                  </li>
                  <li className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    External participants
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why You Should Be Admin */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Trophy className="h-6 w-6 text-orange-500 mr-2" />
              Why You Should Be Admin
            </CardTitle>
            <CardDescription>
              Admin responsibilities and benefits for the Dharmic Games
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Manage Universities</h3>
                <p className="text-gray-600 text-sm">
                  Add, edit, and approve university registrations for the competition
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Oversee Players</h3>
                <p className="text-gray-600 text-sm">
                  Manage player registrations, medical info, and team assignments
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Control Matches</h3>
                <p className="text-gray-600 text-sm">
                  Set up matches, update scores, and manage tournament brackets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How Requests Work */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Settings className="h-6 w-6 text-purple-500 mr-2" />
              How Admin Requests Work
            </CardTitle>
            <CardDescription>
              Step-by-step process for requesting admin access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Submit Request</h3>
                  <p className="text-gray-600">
                    Fill out the admin request form with your details and reason for needing access
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Contact Arjun Ramdhan</h3>
                  <p className="text-gray-600">
                    <strong>Important:</strong> After submitting your request, please message Arjun Ramdhan to let him know you've submitted an admin request so he can review and approve it.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Approval & Access</h3>
                  <p className="text-gray-600">
                    If approved, your account will be granted admin privileges and you can log in using the credentials you created during the signup process
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Alert className="max-w-2xl mx-auto">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Already have admin access? Use the login button below. Need admin access? Submit a request first.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin/login">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
                <LogIn className="h-5 w-5 mr-2" />
                Admin Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/admin-request">
              <Button size="lg" variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                <UserCheck className="h-5 w-5 mr-2" />
                Request Admin Access
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-500">
          <p className="text-sm">
            Questions about admin access? Contact the NHSF (UK) technical team at{" "}
            <a href="mailto:info@nhsf.org.uk" className="text-orange-600 hover:underline">
              info@nhsf.org.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}