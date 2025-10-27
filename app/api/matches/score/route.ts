import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, team, score } = body;

    // Validate required fields
    if (!matchId || !team || score === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate team parameter
    if (team !== 'team1' && team !== 'team2') {
      return NextResponse.json(
        { success: false, error: 'Invalid team parameter' },
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

    // Update the score
    const updatedMatch = {
      ...targetMatch,
      [team]: score,
      updatedAt: Date.now()
    };

    // Save updated match
    const matchRef = ref(realtimeDb, `matches/${matchKey}`);
    await set(matchRef, updatedMatch);

    console.log(`✅ Score updated for match ${matchId}: ${team} = ${score}`);

    return NextResponse.json({
      success: true,
      message: 'Score updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error updating score:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update score',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
