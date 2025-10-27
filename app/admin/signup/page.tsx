"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, User, ArrowLeft, MapPin, AlertCircle, CheckCircle, Shield } from "lucide-react"
import { useFirebaseAuth } from "@/hooks/use-firebase-auth"

const zones = [
  { value: "ALL", label: "All Zones (Multi-Zone Access)" },
  { value: "NZ+CZ", label: "North & Central Zone (Nov 22)" },
  { value: "LZ+SZ", label: "London & South Zone (Nov 23)" },
]

export default function AdminSignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    zone: "",
    agreeToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { user, loading, error, signUp, clearError } = useFirebaseAuth()

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      const userIsAdmin = user.role === 'super_admin' || user.permissions?.canManageAllZones
      if (userIsAdmin) {
        router.push('/admin')
      } else {
        router.push('/')
      }
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setSuccess(null)
    
    // Email format validation - NHSF (UK) emails only (TEMPORARILY DISABLED FOR TESTING)
    const normalizedEmail = formData.email.toLowerCase().trim()
    // const nhsfEmailRegex = /^[a-z]+\.[a-z]+@nhsf\.org\.uk$|^[a-z]+\.[a-z]+\.nhsf@gmail\.com$/
    
    // if (!nhsfEmailRegex.test(normalizedEmail)) {
    //   alert('Invalid email format. Please use:\n• firstname.surname@nhsf.org.uk\n• firstname.surname.nhsf@gmail.com')
    //   return
    // }
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    if (!formData.agreeToTerms) {
      alert('Please agree to the terms and conditions')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Submit request via API route (NO account creation yet)
      const response = await fetch('/api/submit-admin-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: formData.password, // Store temporarily for account creation on approval
          displayName: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          zone: formData.zone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request')
      }
      
      // Send email notification to super admin
      try {
        await fetch('/api/send-admin-request-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: normalizedEmail,
            displayName: `${formData.firstName} ${formData.lastName}`,
            firstName: formData.firstName,
            lastName: formData.lastName,
            zone: formData.zone,
          })
        })
        console.log('Email notification sent to super admin')
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError)
        // Don't fail the request if email fails
      }
      
      setSuccess('✅ Request submitted successfully! Your admin access request has been sent to the super admins for review. NO ACCOUNT has been created yet. You will only be able to log in AFTER a super admin approves your request. Please check back later.')
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        zone: "",
        agreeToTerms: false,
      })

      // Redirect after 5 seconds
      setTimeout(() => {
        router.push('/admin/login')
      }, 5000)
      
    } catch (error: any) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request: ' + (error.message || 'Unknown error'))
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Link href="/admin/login" className="flex items-center text-orange-600 hover:text-orange-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-orange-500">
                <Shield className="h-7 w-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">Admin Access Request Form</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Submit a request to become an NHSF (UK) admin - No account created until approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Important Notice */}
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-900 mb-1">
                        THIS IS A REQUEST FORM - NOT A SIGNUP
                      </p>
                      <p className="text-xs text-red-800">
                        • No account will be created when you submit this form<br />
                        • A super admin must review and approve your request first<br />
                        • You can only log in AFTER approval
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Format Notice */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-xs sm:text-sm text-orange-900 font-semibold mb-2">
                    ✉️ NHSF (UK) Email Required
                  </p>
                  <p className="text-xs text-orange-800">
                    You must use one of these formats:<br />
                    • <strong>firstname.surname@nhsf.org.uk</strong><br />
                    • <strong>firstname.surname.nhsf@gmail.com</strong>
                  </p>
                  <p className="text-xs text-orange-700 mt-2">
                    Example: arjun.ramdhan@nhsf.org.uk
                  </p>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm sm:text-base">
                      First Name <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="pl-10 h-12 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm sm:text-base">
                      Last Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="h-12 text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">
                    NHSF (UK) Email <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="firstname.surname@nhsf.org.uk"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 h-12 text-sm sm:text-base"
                      autoComplete="username"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be firstname.surname@nhsf.org.uk or firstname.surname.nhsf@gmail.com
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone" className="text-sm sm:text-base">
                    Requesting Access for Zone <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                    <Select value={formData.zone} onValueChange={(value) => setFormData({ ...formData, zone: value })}>
                      <SelectTrigger className="pl-10 h-12">
                        <SelectValue placeholder="Choose zone to manage" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.value} value={zone.value}>
                            {zone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm sm:text-base">
                    Password <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter desired password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 h-12 text-sm sm:text-base"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    This password will be set when your request is approved
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm sm:text-base">
                    Confirm Password <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 h-12 text-sm sm:text-base"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                  />
                  <Label htmlFor="terms" className="text-xs sm:text-sm leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-orange-600 hover:text-orange-700">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-orange-600 hover:text-orange-700">
                      Privacy Policy
                    </Link>
                    , and understand that my admin access request will be reviewed by a super administrator.
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-sm sm:text-base"
                  disabled={isLoading || !formData.agreeToTerms}
                >
                  {isLoading ? "Submitting Request..." : "Submit Request (No Account Created Yet)"}
                </Button>
              </form>
            )}

            <div className="text-center text-xs sm:text-sm text-gray-600">
              Already approved and have admin access?{" "}
              <Link href="/admin/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

