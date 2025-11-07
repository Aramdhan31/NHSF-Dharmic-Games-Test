"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/lib/firebase-context";
import { checkAdminStatus } from "@/lib/admin-auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Save, 
  Shield, 
  Bell, 
  Globe, 
  Database,
  User,
  Lock,
  Mail,
  Phone,
  Trophy,
  AlertCircle,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";

type Zone = 'LZ' | 'SZ' | 'CZ' | 'NZ';
type CombinedZone = 'LZ+SZ' | 'NZ+CZ';

const zoneNames = {
  LZ: 'London Zone',
  SZ: 'South Zone', 
  CZ: 'Central Zone',
  NZ: 'North Zone',
  'LZ+SZ': 'London & South Zone (Combined)',
  'NZ+CZ': 'North & Central Zone (Combined)'
};

export default function SettingsPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [adminCheck, setAdminCheck] = useState<any>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Check if user is admin (any admin, not just superadmin)
  useEffect(() => {
    if (!authLoading && currentUser) {
      const adminStatus = checkAdminStatus(currentUser);
      setAdminCheck(adminStatus);
      
      // Redirect non-admins to login
      if (!adminStatus.isAdmin) {
        router.push('/admin/login');
        return;
      }
    } else if (!authLoading && !currentUser) {
      router.push('/admin/login');
    }
  }, [currentUser, authLoading, router]);

  // Show loading while checking permissions
  if (authLoading || !adminCheck) {
    return (
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50">
          <AdminSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Show access denied if not admin
  if (!adminCheck.isAdmin) {
    return (
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50">
          <AdminSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-4">This page is only accessible to admins.</p>
              <Button onClick={() => router.push('/admin/login')}>
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      if (!currentUser?.email) {
        setPasswordError("Unable to get your email. Please log out and log back in.");
        setPasswordLoading(false);
        return;
      }

      const response = await fetch("/api/change-own-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          email: currentUser.email
        })
      });

      const data = await response.json();

      if (data.success) {
        setPasswordSuccess("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setPasswordError(data.error || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      setPasswordError("Failed to change password: " + error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const [settings, setSettings] = useState({
    // Zone Settings
    zoneName: 'London Zone',
    zoneCode: 'LZ',
    timezone: 'GMT+0',
    language: 'English',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    matchReminders: true,
    deadlineAlerts: true,
    weeklyReports: false,
    
    // Tournament Settings
    maxPlayersPerZone: 50,
    matchDuration: 90,
    breakTime: 15,
    autoAdvance: true,
    allowReschedules: true,
    
    // Security Settings
    requireTwoFactor: false,
    sessionTimeout: 30,
    allowGuestViewing: true,
    logAllActions: true
  });

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    // Show success message
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 p-6 ml-64 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Settings className="h-8 w-8 text-orange-600" />
                Settings
              </h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            <div className="space-y-6">
              {/* Account Security - Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-orange-500" />
                    <span>Change Password</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  {passwordSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">{passwordSuccess}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password *</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="Enter your current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password *</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Enter your new password (min 6 characters)"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Confirm your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Only show zone/tournament settings for superadmins */}
              {adminCheck.isSuperAdmin && (
                <>
          {/* Zone Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Zone Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zoneName">Zone Name</Label>
                  <Input
                    id="zoneName"
                    value={settings.zoneName}
                    onChange={(e) => handleSettingChange('zoneName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="zoneCode">Zone Code</Label>
                  <Input
                    id="zoneCode"
                    value={settings.zoneCode}
                    onChange={(e) => handleSettingChange('zoneCode', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="GMT+0">GMT+0 (London)</option>
                    <option value="GMT+1">GMT+1 (Paris)</option>
                    <option value="GMT+5">GMT+5 (Mumbai)</option>
                    <option value="GMT+8">GMT+8 (Singapore)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Receive push notifications</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="matchReminders">Match Reminders</Label>
                  <p className="text-sm text-gray-500">Get reminded about upcoming matches</p>
                </div>
                <Switch
                  id="matchReminders"
                  checked={settings.matchReminders}
                  onCheckedChange={(checked) => handleSettingChange('matchReminders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="deadlineAlerts">Deadline Alerts</Label>
                  <p className="text-sm text-gray-500">Get alerts for important deadlines</p>
                </div>
                <Switch
                  id="deadlineAlerts"
                  checked={settings.deadlineAlerts}
                  onCheckedChange={(checked) => handleSettingChange('deadlineAlerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyReports">Weekly Reports</Label>
                  <p className="text-sm text-gray-500">Receive weekly performance reports</p>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tournament Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Tournament Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxPlayers">Max Players per Zone</Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    value={settings.maxPlayersPerZone}
                    onChange={(e) => handleSettingChange('maxPlayersPerZone', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="matchDuration">Match Duration (minutes)</Label>
                  <Input
                    id="matchDuration"
                    type="number"
                    value={settings.matchDuration}
                    onChange={(e) => handleSettingChange('matchDuration', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="breakTime">Break Time (minutes)</Label>
                  <Input
                    id="breakTime"
                    type="number"
                    value={settings.breakTime}
                    onChange={(e) => handleSettingChange('breakTime', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoAdvance">Auto Advance Winners</Label>
                    <p className="text-sm text-gray-500">Automatically advance winners to next round</p>
                  </div>
                  <Switch
                    id="autoAdvance"
                    checked={settings.autoAdvance}
                    onCheckedChange={(checked) => handleSettingChange('autoAdvance', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowReschedules">Allow Reschedules</Label>
                    <p className="text-sm text-gray-500">Allow players to reschedule matches</p>
                  </div>
                  <Switch
                    id="allowReschedules"
                    checked={settings.allowReschedules}
                    onCheckedChange={(checked) => handleSettingChange('allowReschedules', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireTwoFactor">Require Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Add extra security to admin accounts</p>
                </div>
                <Switch
                  id="requireTwoFactor"
                  checked={settings.requireTwoFactor}
                  onCheckedChange={(checked) => handleSettingChange('requireTwoFactor', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowGuestViewing">Allow Guest Viewing</Label>
                  <p className="text-sm text-gray-500">Allow non-registered users to view matches</p>
                </div>
                <Switch
                  id="allowGuestViewing"
                  checked={settings.allowGuestViewing}
                  onCheckedChange={(checked) => handleSettingChange('allowGuestViewing', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="logAllActions">Log All Actions</Label>
                  <p className="text-sm text-gray-500">Keep detailed logs of all admin actions</p>
                </div>
                <Switch
                  id="logAllActions"
                  checked={settings.logAllActions}
                  onCheckedChange={(checked) => handleSettingChange('logAllActions', checked)}
                />
              </div>
            </CardContent>
          </Card>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={loading} className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
