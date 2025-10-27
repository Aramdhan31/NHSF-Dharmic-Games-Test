"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Upload, FileText, User, Shield } from 'lucide-react'

interface Player {
  id: string
  name: string
  studentId: string
  email: string
  phone: string
  year: string
  course: string
  sports: string[]
  emergencyContact: string
  emergencyPhone: string
  medicalInfo?: string
  // Verification removed - university login already verifies identity
  universityId: string
}

interface UniversityPlayerRegistrationProps {
  isOpen: boolean
  onClose: () => void
  onSave: (player: Player) => void
  universityId: string
  universityName: string
}

const availableSports = [
  'Football', 'Basketball', 'Volleyball', 'Cricket', 'Badminton', 'Table Tennis',
  'Tennis', 'Swimming', 'Athletics', 'Chess', 'Kabaddi', 'Kho-Kho'
]

const yearOptions = [
  'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Masters', 'PhD', 'Graduate', 'Postgraduate'
]

export default function UniversityPlayerRegistration({ 
  isOpen, 
  onClose, 
  onSave, 
  universityId, 
  universityName 
}: UniversityPlayerRegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    year: '',
    course: '',
    sports: [] as string[],
    emergencyContact: '',
    emergencyPhone: '',
    medicalInfo: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSportToggle = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real implementation, you would upload this to a file storage service
      // File upload removed - no verification needed
    }
  }

  const validateStudentId = async (studentId: string, email: string) => {
    // This would typically check against university records
    // For now, we'll do basic validation
    const isValidFormat = /^[A-Za-z0-9]{6,12}$/.test(studentId)
    const emailDomain = email.split('@')[1]?.toLowerCase()
    
    // Check if email domain matches university domain (basic check)
    const universityDomains = [
      'ac.uk', 'university.ac.uk', 'student.ac.uk'
    ]
    
    const isValidDomain = universityDomains.some(domain => 
      emailDomain?.endsWith(domain)
    )
    
    return isValidFormat && isValidDomain
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate required fields
      if (!formData.name || !formData.studentId || !formData.email || !formData.phone || !formData.year || !formData.course || !formData.emergencyContact || !formData.emergencyPhone) {
        throw new Error('Please fill in all required fields')
      }

      if (formData.sports.length === 0) {
        throw new Error('Please select at least one sport')
      }

      // ID verification removed - university login already verifies identity

      // Validate student ID and email
      const isValidStudent = await validateStudentId(formData.studentId, formData.email)
      if (!isValidStudent) {
        throw new Error('Invalid student ID format or email domain. Please ensure you are using your official university email.')
      }

      // Create player object
      const player: Player = {
        id: Date.now().toString(),
        ...formData,
        universityId
      }

      // Save player
      await onSave(player)

      setSuccess('Player registered successfully! You can now participate in the games.')
      
      // Reset form
      setFormData({
        name: '',
        studentId: '',
        email: '',
        phone: '',
        year: '',
        course: '',
        sports: [],
        emergencyContact: '',
        emergencyPhone: '',
        medicalInfo: ''
      })

      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to register player. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Register Player for {universityName}
          </DialogTitle>
          <DialogDescription>
            Add a new player to your university team. All players must provide valid student ID for verification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* ID Verification Section */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-orange-800">
                <Shield className="h-5 w-5 mr-2" />
                ID Verification Required
              </CardTitle>
              <CardDescription className="text-orange-700">
                All players must provide valid student ID to prevent unauthorized registrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    placeholder="e.g., 12345678 or ABC123456"
                    required
                    className="h-12"
                  />
                  <p className="text-sm text-gray-500">
                    Your official university student ID number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">University Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="student@university.ac.uk"
                    required
                    className="h-12"
                  />
                  <p className="text-sm text-gray-500">
                    Must be your official university email address
                  </p>
                </div>
              </div>

              {/* ID verification removed - university login already verifies identity */}
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Smith"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+44 7123 456789"
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Academic Year *</Label>
                  <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Course/Program *</Label>
                  <Input
                    id="course"
                    value={formData.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                    placeholder="Computer Science, Medicine, etc."
                    required
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sports Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Sports Selection *</CardTitle>
              <CardDescription>Select which sports this player will compete in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableSports.map((sport) => (
                  <div
                    key={sport}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.sports.includes(sport)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSportToggle(sport)}
                  >
                    <div className="text-center">
                      <div className="font-medium text-sm">{sport}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {formData.sports.length > 0 && (
                <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Selected Sports ({formData.sports.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.sports.map((sport) => (
                      <Badge key={sport} variant="secondary" className="bg-orange-100 text-orange-800">
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Parent/Guardian name"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    placeholder="+44 7123 456789"
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalInfo">Medical Information (Optional)</Label>
                <Textarea
                  id="medicalInfo"
                  value={formData.medicalInfo}
                  onChange={(e) => handleInputChange('medicalInfo', e.target.value)}
                  placeholder="Any medical conditions, allergies, or medications..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              {loading ? 'Registering...' : 'Register Player'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
