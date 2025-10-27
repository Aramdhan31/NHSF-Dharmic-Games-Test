'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Settings, User, Bell, Shield, Save, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { useFirebase } from '@/lib/firebase-context';

export default function UniversitySettings() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useFirebase();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    universityName: 'University of Westminster',
    contactEmail: 'sports@university.edu',
    contactPhone: '+44 20 7911 5000',
    address: '309 Regent Street, London W1B 2HW',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    privacy: {
      publicProfile: true,
      showContact: false,
      allowMessages: true
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, authLoading, router]);

  useEffect(() => {
    if (mounted && firebaseUser) {
      loadSettings();
    }
  }, [mounted, firebaseUser]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Load settings from Firebase or use defaults
      // This would typically fetch from Firebase
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Save settings to Firebase
      console.log('Saving settings:', settings);
      // Add Firebase save logic here
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  if (authLoading || loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">Manage your university profile and preferences</p>
            </div>

            <div className="space-y-6">
              {/* University Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-orange-500" />
                    <span>University Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="universityName">University Name</Label>
                    <Input
                      id="universityName"
                      value={settings.universityName}
                      onChange={(e) => setSettings({...settings, universityName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={settings.address}
                      onChange={(e) => setSettings({...settings, address: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <span>Notifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive updates via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings, 
                          notifications: {...settings.notifications, email: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-gray-600">Receive updates via SMS</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings, 
                          notifications: {...settings.notifications, sms: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-gray-600">Receive browser notifications</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings, 
                          notifications: {...settings.notifications, push: checked}
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Privacy Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span>Privacy Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="public-profile">Public Profile</Label>
                      <p className="text-sm text-gray-600">Make your profile visible to other universities</p>
                    </div>
                    <Switch
                      id="public-profile"
                      checked={settings.privacy.publicProfile}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings, 
                          privacy: {...settings.privacy, publicProfile: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-contact">Show Contact Information</Label>
                      <p className="text-sm text-gray-600">Display contact details on your profile</p>
                    </div>
                    <Switch
                      id="show-contact"
                      checked={settings.privacy.showContact}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings, 
                          privacy: {...settings.privacy, showContact: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-messages">Allow Messages</Label>
                      <p className="text-sm text-gray-600">Allow other universities to contact you</p>
                    </div>
                    <Switch
                      id="allow-messages"
                      checked={settings.privacy.allowMessages}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings, 
                          privacy: {...settings.privacy, allowMessages: checked}
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
