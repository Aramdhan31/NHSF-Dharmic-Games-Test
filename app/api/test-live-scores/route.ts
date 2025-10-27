import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, set, update } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing live score updates...');
    
    const { action } = await request.json();
    
    switch (action) {
      case 'create-match':
        await createTestMatch();
        break;
      case 'update-score':
        await updateTestScore();
        break;
      case 'complete-match':
        await completeTestMatch();
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Live score test completed: ${action}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error testing live scores:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test live scores',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function createTestMatch() {
  const matchId = `test-match-${Date.now()}`;
  const matchData = {
    id: matchId,
    teamA: 'University of Manchester',
    teamB: 'Imperial College London',
    scoreA: 0,
    scoreB: 0,
    sport: 'Kho Kho',
    zone: 'NZ+CZ',
    status: 'scheduled',
    lastUpdated: Date.now(),
    adminNotes: 'Test match created for live scoring demo'
  };
  
  await set(ref(realtimeDb, `matches/${matchId}`), matchData);
  console.log('✅ Created test match - should appear in live results instantly!');
}

async function updateTestScore() {
  const matchesRef = ref(realtimeDb, 'matches');
  const snapshot = await matchesRef.get();
  
  if (snapshot.exists()) {
    const matches = snapshot.val();
    const firstMatchId = Object.keys(matches)[0];
    
    if (firstMatchId) {
      await update(ref(realtimeDb, `matches/${firstMatchId}`), {
        scoreA: Math.floor(Math.random() * 10),
        scoreB: Math.floor(Math.random() * 10),
        status: 'live',
        lastUpdated: Date.now(),
        startTime: Date.now()
      });
      console.log('✅ Updated test match score - should appear in live results instantly!');
    }
  }
}

async function completeTestMatch() {
  const matchesRef = ref(realtimeDb, 'matches');
  const snapshot = await matchesRef.get();
  
  if (snapshot.exists()) {
    const matches = snapshot.val();
    const firstMatchId = Object.keys(matches)[0];
    
    if (firstMatchId) {
      await update(ref(realtimeDb, `matches/${firstMatchId}`), {
        status: 'completed',
        endTime: Date.now(),
        lastUpdated: Date.now(),
        adminNotes: 'Match completed - final scores recorded'
      });
      console.log('✅ Completed test match - should show as completed in live results!');
    }
  }
}
