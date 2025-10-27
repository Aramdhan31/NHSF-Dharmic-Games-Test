import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, status } = body;

    // Validate required fields
    if (!matchId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status parameter
    const validStatuses = ['scheduled', 'live', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status parameter' },
        { status: 400 }
      );
    }

    // Get all matches to find the specific match
    const matchesRef = ref(realtimeDb, 'matches');
    const snapshot = await get(matchesRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: 'No matches found' },
        { status: 404 }
      );
    }

    const data = snapshot.val();
    let targetMatch = null;
    let matchKey = null;

    // Find the match by ID
    for (const [key, match] of Object.entries(data)) {
      if ((match as any).id === matchId) {
        targetMatch = match;
        matchKey = key;
        break;
      }
    }

    if (!targetMatch) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Update the status
    const updatedMatch = {
      ...targetMatch,
      status,
      updatedAt: Date.now()
    };

    // Add timestamps based on status
    if (status === 'live' && !targetMatch.startTime) {
      updatedMatch.startTime = new Date().toISOString();
    }
    if (status === 'completed' && !targetMatch.endTime) {
      updatedMatch.endTime = new Date().toISOString();
    }

    // Save updated match
    const matchRef = ref(realtimeDb, `matches/${matchKey}`);
    await set(matchRef, updatedMatch);

    console.log(`✅ Status updated for match ${matchId}: ${status}`);

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error updating status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
