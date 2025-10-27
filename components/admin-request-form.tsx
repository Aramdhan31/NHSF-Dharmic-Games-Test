"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, User, MapPin, MessageSquare } from 'lucide-react';
import { useFirebase } from '@/hooks/use-firebase-auth';

interface AdminRequestFormProps {
  onSuccess?: () => void;
}

export function AdminRequestForm({ onSuccess }: AdminRequestFormProps) {
  const { user } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    university: '',
    zone: '',
    role: '',
    reason: '',
    experience: '',
    availability: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setMessage({type: 'error', text: 'Please log in to request admin access'});
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/admin-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user.uid,
          userEmail: user.email,
          requestedAt: new Date().toISOString()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Admin access request submitted successfully! You will be notified via email when your request is reviewed.'
        });
        setFormData({
          name: '',
          email: '',
          university: '',
          zone: '',
          role: '',
          reason: '',
          experience: '',
          availability: ''
        });
        onSuccess?.();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to submit request'
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Failed to submit request: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <span>Request Admin Access</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Fill out this form to request admin privileges for the NHSF Dharmic Games system.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  placeholder="your.email@university.ac.uk"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="university">University *</Label>
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => handleChange('university', e.target.value)}
                  required
                  placeholder="Your university name"
                />
              </div>
              
              <div>
                <Label htmlFor="zone">Zone *</Label>
                <Select value={formData.zone} onValueChange={(value) => handleChange('zone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NZ+CZ">North & Central Zone</SelectItem>
                    <SelectItem value="LZ+SZ">London & South Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Admin Role */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Admin Role</span>
            </h3>
            
            <div>
              <Label htmlFor="role">Requested Admin Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select admin role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zone-admin">Zone Administrator</SelectItem>
                  <SelectItem value="tournament-admin">Tournament Administrator</SelectItem>
                  <SelectItem value="match-admin">Match Administrator</SelectItem>
                  <SelectItem value="general-admin">General Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Additional Information</span>
            </h3>
            
            <div>
              <Label htmlFor="reason">Reason for Admin Access *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                required
                placeholder="Explain why you need admin access and how you plan to use it..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="experience">Relevant Experience</Label>
              <Textarea
                id="experience"
                value={formData.experience}
                onChange={(e) => handleChange('experience', e.target.value)}
                placeholder="Describe any relevant experience with sports management, event organization, or similar systems..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="availability">Availability</Label>
              <Textarea
                id="availability"
                value={formData.availability}
                onChange={(e) => handleChange('availability', e.target.value)}
                placeholder="Describe your availability during the tournament period..."
                rows={2}
              />
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Mail className="h-4 w-4" />
              <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
