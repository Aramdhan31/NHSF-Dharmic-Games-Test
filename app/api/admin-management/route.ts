import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import * as bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const snapshot = await adminDb.collection('admins').get();
    const admins = snapshot.docs.map((doc) => ({
      id: doc.id,
      email: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, admins });
  } catch (error: any) {
    console.error('❌ Error fetching admins:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch admins',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role, name, zones } = body;

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

    const updateData: any = {
      lastUpdated: Date.now(),
    };

    if (role !== undefined) updateData.role = role;
    if (name !== undefined) updateData.name = name;
    if (zones !== undefined) updateData.zones = zones;

    // Update in admins collection
    await adminDb.collection('admins').doc(email).update(updateData);

    // Also update in users collection if it exists
    try {
      const usersSnapshot = await adminDb
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        await userDoc.ref.update({
          role: role || userDoc.data().role,
          displayName: name || userDoc.data().displayName,
          lastUpdated: Date.now(),
        });
      }
    } catch (e) {
      console.log('⚠️ Could not update users collection:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error updating admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update admin',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Delete from admins collection
    await adminDb.collection('admins').doc(email).delete();

    // Also delete from users collection if it exists
    try {
      const usersSnapshot = await adminDb
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        await userDoc.ref.delete();
      }
    } catch (e) {
      console.log('⚠️ Could not delete from users collection:', e);
    }

    // Delete from Firebase Auth
    try {
      const auth = getAuth();
      const userRecord = await auth.getUserByEmail(email);
      await auth.deleteUser(userRecord.uid);
    } catch (e) {
      console.log('⚠️ Could not delete from Firebase Auth:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error deleting admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete admin',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, name, zones } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create in Firebase Auth
    const auth = getAuth();
    const uid = `admin_${Buffer.from(email).toString('hex').slice(0, 24)}`;
    
    try {
      // Delete existing user if any
      try {
        const existing = await auth.getUserByEmail(email);
        await auth.deleteUser(existing.uid);
      } catch {}

      await auth.importUsers(
        [
          {
            uid,
            email,
            emailVerified: true,
            displayName: name || email,
            passwordHash: Buffer.from(passwordHash),
          },
        ],
        { hash: { algorithm: 'BCRYPT' } }
      );
    } catch (e: any) {
      console.error('❌ Error creating Firebase Auth user:', e);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user in Firebase Auth',
          details: e.message,
        },
        { status: 500 }
      );
    }

    // Create in admins collection
    await adminDb.collection('admins').doc(email).set({
      email,
      name: name || email,
      role,
      zones: zones || [],
      approvedAt: Date.now(),
      approvedBy: 'superadmin',
      createdAt: Date.now(),
    });

    // Also create in users collection
    await adminDb.collection('users').doc(uid).set({
      id: uid,
      email,
      displayName: name || email,
      firstName: name?.split(' ')[0] || '',
      lastName: name?.split(' ').slice(1).join(' ') || '',
      zone: zones?.[0] || 'all',
      role,
      isActive: true,
      createdAt: Date.now(),
      permissions: {
        canManageUsers: role === 'super_admin',
        canManageAllZones: role === 'super_admin',
        canManageOwnZone: true,
        canViewAnalytics: true,
        canUpdateResults: true,
        canCreateMatches: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error creating admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create admin',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
