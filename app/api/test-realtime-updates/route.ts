import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, set, update } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing real-time updates across the entire website...');
    
    const { action } = await request.json();
    
    switch (action) {
      case 'add-university':
        await addTestUniversity();
        break;
      case 'update-university':
        await updateTestUniversity();
        break;
      case 'add-player':
        await addTestPlayer();
        break;
      case 'update-score':
        await updateTestScore();
        break;
      case 'toggle-competing':
        await toggleCompetingStatus();
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Real-time update test completed: ${action}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error testing real-time updates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test real-time updates',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function addTestUniversity() {
  const universityId = `test-uni-${Date.now()}`;
  const universityData = {
    id: universityId,
    name: `Test University ${Date.now()}`,
    zone: 'NZ+CZ',
    region: 'NZ+CZ',
    sports: ['Kho Kho', 'Badminton'],
    members: 10,
    wins: 0,
    losses: 0,
    points: 0,
    description: 'Test University for real-time updates',
    tournamentDate: 'Nov 22, 2025',
    isCompeting: true,
    status: 'competing',
    email: 'test@university.com',
    contactPerson: 'Test Contact',
    createdAt: new Date().toISOString()
  };
  
  await set(ref(realtimeDb, `universities/${universityId}`), universityData);
  console.log('✅ Added test university - should appear on teams page and league table instantly!');
}

async function updateTestUniversity() {
  const universitiesRef = ref(realtimeDb, 'universities');
  const snapshot = await universitiesRef.get();
  
  if (snapshot.exists()) {
    const universities = snapshot.val();
    const firstUniId = Object.keys(universities)[0];
    
    if (firstUniId) {
      await update(ref(realtimeDb, `universities/${firstUniId}`), {
        wins: Math.floor(Math.random() * 5),
        losses: Math.floor(Math.random() * 3),
        points: Math.floor(Math.random() * 15),
        lastUpdated: Date.now()
      });
      console.log('✅ Updated university stats - should reflect on league table and stats instantly!');
    }
  }
}

async function addTestPlayer() {
  const playerId = `test-player-${Date.now()}`;
  const playerData = {
    id: playerId,
    firstName: 'Test',
    lastName: 'Player',
    email: 'testplayer@university.com',
    sport: 'Kho Kho',
    universityId: 'test-uni-1',
    universityName: 'Test University',
    sportId: 'kho-kho',
    teamId: 'team-1',
    path: 'universities/test-uni-1/sports/kho-kho/teams/team-1/players/test-player-1',
    createdAt: Date.now()
  };
  
  await set(ref(realtimeDb, `players/${playerId}`), playerData);
  console.log('✅ Added test player - should appear in admin dashboard and stats instantly!');
}

async function updateTestScore() {
  const matchId = `test-match-${Date.now()}`;
  const matchData = {
    id: matchId,
    teamA: 'Test University A',
    teamB: 'Test University B',
    scoreA: Math.floor(Math.random() * 10),
    scoreB: Math.floor(Math.random() * 10),
    status: 'completed',
    sport: 'Kho Kho',
    zone: 'NZ+CZ',
    createdAt: Date.now()
  };
  
  await set(ref(realtimeDb, `matches/${matchId}`), matchData);
  console.log('✅ Added test match - should appear in live scores and league table instantly!');
}

async function toggleCompetingStatus() {
  const universitiesRef = ref(realtimeDb, 'universities');
  const snapshot = await universitiesRef.get();
  
  if (snapshot.exists()) {
    const universities = snapshot.val();
    const firstUniId = Object.keys(universities)[0];
    
    if (firstUniId) {
      const currentStatus = universities[firstUniId].isCompeting;
      await update(ref(realtimeDb, `universities/${firstUniId}`), {
        isCompeting: !currentStatus,
        status: !currentStatus ? 'competing' : 'not-competing',
        lastUpdated: Date.now()
      });
      console.log(`✅ Toggled university competing status - should update teams page and league table instantly!`);
    }
  }
}
