import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'all';

    // Get all admins from Firebase
    const adminsRef = ref(realtimeDb, 'admins');
    const snapshot = await get(adminsRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json({
        success: true,
        admins: []
      });
    }

    const data = snapshot.val();
    let admins = Object.values(data).map((admin: any) => ({
      ...admin,
      id: admin.uid
    }));

    // Filter by role if specified
    if (role !== 'all') {
      admins = admins.filter((admin: any) => admin.role === role);
    }

    // Sort by creation date (newest first)
    admins.sort((a: any, b: any) => b.createdAt - a.createdAt);

    return NextResponse.json({
      success: true,
      admins
    });

  } catch (error: any) {
    console.error('❌ Error fetching admins:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch admins',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, updates } = body;

    if (!adminId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update admin record
    const adminRef = ref(realtimeDb, `admins/${adminId}`);
    await update(adminRef, {
      ...updates,
      lastUpdated: Date.now()
    });

    console.log(`✅ Admin updated:`, adminId);

    return NextResponse.json({
      success: true,
      message: 'Admin updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error updating admin:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update admin',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Missing admin ID' },
        { status: 400 }
      );
    }

    // Remove admin record
    const adminRef = ref(realtimeDb, `admins/${adminId}`);
    await remove(adminRef);

    console.log(`✅ Admin removed:`, adminId);

    return NextResponse.json({
      success: true,
      message: 'Admin removed successfully'
    });

  } catch (error: any) {
    console.error('❌ Error removing admin:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove admin',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
