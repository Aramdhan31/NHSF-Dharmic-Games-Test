import { NextRequest, NextResponse } from 'next/server';
import { firestoreUtils } from '@/lib/firebase-utils';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Get user data from Firebase
    const result = await firestoreUtils.getDocument('users', uid);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const user = result.data;

    return NextResponse.json({
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        displayName: user.displayName,
        zone: user.zone
      }
    });

  } catch (error: any) {
    console.error('Error checking user role:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
