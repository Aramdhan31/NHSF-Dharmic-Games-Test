import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { isAdmin, getAdminName } from '@/lib/admin-config';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email is in admin list
    if (!isAdmin(email)) {
      return NextResponse.json(
        { success: false, error: 'Email is not authorized for admin access' },
        { status: 403 }
      );
    }

    // Check if admin user already exists in Firestore
    const existingUser = await adminDb.collection('adminUsers').where('email', '==', email).get();
    
    if (!existingUser.empty) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists in Firestore'
      });
    }

    // Get existing Firebase Auth user
    let userRecord;
    try {
      userRecord = await adminDb.auth().getUserByEmail(email);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Firebase Auth user not found. Please create account first.' },
        { status: 404 }
      );
    }

    // Create admin user document in Firestore
    const adminUserData = {
      id: userRecord.uid,
      email: email,
      displayName: getAdminName(email),
      firstName: getAdminName(email).split(' ')[0],
      lastName: getAdminName(email).split(' ').slice(1).join(' '),
      zone: 'ALL',
      role: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      permissions: {
        canManageUsers: true,
        canManageAllZones: true,
        canManageOwnZone: true,
        canViewAnalytics: true,
        canUpdateResults: true,
        canCreateMatches: true,
      }
    };

    await adminDb.collection('adminUsers').doc(userRecord.uid).set(adminUserData);

    return NextResponse.json({
      success: true,
      message: 'Admin access fixed! You can now login with your existing email and password.',
      userId: userRecord.uid
    });

  } catch (error) {
    console.error('Error fixing admin access:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix admin access' },
      { status: 500 }
    );
  }
}
