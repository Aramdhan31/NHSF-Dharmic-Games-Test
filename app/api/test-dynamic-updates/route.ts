import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, set, update } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing dynamic website updates...');
    
    const { action } = await request.json();
    
    switch (action) {
      case 'university-change':
        await testUniversityChange();
        break;
      case 'player-change':
        await testPlayerChange();
        break;
      case 'match-change':
        await testMatchChange();
        break;
      case 'score-change':
        await testScoreChange();
        break;
      case 'admin-change':
        await testAdminChange();
        break;
      case 'cascade-update':
        await testCascadeUpdate();
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Dynamic update test completed: ${action}`,
      timestamp: new Date().toISOString(),
      note: 'Check all pages - they should update automatically!'
    });
    
  } catch (error: any) {
    console.error('❌ Error testing dynamic updates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test dynamic updates',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function testUniversityChange() {
  console.log('🏛️ Testing university change - should update teams page, league table, stats...');
  
  const universityId = `test-uni-${Date.now()}`;
  const universityData = {
    id: universityId,
    name: `Dynamic Test University ${Date.now()}`,
    zone: 'NZ+CZ',
    region: 'NZ+CZ',
    sports: ['Kho Kho', 'Badminton'],
    members: 15,
    wins: 2,
    losses: 1,
    points: 6,
    description: 'Dynamic test university - changes should appear everywhere!',
    tournamentDate: 'Nov 22, 2025',
    isCompeting: true,
    status: 'competing',
    email: 'dynamic@test.com',
    contactPerson: 'Dynamic Test',
    createdAt: new Date().toISOString(),
    lastUpdated: Date.now()
  };
  
  await set(ref(realtimeDb, `universities/${universityId}`), universityData);
  console.log('✅ University added - should appear on teams page, league table, stats instantly!');
}

async function testPlayerChange() {
  console.log('👥 Testing player change - should update admin dashboard, stats...');
  
  const playerId = `test-player-${Date.now()}`;
  const playerData = {
    id: playerId,
    firstName: 'Dynamic',
    lastName: 'Test Player',
    email: 'dynamic.player@test.com',
    sport: 'Kho Kho',
    universityId: 'test-uni-1',
    universityName: 'Dynamic Test University',
    sportId: 'kho-kho',
    teamId: 'team-1',
    path: 'universities/test-uni-1/sports/kho-kho/teams/team-1/players/test-player-1',
    createdAt: Date.now(),
    lastUpdated: Date.now()
  };
  
  await set(ref(realtimeDb, `players/${playerId}`), playerData);
  console.log('✅ Player added - should appear in admin dashboard, stats instantly!');
}

async function testMatchChange() {
  console.log('🏆 Testing match change - should update live results, league table...');
  
  const matchId = `test-match-${Date.now()}`;
  const matchData = {
    id: matchId,
    teamA: 'Dynamic Team A',
    teamB: 'Dynamic Team B',
    scoreA: 5,
    scoreB: 3,
    sport: 'Kho Kho',
    zone: 'NZ+CZ',
    status: 'live',
    startTime: Date.now(),
    lastUpdated: Date.now(),
    adminNotes: 'Dynamic test match - should appear in live results!'
  };
  
  await set(ref(realtimeDb, `matches/${matchId}`), matchData);
  console.log('✅ Match added - should appear in live results, league table instantly!');
}

async function testScoreChange() {
  console.log('⚡ Testing score change - should update live results, league table...');
  
  const scoreId = `test-score-${Date.now()}`;
  const scoreData = {
    id: scoreId,
    matchId: 'test-match-1',
    teamA: 'Dynamic Team A',
    teamB: 'Dynamic Team B',
    scoreA: 8,
    scoreB: 6,
    sport: 'Kho Kho',
    zone: 'NZ+CZ',
    status: 'completed',
    timestamp: Date.now(),
    lastUpdated: Date.now()
  };
  
  await set(ref(realtimeDb, `scores/${scoreId}`), scoreData);
  console.log('✅ Score updated - should appear in live results, league table instantly!');
}

async function testAdminChange() {
  console.log('👑 Testing admin change - should update admin dashboard, permissions...');
  
  const adminId = `test-admin-${Date.now()}`;
  const adminData = {
    id: adminId,
    email: 'dynamic.admin@test.com',
    role: 'zone_admin',
    zone: 'NZ+CZ',
    permissions: ['manage_matches', 'update_scores', 'view_analytics'],
    createdAt: Date.now(),
    lastUpdated: Date.now()
  };
  
  await set(ref(realtimeDb, `admins/${adminId}`), adminData);
  console.log('✅ Admin added - should appear in admin dashboard instantly!');
}

async function testCascadeUpdate() {
  console.log('🔄 Testing cascade update - one change should update everything...');
  
  // Update university
  const universityId = 'test-uni-1';
  await update(ref(realtimeDb, `universities/${universityId}`), {
    wins: Math.floor(Math.random() * 10),
    losses: Math.floor(Math.random() * 5),
    points: Math.floor(Math.random() * 30),
    lastUpdated: Date.now()
  });
  
  // Update player
  const playerId = 'test-player-1';
  await update(ref(realtimeDb, `players/${playerId}`), {
    status: 'active',
    lastUpdated: Date.now()
  });
  
  // Update match
  const matchId = 'test-match-1';
  await update(ref(realtimeDb, `matches/${matchId}`), {
    scoreA: Math.floor(Math.random() * 15),
    scoreB: Math.floor(Math.random() * 15),
    status: 'live',
    lastUpdated: Date.now()
  });
  
  console.log('✅ Cascade update completed - all changes should propagate everywhere!');
}
