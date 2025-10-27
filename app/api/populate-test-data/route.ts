import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Populating Firebase with test data...');
    
    // Sample universities data
    const testUniversities = {
      'uni-1': {
        id: 'uni-1',
        name: 'University of Manchester',
        zone: 'NZ+CZ',
        region: 'NZ+CZ',
        sports: ['Kho Kho', 'Badminton'],
        members: 12,
        wins: 3,
        losses: 1,
        points: 9,
        description: 'Manchester Hindu Society - Active in multiple sports',
        tournamentDate: 'Nov 22, 2025',
        isCompeting: true,
        status: 'competing',
        email: 'manchester@nhsf.org.uk',
        contactPerson: 'John Smith',
        createdAt: new Date().toISOString()
      },
      'uni-2': {
        id: 'uni-2',
        name: 'Imperial College London',
        zone: 'LZ+SZ',
        region: 'LZ+SZ',
        sports: ['Netball', 'Kabaddi'],
        members: 8,
        wins: 2,
        losses: 2,
        points: 6,
        description: 'Imperial Hindu Society - Strong in team sports',
        tournamentDate: 'Nov 23, 2025',
        isCompeting: true,
        status: 'competing',
        email: 'imperial@nhsf.org.uk',
        contactPerson: 'Sarah Johnson',
        createdAt: new Date().toISOString()
      },
      'uni-3': {
        id: 'uni-3',
        name: 'University of Leeds',
        zone: 'NZ+CZ',
        region: 'NZ+CZ',
        sports: ['Football'],
        members: 15,
        wins: 1,
        losses: 3,
        points: 3,
        description: 'Leeds Hindu Society - Football focused',
        tournamentDate: 'Nov 22, 2025',
        isCompeting: false,
        status: 'not-competing',
        email: 'leeds@nhsf.org.uk',
        contactPerson: 'Mike Wilson',
        createdAt: new Date().toISOString()
      }
    };
    
    // Save to Firebase
    const universitiesRef = ref(realtimeDb, 'universities');
    await set(universitiesRef, testUniversities);
    
    console.log('✅ Test data populated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Test data populated successfully',
      universities: Object.keys(testUniversities).length
    });
    
  } catch (error: any) {
    console.error('❌ Error populating test data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to populate test data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
