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
import { Mail, Lock, ArrowLeft, AlertCircle } from "lucide-react"
import { useFirebaseAuth } from "@/hooks/use-firebase-auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user, loading, error, signIn, clearError } = useFirebaseAuth()

  // Function to get redirect path based on user role
  const getRedirectPath = (user: any) => {
    if (!user) return '/'
    
    // All admins (including super admins) go to the main admin dashboard
    // The dashboard will show different tabs based on their role
    if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'zone_admin') {
      return '/admin/dashboard'
    }
    
    // Players and viewers go to home page
    if (user.role === 'player' || user.role === 'viewer') {
      return '/'
    }
    
    // Default fallback
    return '/'
  }

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      const redirectPath = getRedirectPath(user)
      router.push(redirectPath)
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center text-orange-600 hover:text-orange-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Sign in to your NHSF (UK) Dharmic Games account
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
                      <Link href="/admin/signup" className="text-orange-600 hover:text-orange-700 font-medium underline">
                        Click here to request access
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Admin Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-xs sm:text-sm text-green-800">
                <strong>NHSF (UK) Natcom:</strong> Use either your @nhsf.org.uk email or your .nhsf@gmail.com email to
                get admin access
              </p>
              <p className="text-xs text-green-700 mt-1">
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
                    placeholder="your.email@example.com"
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

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
