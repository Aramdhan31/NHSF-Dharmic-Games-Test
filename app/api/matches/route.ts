import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, push, set, get } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sport, team1, team2, team1Score = 0, team2Score = 0, status = 'scheduled' } = body;

    // Validate required fields
    if (!sport || !team1 || !team2) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique match ID
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create match data
    const match = {
      id: matchId,
      sport,
      team1,
      team2,
      team1Score,
      team2Score,
      status,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Save to Firebase Realtime Database
    const matchesRef = ref(realtimeDb, 'matches');
    const newMatchRef = push(matchesRef);
    await set(newMatchRef, match);

    console.log('✅ Match created:', matchId);

    return NextResponse.json({
      success: true,
      message: 'Match created successfully',
      matchId
    });

  } catch (error: any) {
    console.error('❌ Error creating match:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create match',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Get all matches from Firebase
    const matchesRef = ref(realtimeDb, 'matches');
    const snapshot = await get(matchesRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json({
        success: true,
        matches: []
      });
    }

    const data = snapshot.val();
    let matches = Object.values(data).map((match: any) => ({
      ...match,
      id: match.id || Object.keys(data).find(key => data[key] === match)
    }));

    // Filter by status if specified
    if (status !== 'all') {
      matches = matches.filter((match: any) => match.status === status);
    }

    // Sort by creation date (newest first)
    matches.sort((a: any, b: any) => b.createdAt - a.createdAt);

    return NextResponse.json({
      success: true,
      matches
    });

  } catch (error: any) {
    console.error('❌ Error fetching matches:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch matches',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
