import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone') || 'all';
    const status = searchParams.get('status') || 'all';

    // Get all universities from Firebase
    const universitiesRef = ref(realtimeDb, 'universities');
    const snapshot = await get(universitiesRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json({
        success: true,
        universities: []
      });
    }

    const data = snapshot.val();
    let universities = Object.entries(data).map(([id, university]: [string, any]) => ({
      ...university,
      id,
      uid: id
    }));

    // Filter by zone if specified
    if (zone !== 'all') {
      universities = universities.filter((uni: any) => uni.zone === zone || uni.region === zone);
    }

    // Filter by status if specified
    if (status !== 'all') {
      universities = universities.filter((uni: any) => uni.status === status);
    }

    // Sort by creation date (newest first)
    universities.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({
      success: true,
      universities
    });

  } catch (error: any) {
    console.error('❌ Error fetching universities:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch universities',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { universityId, updates } = body;

    if (!universityId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update university record
    const universityRef = ref(realtimeDb, `universities/${universityId}`);
    await update(universityRef, {
      ...updates,
      lastUpdated: Date.now()
    });

    console.log(`✅ University updated:`, universityId);

    return NextResponse.json({
      success: true,
      message: 'University updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error updating university:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update university',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { universityId } = body;

    if (!universityId) {
      return NextResponse.json(
        { success: false, error: 'Missing university ID' },
        { status: 400 }
      );
    }

    // Remove university record
    const universityRef = ref(realtimeDb, `universities/${universityId}`);
    await remove(universityRef);

    console.log(`✅ University removed:`, universityId);

    return NextResponse.json({
      success: true,
      message: 'University removed successfully'
    });

  } catch (error: any) {
    console.error('❌ Error removing university:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove university',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
