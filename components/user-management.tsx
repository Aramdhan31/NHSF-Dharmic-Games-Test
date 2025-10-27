"use client";

import React, { useState, useEffect } from 'react';
import { userManagementService, User, UserRole } from '@/lib/user-management';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Shield, 
  Crown,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await userManagementService.getAllUsers();
      if (result.success) {
        setUsers(result.data || []);
      } else {
        setError(result.error || 'Failed to load users');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user.id);
    setEditForm({
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      zone: user.zone,
      role: user.role,
      isActive: user.isActive
    });
  };

  const handleSaveUser = async (userId: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      const result = await userManagementService.updateUser(userId, editForm);
      if (result.success) {
        setSuccess('User updated successfully');
        setEditingUser(null);
        setEditForm({});
        loadUsers();
      } else {
        setError(result.error || 'Failed to update user');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setError(null);
      setSuccess(null);
      
      const result = await userManagementService.deleteUser(userId);
      if (result.success) {
        setSuccess('User deleted successfully');
        loadUsers();
      } else {
        setError(result.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'zone_admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'player':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'viewer':
        return <UserCheck className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-yellow-100 text-yellow-800';
      case 'zone_admin':
        return 'bg-blue-100 text-blue-800';
      case 'player':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Users...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'super_admin').length}</p>
                <p className="text-sm text-gray-600">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'zone_admin').length}</p>
                <p className="text-sm text-gray-600">Zone Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{user.displayName}</h3>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{user.role.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      Zone: {user.zone} | 
                      {user.isActive ? ' Active' : ' Inactive'} |
                      Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {editingUser === user.id ? (
                    <div className="flex items-center space-x-2">
                      <Select value={editForm.role} onValueChange={(value: UserRole) => setEditForm({...editForm, role: value})}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="zone_admin">Zone Admin</SelectItem>
                          <SelectItem value="player">Player</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={editForm.zone} onValueChange={(value) => setEditForm({...editForm, zone: value})}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LZ">LZ</SelectItem>
                          <SelectItem value="SZ">SZ</SelectItem>
                          <SelectItem value="CZ">CZ</SelectItem>
                          <SelectItem value="NZ">NZ</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button size="sm" onClick={() => handleSaveUser(user.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {user.role !== 'super_admin' && (
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
