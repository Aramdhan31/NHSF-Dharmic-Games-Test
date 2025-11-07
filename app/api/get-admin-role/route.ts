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

    const emailLower = email.toLowerCase();

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    let adminDoc = await adminDb.collection('admins').doc(emailLower).get();
    if (!adminDoc.exists && emailLower !== email) {
      const legacyDoc = await adminDb.collection('admins').doc(email).get();
      if (legacyDoc.exists) {
        const legacyData = legacyDoc.data();
        await adminDb.collection('admins').doc(emailLower).set({
          ...legacyData,
          email: legacyData?.email?.toLowerCase?.() || emailLower,
          migratedAt: Date.now(),
        }, { merge: true });
        adminDoc = await adminDb.collection('admins').doc(emailLower).get();
      }
    }
    
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
