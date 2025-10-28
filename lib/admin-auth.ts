/**
 * Centralized Admin Authentication Utilities
 * Handles all admin role checking and permissions
 */

export interface AdminUser {
  email: string;
  role?: string;
  permissions?: {
    canManageAllZones?: boolean;
    canManageOwnZone?: boolean;
    canManageUsers?: boolean;
    canViewAnalytics?: boolean;
    canUpdateResults?: boolean;
    canCreateMatches?: boolean;
  };
  name?: string;
}

export interface AdminCheckResult {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isZoneAdmin: boolean;
  isEmailAdmin: boolean;
  adminType: 'super_admin' | 'zone_admin' | 'email_admin' | 'none';
  permissions: {
    canManageAllZones: boolean;
    canManageOwnZone: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
    canUpdateResults: boolean;
    canCreateMatches: boolean;
  };
}

/**
 * Check if a user is an admin and determine their admin type
 */
export function checkAdminStatus(user: AdminUser | null): AdminCheckResult {
  if (!user || !user.email) {
    return {
      isAdmin: false,
      isSuperAdmin: false,
      isZoneAdmin: false,
      isEmailAdmin: false,
      adminType: 'none',
      permissions: {
        canManageAllZones: false,
        canManageOwnZone: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canUpdateResults: false,
        canCreateMatches: false,
      }
    };
  }

  // Check role-based admin status (primary method)
  const isSuperAdmin = user.role === 'super_admin' || user.permissions?.canManageAllZones;
  const isZoneAdmin = user.role === 'zone_admin' || user.permissions?.canManageOwnZone;
  
  // Check email-based admin status (fallback for legacy users)
  // Only specific emails get automatic admin access - others must request it
  const isEmailAdmin = user.email === 'arjunramdhan37@outlook.com' ||
                      user.email === 'arjun.ramdhan@nhsf.org.uk' ||
                      user.email === 'arjun.ramdhan.nhsf@gmail.com' ||
                      user.email === 'arjunramdhan37@gmail.com' ||
                      user.email === 'pdevulapally0202@gmail.com';

  // Debug logging
  console.log('🔐 Admin auth debug:', {
    email: user.email,
    isEmailAdmin,
    isSuperAdmin,
    isZoneAdmin
  });

  // Primary admin check: role-based takes priority, with email fallback
  const isAdmin = isSuperAdmin || isZoneAdmin || isEmailAdmin;

  // Determine admin type
  let adminType: 'super_admin' | 'zone_admin' | 'email_admin' | 'none' = 'none';
  if (isSuperAdmin) adminType = 'super_admin';
  else if (isZoneAdmin) adminType = 'zone_admin';
  else if (isEmailAdmin) adminType = 'email_admin';

  // Determine permissions based on admin type
  const permissions = {
    canManageAllZones: isSuperAdmin || isEmailAdmin,
    canManageOwnZone: isSuperAdmin || isZoneAdmin || isEmailAdmin,
    canManageUsers: isSuperAdmin || isEmailAdmin,
    canViewAnalytics: isSuperAdmin || isZoneAdmin || isEmailAdmin,
    canUpdateResults: isSuperAdmin || isZoneAdmin || isEmailAdmin,
    canCreateMatches: isSuperAdmin || isZoneAdmin || isEmailAdmin,
  };

  return {
    isAdmin,
    isSuperAdmin,
    isZoneAdmin,
    isEmailAdmin,
    adminType,
    permissions
  };
}

/**
 * Get admin display name and role
 */
export function getAdminInfo(user: AdminUser | null): { name: string; role: string; type: string } {
  if (!user) {
    return { name: 'Unknown', role: 'None', type: 'none' };
  }

  const adminCheck = checkAdminStatus(user);
  
  let role = 'User';
  let type = adminCheck.adminType;
  
  if (adminCheck.isSuperAdmin) {
    role = 'Super Admin';
  } else if (adminCheck.isZoneAdmin) {
    role = 'Zone Admin';
  } else if (adminCheck.isEmailAdmin) {
    role = 'Admin';
  }

  return {
    name: user.name || user.email || 'Unknown',
    role,
    type
  };
}

/**
 * Check if user can access a specific admin feature
 */
export function canAccessFeature(user: AdminUser | null, feature: keyof AdminCheckResult['permissions']): boolean {
  const adminCheck = checkAdminStatus(user);
  return adminCheck.permissions[feature];
}

/**
 * Get admin dashboard title based on user type
 */
export function getAdminDashboardTitle(user: AdminUser | null): string {
  const adminInfo = getAdminInfo(user);
  
  if (adminInfo.type === 'super_admin') {
    return 'Super Admin Dashboard';
  } else if (adminInfo.type === 'zone_admin') {
    return 'Zone Admin Dashboard';
  } else if (adminInfo.type === 'email_admin') {
    return 'Admin Dashboard';
  }
  
  return 'Admin Dashboard';
}

/**
 * Log admin access for debugging
 */
export function logAdminAccess(user: AdminUser | null, context: string): void {
  if (!user) {
    console.log(`🔐 ${context}: No user`);
    return;
  }

  const adminCheck = checkAdminStatus(user);
  const adminInfo = getAdminInfo(user);
  
  console.log(`🔐 ${context}:`, {
    user: user.email,
    name: adminInfo.name,
    role: adminInfo.role,
    type: adminInfo.type,
    isAdmin: adminCheck.isAdmin,
    permissions: adminCheck.permissions
  });
}
