"use client";

import { firestoreUtils } from './firebase-utils';
import { where, limit } from 'firebase/firestore';

// User roles and permissions
export type UserRole = 'super_admin' | 'zone_admin' | 'player' | 'viewer';

export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  zone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: any;
  lastLoginAt?: any;
  permissions: {
    canManageUsers: boolean;
    canManageAllZones: boolean;
    canManageOwnZone: boolean;
    canViewAnalytics: boolean;
    canUpdateResults: boolean;
    canCreateMatches: boolean;
  };
}

// Default permissions for each role
const rolePermissions = {
  super_admin: {
    canManageUsers: true,
    canManageAllZones: true,
    canManageOwnZone: true,
    canViewAnalytics: true,
    canUpdateResults: true,
    canCreateMatches: true,
  },
  zone_admin: {
    canManageUsers: false,
    canManageAllZones: false,
    canManageOwnZone: true,
    canViewAnalytics: true,
    canUpdateResults: true,
    canCreateMatches: true,
  },
  player: {
    canManageUsers: false,
    canManageAllZones: false,
    canManageOwnZone: false,
    canViewAnalytics: false,
    canUpdateResults: false,
    canCreateMatches: false,
  },
  viewer: {
    canManageUsers: false,
    canManageAllZones: false,
    canManageOwnZone: false,
    canViewAnalytics: true,
    canUpdateResults: false,
    canCreateMatches: false,
  },
};

// User management service
export const userManagementService = {
  // Create a new user
  createUser: async (userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>) => {
    const userWithPermissions = {
      ...userData,
      permissions: rolePermissions[userData.role],
    };
    
    return await firestoreUtils.createDocument('users', userWithPermissions);
  },

  // Get user by email
  getUserByEmail: async (email: string) => {
    const result = await firestoreUtils.getDocuments('users', [
      where('email', '==', email.toLowerCase()),
      limit(1)
    ]);
    
    if (result.success && result.data.length > 0) {
      return { success: true, data: result.data[0] };
    }
    
    return { success: false, error: 'User not found' };
  },

  // Get user by ID
  getUserById: async (userId: string) => {
    return await firestoreUtils.getDocument('users', userId);
  },

  // Update user
  updateUser: async (userId: string, updates: Partial<User>) => {
    const result = await firestoreUtils.updateDocument('users', userId, updates);
    
    // Update permissions if role changed
    if (updates.role && result.success) {
      const newPermissions = rolePermissions[updates.role];
      await firestoreUtils.updateDocument('users', userId, {
        permissions: newPermissions
      });
    }
    
    return result;
  },

  // Get all users
  getAllUsers: async () => {
    return await firestoreUtils.getDocuments('users');
  },

  // Get users by role
  getUsersByRole: async (role: UserRole) => {
    return await firestoreUtils.getDocuments('users', [
      where('role', '==', role)
    ]);
  },

  // Get users by zone
  getUsersByZone: async (zone: string) => {
    return await firestoreUtils.getDocuments('users', [
      where('zone', '==', zone)
    ]);
  },

  // Delete user
  deleteUser: async (userId: string) => {
    return await firestoreUtils.deleteDocument('users', userId);
  },

  // Update user's last login
  updateLastLogin: async (userId: string) => {
    return await firestoreUtils.updateDocument('users', userId, {
      lastLoginAt: new Date()
    });
  },

  // Check if user has permission
  hasPermission: (user: User, permission: keyof User['permissions']): boolean => {
    return user.permissions[permission];
  },

  // Check if user can access zone
  canAccessZone: (user: User, targetZone: string): boolean => {
    if (user.permissions.canManageAllZones) return true;
    if (user.permissions.canManageOwnZone && user.zone === targetZone) return true;
    return false;
  },

  // Initialize super admin (first user)
  initializeSuperAdmin: async (email: string, displayName: string, firstName: string, lastName: string) => {
    // Check if any users exist
    const existingUsers = await firestoreUtils.getDocuments('users');
    
    if (existingUsers.success && existingUsers.data.length > 0) {
      return { success: false, error: 'Super admin already exists' };
    }

    // Create super admin
    const superAdminData = {
      email,
      displayName,
      firstName,
      lastName,
      zone: 'ALL', // Super admin can access all zones
      role: 'super_admin' as UserRole,
      isActive: true,
    };

    return await userManagementService.createUser(superAdminData);
  },

  // Promote user to zone admin
  promoteToZoneAdmin: async (userId: string, zone: string) => {
    return await userManagementService.updateUser(userId, {
      role: 'zone_admin',
      zone: zone
    });
  },

  // Demote user to player
  demoteToPlayer: async (userId: string) => {
    return await userManagementService.updateUser(userId, {
      role: 'player'
    });
  },

  // Get user statistics
  getUserStats: async () => {
    const allUsers = await firestoreUtils.getDocuments('users');
    
    if (!allUsers.success) {
      return { success: false, error: allUsers.error };
    }

    const users = allUsers.data;
    const stats = {
      total: users.length,
      superAdmins: users.filter(u => u.role === 'super_admin').length,
      zoneAdmins: users.filter(u => u.role === 'zone_admin').length,
      players: users.filter(u => u.role === 'player').length,
      viewers: users.filter(u => u.role === 'viewer').length,
      active: users.filter(u => u.isActive).length,
      byZone: {
        LZ: users.filter(u => u.zone === 'LZ').length,
        SZ: users.filter(u => u.zone === 'SZ').length,
        CZ: users.filter(u => u.zone === 'CZ').length,
        NZ: users.filter(u => u.zone === 'NZ').length,
      }
    };

    return { success: true, data: stats };
  }
};
