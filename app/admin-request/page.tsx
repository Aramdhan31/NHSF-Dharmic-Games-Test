"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, CheckCircle, AlertCircle, Loader2, MapPin } from 'lucide-react'

export default function AdminRequestPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: '',
    university: '',
    email: '',
    reason: '',
    zones: {
      'NZ+CZ': false,
      'LZ+SZ': false
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    // Validate that at least one zone is selected
    const selectedZones = Object.values(formData.zones).some(selected => selected)
    if (!selectedZones) {
      setMessage({
        type: 'error',
        text: 'Please select at least one zone to manage.'
      })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/submit-admin-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({
          type: 'success',
          text: '✅ Thank you for requesting admin access! Please contact Arjun Ramdhan directly to let him know you\'ve submitted your request. You\'ll receive access once approved.'
        })
        
        // Reset form
        setFormData({
          fullName: '',
          university: '',
          email: '',
          reason: '',
          zones: {
            'NZ+CZ': false,
            'LZ+SZ': false
          }
        })
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to submit request. Please try again.'
        })
      }
    } catch (error) {
      console.error('Error submitting admin request:', error)
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Request Admin Access
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Submit a request to become an admin for the NHSF Dharmic Games
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="university" className="text-sm font-medium text-gray-700">
                  University (Optional)
                </Label>
                <Input
                  id="university"
                  name="university"
                  type="text"
                  value={formData.university}
                  onChange={handleInputChange}
                  placeholder="Enter your university name (optional)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@university.ac.uk (NHSF emails preferred)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Zones to Manage *
                </Label>
                <p className="text-xs text-gray-500 mb-3">Select which zones you want to manage</p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <Checkbox
                      id="nz-cz"
                      checked={formData.zones['NZ+CZ']}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          zones: {
                            ...prev.zones,
                            'NZ+CZ': checked as boolean
                          }
                        }))
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor="nz-cz" className="font-medium">North & Central Zone (NZ+CZ)</Label>
                      <p className="text-xs text-gray-500">Manage universities in North and Central regions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <Checkbox
                      id="lz-sz"
                      checked={formData.zones['LZ+SZ']}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          zones: {
                            ...prev.zones,
                            'LZ+SZ': checked as boolean
                          }
                        }))
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor="lz-sz" className="font-medium">London & South Zone (LZ+SZ)</Label>
                      <p className="text-xs text-gray-500">Manage universities in London and South regions</p>
                    </div>
                  </div>
                  
                  {/* Show special message if both zones are selected */}
                  {formData.zones['NZ+CZ'] && formData.zones['LZ+SZ'] && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-800">All Zone Access</p>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        You'll have access to manage all universities across both zones (full admin access)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="reason" className="text-sm font-medium text-gray-700">
                  Reason for Admin Access (Optional)
                </Label>
                <Textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Explain why you need admin access and what you plan to do with it... (optional)"
                  rows={4}
                  className="mt-1"
                />
              </div>

              {message && (
                <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your request will be reviewed by Super Admin Arjun Ramdhan</li>
                <li>• You'll receive an email notification once approved</li>
                <li>• Approved admins get access to the admin dashboard</li>
                <li>• This process typically takes 24-48 hours</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
