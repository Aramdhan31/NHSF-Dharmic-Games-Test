"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { UserPlus, AlertCircle, CheckCircle, Users, GraduationCap, Gamepad2, Eye, Users2 } from 'lucide-react'
import { useFirebaseAuth } from '@/hooks/use-firebase-auth'

interface Member {
  id: string
  fullName: string
  ticketType: 'participant' | 'spectator' | 'referee_volunteer_external'
  university?: string
  sport?: string
  emergencyContactName: string
  emergencyContactNumber: string
  disclaimerAccepted: boolean
  registrationDate: string
  universityId: string
}

const ticketTypes = [
  { value: 'participant', label: 'Participant Ticket', icon: Gamepad2, description: 'For students participating in sports' },
  { value: 'spectator', label: 'Spectator Ticket', icon: Eye, description: 'For those watching the games' },
  { value: 'referee_volunteer_external', label: 'Referee/Volunteer/External Ticket', icon: Users2, description: 'For referees, volunteers, and external participants' }
]

const availableSports = [
  'Football', 'Basketball', 'Volleyball', 'Cricket', 'Badminton', 'Table Tennis',
  'Tennis', 'Swimming', 'Athletics', 'Chess', 'Kabaddi', 'Kho-Kho'
]

export default function MemberRegistration() {
  const { currentUser } = useFirebaseAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    fullName: '',
    ticketType: '',
    university: '',
    sport: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    disclaimerAccepted: false
  })

  const [members, setMembers] = useState<Member[]>([])

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
      if (!formData.ticketType) {
        throw new Error('Please select a ticket type')
      }
      if (formData.ticketType === 'participant' && !formData.university) {
        throw new Error('University is required for participants')
      }
      if (formData.ticketType === 'participant' && !formData.sport) {
        throw new Error('Sport is required for participants')
      }
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
      const newMember: Omit<Member, 'id'> = {
        fullName: formData.fullName.trim(),
        ticketType: formData.ticketType as 'participant' | 'spectator' | 'referee_volunteer_external',
        university: formData.ticketType === 'participant' ? formData.university : undefined,
        sport: formData.ticketType === 'participant' ? formData.sport : undefined,
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactNumber: formData.emergencyContactNumber.trim(),
        disclaimerAccepted: true,
        registrationDate: new Date().toISOString(),
        universityId: currentUser?.uid || ''
      }

      // Save to Firebase via API
      const response = await fetch('/api/member-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMember),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register member')
      }

      // Add to local state
      setMembers(prev => [...prev, { ...newMember, id: result.id }])
      setSuccess('Member registered successfully!')

      // Reset form
      setFormData({
        fullName: '',
        ticketType: '',
        university: '',
        sport: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        disclaimerAccepted: false
      })

    } catch (err: any) {
      setError(err.message || 'Failed to register member')
    } finally {
      setLoading(false)
    }
  }

  const getTicketTypeInfo = (type: string) => {
    return ticketTypes.find(t => t.value === type)
  }

  const getTicketTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'participant': return 'bg-green-100 text-green-800 border-green-200'
      case 'spectator': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'referee_volunteer_external': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <UserPlus className="h-6 w-6 mr-2" />
            Member Registration
          </h2>
          <p className="text-gray-600">
            Register individual members for your university
          </p>
        </div>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
          <Users className="w-3 h-3 mr-1" />
          {members.length} Registered
        </Badge>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Register New Member
            </CardTitle>
            <CardDescription>
              Add a new member to your university team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="John Smith"
                  required
                />
              </div>

              {/* Ticket Type */}
              <div className="space-y-2">
                <Label htmlFor="ticketType">Ticket Type *</Label>
                <Select value={formData.ticketType} onValueChange={(value) => handleInputChange('ticketType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* University (only for participants) */}
              {formData.ticketType === 'participant' && (
                <div className="space-y-2">
                  <Label htmlFor="university">University *</Label>
                  <Input
                    id="university"
                    value={formData.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    placeholder="University of Example"
                    required
                  />
                </div>
              )}

              {/* Sport (only for participants) */}
              {formData.ticketType === 'participant' && (
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport *</Label>
                  <Select value={formData.sport} onValueChange={(value) => handleInputChange('sport', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSports.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Emergency Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                  placeholder="Parent/Guardian Name"
                  required
                />
              </div>

              {/* Emergency Contact Number */}
              <div className="space-y-2">
                <Label htmlFor="emergencyContactNumber">Emergency Contact Number *</Label>
                <Input
                  id="emergencyContactNumber"
                  value={formData.emergencyContactNumber}
                  onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
                  placeholder="+44 20 1234 5678"
                  required
                />
              </div>

              {/* Disclaimer */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="disclaimer"
                  checked={formData.disclaimerAccepted}
                  onCheckedChange={(checked) => handleInputChange('disclaimerAccepted', checked as boolean)}
                  required
                />
                <Label htmlFor="disclaimer" className="text-sm font-normal leading-relaxed">
                  I agree to the disclaimer policy and understand the terms and conditions for participation in the NHSF (UK) (UK) Dharmic Games *
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering Member...' : 'Register Member'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Registered Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Registered Members</span>
              <Badge variant="secondary">{members.length}</Badge>
            </CardTitle>
            <CardDescription>
              Members registered for your university
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {members.map((member, index) => {
                const ticketInfo = getTicketTypeInfo(member.ticketType)
                const Icon = ticketInfo?.icon || Users
                
                return (
                  <div key={member.id || index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{member.fullName}</span>
                      </div>
                      <Badge className={`text-xs ${getTicketTypeBadgeColor(member.ticketType)}`}>
                        {ticketInfo?.label}
                      </Badge>
                    </div>
                    
                    {member.university && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <GraduationCap className="h-3 w-3" />
                        <span>{member.university}</span>
                      </div>
                    )}
                    
                    {member.sport && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Gamepad2 className="h-3 w-3" />
                        <span>{member.sport}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Emergency: {member.emergencyContactName} - {member.emergencyContactNumber}
                    </div>
                  </div>
                )
              })}
              
              {members.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No members registered yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
