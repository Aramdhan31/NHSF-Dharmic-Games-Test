"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  AlertCircle, 
  CheckCircle, 
  Gamepad2, 
  Eye, 
  Users2, 
  GraduationCap,
  ArrowLeft,
  Shield
} from 'lucide-react'

const ticketTypes = [
  { 
    value: 'spectator', 
    label: 'Spectator Ticket', 
    icon: Eye, 
    description: 'For those watching the games',
    requiresUniversity: false,
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  { 
    value: 'referee_volunteer_external', 
    label: 'Referee/Volunteer/External Ticket', 
    icon: Users2, 
    description: 'For referees, volunteers, and external participants',
    requiresUniversity: false,
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  }
]

const availableSports = [
  'Football', 'Basketball', 'Volleyball', 'Cricket', 'Badminton', 'Table Tennis',
  'Tennis', 'Swimming', 'Athletics', 'Chess', 'Kabaddi', 'Kho-Kho'
]

export default function RegisterMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    ticketType: '',
    zone: '',
    hasAllergies: false,
    allergies: '',
    hasMedicalConditions: false,
    medicalConditions: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    disclaimerAccepted: false
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validation
      if (!formData.fullName.trim()) {
        throw new Error('Full name is required')
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required')
      }
      if (!formData.ticketType) {
        throw new Error('Please select a ticket type')
      }
      if (!formData.zone) {
        throw new Error('Please select which zonal event you will attend')
      }
      if (formData.hasAllergies && !formData.allergies.trim()) {
        throw new Error('Please specify your allergies')
      }
      // Medical conditions are optional - no validation needed
      
      if (!formData.emergencyContactName.trim()) {
        throw new Error('Emergency contact name is required')
      }
      if (!formData.emergencyContactNumber.trim()) {
        throw new Error('Emergency contact number is required')
      }
      if (!formData.disclaimerAccepted) {
        throw new Error('You must agree to the disclaimer policy')
      }

      // Create member object
      const memberData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        ticketType: formData.ticketType,
        zone: formData.zone,
        hasAllergies: formData.hasAllergies,
        allergies: formData.hasAllergies ? formData.allergies.trim() : null,
        hasMedicalConditions: formData.hasMedicalConditions,
        medicalConditions: formData.hasMedicalConditions ? formData.medicalConditions.trim() : null,
        university: null,
        sport: null,
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactNumber: formData.emergencyContactNumber.trim(),
        disclaimerAccepted: true,
        registrationDate: new Date().toISOString(),
        universityId: null, // No university association for external registrations
        status: 'registered'
      }

      // Save to Firebase via API
      const response = await fetch('/api/member-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register')
      }

      setSuccess('Registration successful! You will receive a confirmation email shortly.')

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        ticketType: '',
        zone: '',
        hasAllergies: false,
        allergies: '',
        hasMedicalConditions: false,
        medicalConditions: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        disclaimerAccepted: false
      })

    } catch (err: any) {
      setError(err.message || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  const selectedTicketInfo = ticketTypes.find(t => t.value === formData.ticketType)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/25">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Member Registration
          </h1>
          <p className="text-gray-600 text-lg">
            Register for the NHSF (UK) (UK) Dharmic Games
          </p>
        </div>

        {/* Back to Home */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Registration Form */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl font-semibold text-gray-900 text-center">Join the Games</CardTitle>
            <CardDescription className="text-gray-600 text-center">
              Register as a participant, spectator, or volunteer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-orange-600" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="John Smith"
                      required
                      className="h-12 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john.smith@example.com"
                      required
                      className="h-12 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+44 20 1234 5678"
                    className="h-12 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              {/* Ticket Type Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Ticket Type *</h3>
                <div className="grid gap-3">
                  {ticketTypes.map((type) => {
                    const Icon = type.icon
                    const isSelected = formData.ticketType === type.value
                    
                    return (
                      <div
                        key={type.value}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected 
                            ? `${type.color} border-current` 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleInputChange('ticketType', type.value)}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-6 w-6 ${isSelected ? 'text-current' : 'text-gray-600'}`} />
                          <div className="flex-1">
                            <div className={`font-medium ${isSelected ? 'text-current' : 'text-gray-900'}`}>
                              {type.label}
                            </div>
                            <div className={`text-sm ${isSelected ? 'text-current/80' : 'text-gray-600'}`}>
                              {type.description}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-current" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Zone Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Zonal Event *</h3>
                <div className="space-y-2">
                  <Label htmlFor="zone">Which zonal event will you attend?</Label>
                  <Select value={formData.zone} onValueChange={(value) => handleInputChange('zone', value)}>
                    <SelectTrigger className="h-12 focus:border-orange-500 focus:ring-orange-500/20">
                      <SelectValue placeholder="Select zonal event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NZ+CZ">
                        <div>
                          <div className="font-medium">North & Central Zone</div>
                          <div className="text-sm text-gray-500">November 22, 2025</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="LZ+SZ">
                        <div>
                          <div className="font-medium">London & South Zone</div>
                          <div className="text-sm text-gray-500">November 23, 2025</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Please select the zonal event you plan to attend
                  </p>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="hasAllergies"
                      checked={formData.hasAllergies}
                      onCheckedChange={(checked) => handleInputChange('hasAllergies', checked as boolean)}
                      className="mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <Label htmlFor="hasAllergies" className="text-sm font-normal leading-relaxed">
                      I have allergies or dietary restrictions
                    </Label>
                  </div>

                  {formData.hasAllergies && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="allergies">Please specify your allergies or dietary restrictions *</Label>
                      <Input
                        id="allergies"
                        value={formData.allergies}
                        onChange={(e) => handleInputChange('allergies', e.target.value)}
                        placeholder="e.g., Peanut allergy, Vegetarian, Gluten-free, etc."
                        required={formData.hasAllergies}
                        className="h-12 focus:border-orange-500 focus:ring-orange-500/20"
                      />
                      <p className="text-sm text-gray-500">
                        This information helps us ensure your safety and accommodate your needs at the event.
                      </p>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="hasMedicalConditions"
                      checked={formData.hasMedicalConditions}
                      onCheckedChange={(checked) => handleInputChange('hasMedicalConditions', checked as boolean)}
                      className="mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <Label htmlFor="hasMedicalConditions" className="text-sm font-normal leading-relaxed">
                      I have medical conditions or health concerns I'd like to share (optional)
                    </Label>
                  </div>

                  {formData.hasMedicalConditions && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="medicalConditions">Please share any medical conditions or health concerns (optional)</Label>
                      <Input
                        id="medicalConditions"
                        value={formData.medicalConditions}
                        onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                        placeholder="e.g., Diabetes, Asthma, Heart condition, etc. (optional)"
                        className="h-12 focus:border-orange-500 focus:ring-orange-500/20"
                      />
                      <p className="text-sm text-gray-500">
                        This information is optional but helps us provide better support if needed during the event.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Emergency Contact *</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      placeholder="Parent/Guardian Name"
                      required
                      className="h-12 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactNumber">Emergency Contact Number *</Label>
                    <Input
                      id="emergencyContactNumber"
                      value={formData.emergencyContactNumber}
                      onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
                      placeholder="+44 20 1234 5678"
                      required
                      className="h-12 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="disclaimer"
                  checked={formData.disclaimerAccepted}
                  onCheckedChange={(checked) => handleInputChange('disclaimerAccepted', checked as boolean)}
                  required
                  className="mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label htmlFor="disclaimer" className="text-sm font-normal leading-relaxed">
                  I agree to the disclaimer policy and understand the terms and conditions for participation in the NHSF (UK) (UK) Dharmic Games. I confirm that all information provided is accurate. *
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-200" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Registering...</span>
                  </div>
                ) : (
                  'Register Now'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact{' '}
            <a href="mailto:arjun.ramdhan@nhsf.org.uk" className="text-orange-600 hover:text-orange-700 font-medium">
              arjun.ramdhan@nhsf.org.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
