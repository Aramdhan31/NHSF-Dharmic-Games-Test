"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, ArrowLeft, AlertCircle, Shield } from "lucide-react"
import { useFirebaseAuth } from "@/hooks/use-firebase-auth"
import { checkAdminStatus } from "@/lib/admin-auth"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user, loading, error, signIn, clearError } = useFirebaseAuth()

  // Function to check admin status by also querying admins collection
  const checkAdminStatusWithApi = async (user: any) => {
    if (!user || !user.email) return { isAdmin: false }
    
    // First check with current user data
    let adminCheck = checkAdminStatus(user)
    
    // If already determined as admin, return early
    if (adminCheck.isAdmin) {
      return adminCheck
    }
    
    // Also check admins collection via API for most up-to-date role
    try {
      const roleRes = await fetch(`/api/get-admin-role?email=${encodeURIComponent(user.email)}`)
      if (roleRes.ok) {
        const roleData = await roleRes.json()
        if (roleData.success && roleData.role) {
          // Override role from admins collection if it exists
          const userWithRole = {
            ...user,
            role: roleData.role
          }
          adminCheck = checkAdminStatus(userWithRole)
        }
      }
    } catch (e) {
      console.log('⚠️ Could not check admins collection in login:', e)
    }
    
    return adminCheck
  }

  // Function to get redirect path based on user admin status
  const getRedirectPath = async (user: any) => {
    if (!user) return '/admin'
    
    // Check admin status (including API check for admins collection)
    const adminCheck = await checkAdminStatusWithApi(user)
    
    // If user is any type of admin, go to dashboard
    if (adminCheck.isAdmin) {
      return '/admin/dashboard'
    }
    
    // Non-admin users get redirected back to admin info page
    return '/admin'
  }

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      getRedirectPath(user).then((redirectPath) => {
        router.push(redirectPath)
      })
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    clearError()
    
    const result = await signIn(email, password)
    
    if (result.success) {
      // The useEffect will handle the redirect when user data is loaded
      // No need to manually redirect here
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/admin" className="flex items-center text-orange-600 hover:text-orange-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Info
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center p-6">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-orange-600 mr-2" />
              <CardTitle className="text-xl sm:text-2xl font-bold">Admin Login</CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base">
              Sign in to access the NHSF (UK) Dharmic Games admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  {error.includes('Please register first') && (
                    <div className="mt-2">
                      <Link href="/admin-request" className="text-blue-600 hover:text-blue-700 font-medium underline">
                        Click here to request admin access
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Admin Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p className="text-xs sm:text-sm text-orange-800">
                <strong>NHSF (UK) Natcom:</strong> Use either your @nhsf.org.uk email or your .nhsf@gmail.com email to
                get admin access
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Example: arjun.ramdhan@nhsf.org.uk or arjun.ramdhan.nhsf@gmail.com
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@nhsf.org.uk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-sm sm:text-base"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 text-sm sm:text-base"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <Link href="/forget-password" className="text-orange-600 hover:text-orange-700 underline">
                Forgot your password?
              </Link>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have admin access?{" "}
                <Link href="/admin-request" className="text-orange-600 hover:text-orange-700 underline">
                  Request access here
                </Link>
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}