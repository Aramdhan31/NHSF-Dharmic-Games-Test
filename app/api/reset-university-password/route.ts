import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { isAdmin, getAdminName } from '@/lib/admin-config';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    // Check if email is in admin list (only admins can reset passwords)
    if (!isAdmin(email)) {
      return NextResponse.json(
        { success: false, error: 'Only admins can reset university passwords' },
        { status: 403 }
      );
    }

    // Get the university user by email
    let userRecord;
    try {
      userRecord = await adminDb.auth().getUserByEmail(email);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'University user not found' },
        { status: 404 }
      );
    }

    // Update the user's password
    await adminDb.auth().updateUser(userRecord.uid, {
      password: newPassword
    });

    return NextResponse.json({
      success: true,
      message: 'University password reset successfully',
      userId: userRecord.uid
    });

  } catch (error) {
    console.error('Error resetting university password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset university password' },
      { status: 500 }
    );
  }
}
