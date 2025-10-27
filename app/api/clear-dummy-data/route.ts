import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting dummy data cleanup...');
    
    // Get all matches
    const matchesRef = ref(realtimeDb, 'matches');
    const snapshot = await get(matchesRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json({
        success: true,
        message: 'No matches found in database',
        deletedCount: 0
      });
    }
    
    const matches = snapshot.val();
    const matchKeys = Object.keys(matches);
    console.log(`📊 Found ${matchKeys.length} matches in database`);
    
    // Find and delete dummy matches
    const dummyMatches = [];
    
    for (const key of matchKeys) {
      const match = matches[key];
      
      // Check if this looks like dummy data
      if (
        match.sport === 'Football' && 
        (!match.team1 || !match.team2 || 
         match.team1 === 'Team 1' || match.team2 === 'Team 2' ||
         match.team1 === 'VS' || match.team2 === 'VS' ||
         match.team1 === '' || match.team2 === '')
      ) {
        dummyMatches.push(key);
      }
    }
    
    if (dummyMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No dummy matches found',
        deletedCount: 0
      });
    }
    
    console.log(`🗑️ Found ${dummyMatches.length} dummy matches to delete`);
    
    // Delete dummy matches
    for (const key of dummyMatches) {
      const matchRef = ref(realtimeDb, `matches/${key}`);
      await remove(matchRef);
      console.log(`✅ Deleted dummy match: ${key}`);
    }
    
    console.log('🎉 Dummy data cleanup completed!');
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${dummyMatches.length} dummy matches`,
      deletedCount: dummyMatches.length
    });
    
  } catch (error: any) {
    console.error('❌ Error clearing dummy data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear dummy data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
