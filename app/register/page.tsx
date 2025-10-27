"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertCircle, CheckCircle, GraduationCap, User, Lock } from 'lucide-react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { ref, set, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import { auth, realtimeDb } from '@/lib/firebase'

// Import the same universities list from teams page
import { universities } from '@/app/teams/page'

const CONTACT_ROLES = [
  'President',
  'Vice President', 
  'Head of Sports',
  'Sports Secretary',
  'Treasurer',
  'General Secretary',
  'Other'
]

export default function UniversityRegistration() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [availableUniversities, setAvailableUniversities] = useState<any[]>([])
  const [loadingUniversities, setLoadingUniversities] = useState(true)
  const [formData, setFormData] = useState({
    universityName: '',
    contactPerson: '',
    contactRole: '',
    contactEmail: '',
    password: '',
    confirmPassword: ''
  })

  // Load available universities (not yet registered)
  useEffect(() => {
    let mounted = true
    
    const loadAvailableUniversities = async () => {
      try {
        if (!mounted) return
        setLoadingUniversities(true)
        
        // Get all registered universities from Realtime Database
        const universitiesRef = ref(realtimeDb, 'universities')
        const snapshot = await get(universitiesRef)
        
        if (!mounted) return
        
        let registeredUniversities: string[] = []
        if (snapshot.exists()) {
          const data = snapshot.val()
          registeredUniversities = Object.values(data)
            .map((uni: any) => uni?.name)
            .filter(name => name && typeof name === 'string') // Filter out invalid names
        }
        
        console.log('📋 Registered universities:', registeredUniversities)
        
        // Filter out already registered universities and sort alphabetically
        const available = universities
          .filter(uni => !registeredUniversities.includes(uni.name))
          .sort((a, b) => a.name.localeCompare(b.name))
        
        console.log('✅ Available universities:', available.length)
        if (mounted) {
          setAvailableUniversities(available)
        }
        
      } catch (error) {
        console.error('❌ Error loading universities:', error)
        // Fallback to all universities if Firebase fails, sorted alphabetically
        if (mounted) {
          setAvailableUniversities(universities.sort((a, b) => a.name.localeCompare(b.name)))
        }
      } finally {
        if (mounted) {
          setLoadingUniversities(false)
        }
      }
    }

    loadAvailableUniversities()
    
    return () => {
      mounted = false
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match. Please try again.')
        return
      }

      // Validate password strength
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.')
        return
      }

      // Validate required fields
      if (!formData.universityName || !formData.contactPerson || !formData.contactEmail) {
        setError('Please fill in all required fields.')
        return
      }

      console.log('🚀 Submitting university registration with Firebase')
      
      const email = formData.contactEmail
      const password = formData.password
      const name = formData.universityName
      const region = availableUniversities.find(uni => uni.name === formData.universityName)?.zone || 'NZ+CZ'

      // 1. Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCred.user.uid
      console.log("✅ Created Firebase Auth user:", uid)

      // 2. Save university data in Realtime Database
      console.log("📝 Attempting to save university data to Realtime Database...")
      console.log("📝 Database URL:", realtimeDb.app.options.databaseURL)
      console.log("📝 Realtime DB instance:", realtimeDb)
      console.log("📝 University data:", {
        name,
        region,
        email,
        createdBy: uid,
        status: "competing",
        contactPerson: formData.contactPerson,
        contactRole: formData.contactRole
      })
      
      
      await set(ref(realtimeDb, "universities/" + uid), {
        id: uid,
        name,
        region,
        zone: region, // Add zone field for login page compatibility
        email,
        createdBy: uid,
        status: "competing",
        contactPerson: formData.contactPerson,
        contactRole: formData.contactRole,
        createdAt: Date.now()
      })
      
      console.log("✅ Successfully saved university data to Realtime Database!")
      console.log('✅ University registered successfully in Firebase!')
      
      // Automatically log in the university
      localStorage.setItem('universityId', uid)
      localStorage.setItem('universityName', name)
      localStorage.setItem('universityEmail', email)
      localStorage.setItem('universityZone', region)
      
      setSuccess(true)
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/university/dashboard')
      }, 3000)

    } catch (error: any) {
      console.error('❌ Error registering university:', error)
      
      // 🎯 Friendly Firebase error handling
      if (error.code === "auth/email-already-in-use") {
        setError('⚠️ This university email has already been registered. Please log in instead.')
      } else if (error.code === "auth/invalid-email") {
        setError('❌ Please enter a valid email address.')
      } else if (error.code === "auth/weak-password") {
        setError('🔒 Your password is too weak. Please use at least 6 characters.')
      } else if (error.code === "auth/network-request-failed") {
        setError('🌐 Network error. Please check your internet connection and try again.')
      } else {
        setError('❌ Something went wrong during registration. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        <main className="py-8 sm:py-12 px-4">
          <div className="container mx-auto max-w-2xl">
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
                <p className="text-gray-600 mb-6">
                  Your university account has been created successfully. You can now log in to manage your teams and players.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm">
                    <strong>Next Steps:</strong><br />
                    1. You are now logged in automatically<br />
                    2. Select the sports your university will compete in<br />
                    3. Register your players for each sport<br />
                    4. Provide player details for on-day registration
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/university/dashboard')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <main className="py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              University Registration
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Register your university to participate in the NHSF (UK) Dharmic Games. 
              Only universities from the official list can register.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="h-6 w-6 mr-2 text-orange-600" />
                University Registration
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

                {loadingUniversities ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading available universities...</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="universityName">Select Your University *</Label>
                      <Select
                        value={formData.universityName}
                        onValueChange={(value) => handleInputChange('universityName', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your university from the list" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUniversities.map(uni => (
                            <SelectItem key={uni.id} value={uni.name}>
                              {uni.name} ({uni.zone || 'Unknown'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        {availableUniversities.length} universities available for registration
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="contactPerson">Your Name *</Label>
                        <Input
                          id="contactPerson"
                          value={formData.contactPerson}
                          onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                          placeholder="e.g., John Smith"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contactRole">Your Role *</Label>
                        <Select
                          value={formData.contactRole}
                          onValueChange={(value) => handleInputChange('contactRole', value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTACT_ROLES.map(role => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="contactEmail">Your Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        placeholder="e.g., john.smith@university.ac.uk"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Choose a secure password"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Confirm your password"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-800 mb-2">What happens next?</h3>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Your university account will be created immediately</li>
                        <li>• You can log in and select which sports to compete in</li>
                        <li>• Register your players for each sport</li>
                        <li>• Provide player details for on-day registration</li>
                        <li>• Your university will be removed from the available list</li>
                      </ul>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={isLoading || availableUniversities.length === 0}
                    >
                      {isLoading ? 'Creating Account...' : 'Create University Account'}
                    </Button>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}