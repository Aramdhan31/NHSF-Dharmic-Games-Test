import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const adminDoc = await adminDb.collection('admins').doc(email).get();
    
    if (!adminDoc.exists) {
      return NextResponse.json({ success: true, role: null });
    }

    const adminData = adminDoc.data();
    return NextResponse.json({ 
      success: true, 
      role: adminData?.role || null,
      adminData: adminData || null
    });

  } catch (error: any) {
    console.error('❌ Error fetching admin role:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch admin role',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
