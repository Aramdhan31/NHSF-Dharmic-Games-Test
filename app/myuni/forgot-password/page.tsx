"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GraduationCap, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { useFirebaseAuth } from '@/hooks/use-firebase-auth'

export default function UniversityForgotPasswordPage() {
  const router = useRouter()
  const { resetPassword } = useFirebaseAuth()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (!email) {
        throw new Error('Please enter your university email address')
      }

      await resetPassword(email)
      setSuccess(true)
      
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Sent!</h1>
            <p className="text-gray-600">
              Check your inbox for password reset instructions
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    We've sent password reset instructions to <strong>{email}</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Please check your email and follow the instructions to reset your password.
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    If you don't see the email, check your spam folder or try again.
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <Button
                    onClick={() => router.push('/myuni/login')}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess(false)
                      setEmail('')
                    }}
                    className="w-full"
                  >
                    Try Different Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-gray-600">
            Enter your university email to reset your password
          </p>
        </div>

        {/* Reset Form */}
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              We'll send you a link to reset your university account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">University Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@university.ac.uk"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Sending Reset Email...' : 'Send Reset Email'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <div className="mt-6 space-y-4">
          {/* Back to Login */}
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push('/myuni/login')}
              className="text-sm text-gray-600 hover:text-orange-600"
            >
              ← Back to Login
            </Button>
          </div>

          {/* Register University */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Don't have a university account yet?
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/register')}
              className="w-full"
            >
              Register Your University
            </Button>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Home
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
              <p className="text-xs text-gray-600 mb-3">
                Having trouble resetting your password?
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/contact')}
                  className="w-full text-xs"
                >
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin')}
                  className="w-full text-xs"
                >
                  Admin Portal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
