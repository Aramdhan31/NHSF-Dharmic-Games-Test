"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertCircle, GraduationCap, Lock } from 'lucide-react'
import { ref, get } from 'firebase/database'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { realtimeDb, auth } from '@/lib/firebase'

export default function SimpleUniversityLogin() {
  const router = useRouter()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!usernameOrEmail || !password) {
        setError('Please enter your username/email and password.')
        return
      }

      console.log('🔐 Attempting login for:', usernameOrEmail)
      
      // Get all registered universities from Firebase
      const universitiesRef = ref(realtimeDb, 'universities')
      const snapshot = await get(universitiesRef)
      
      if (!snapshot.exists()) {
        setError('No universities found. Please register your university first.')
        return
      }

      const data = snapshot.val()
      const universities = Object.entries(data).map(([id, value]: [string, any]) => ({
        id,
        ...value,
        name: value?.name || 'Unknown University',
        zone: value?.zone || value?.region || 'Unknown',
        email: value?.email || ''
      }))

      // Find university by username (name) or email
      const university = universities.find(uni => 
        uni.name.toLowerCase() === usernameOrEmail.toLowerCase() || 
        uni.email.toLowerCase() === usernameOrEmail.toLowerCase()
      )
      
      if (!university) {
        setError('University not found. Please check your username/email or register first.')
        return
      }

      console.log('✅ Found university:', university.name)

      // Use Firebase Auth to sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, university.email, password)
      const firebaseUser = userCredential.user
      
      console.log('✅ Firebase Auth successful:', firebaseUser.uid)

      // Store university info in localStorage
      localStorage.setItem('universityId', university.id)
      localStorage.setItem('universityName', university.name)
      localStorage.setItem('universityEmail', university.email)
      localStorage.setItem('universityZone', university.zone)
      localStorage.setItem('firebaseAuthUid', firebaseUser.uid)
      
      console.log('✅ University login successful:', university.name)
      router.push('/university/dashboard')

    } catch (error: any) {
      console.error('❌ Error logging in:', error)
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        setError('University not found. Please check your username/email.')
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Login failed. Please check your credentials and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <main className="py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              University Login
            </h1>
            <p className="text-lg text-gray-600">
              Enter your username/email and password to access your university account.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="h-6 w-6 mr-2 text-orange-600" />
                University Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="usernameOrEmail">Username or Email *</Label>
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="Enter your university name or email"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You can use either your university name or the email you registered with
                  </p>
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 mb-2">Secure Login</h3>
                  <p className="text-sm text-orange-700">
                    Enter the username/email and password you used during registration
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              
              <div className="mt-6 space-y-2">
                <Button 
                  onClick={() => router.push('/register')}
                  variant="outline"
                  className="w-full"
                >
                  Register University
                </Button>
                <div className="text-center">
                  <p className="text-xs text-gray-600">
                    Need admin access?{" "}
                    <a href="/admin-request" className="text-orange-600 hover:text-orange-700 font-medium underline">
                      Request access
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}