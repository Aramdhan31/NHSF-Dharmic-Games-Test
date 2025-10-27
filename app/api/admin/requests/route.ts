import { NextRequest, NextResponse } from 'next/server'
import { realtimeDb } from '@/lib/firebase'
import { ref, get } from 'firebase/database'

export async function GET(request: NextRequest) {
  try {
    // TODO: Add proper admin authentication check
    // For now, we'll allow access to anyone authenticated
    
    const adminRequestsRef = ref(realtimeDb, 'adminRequests')
    const snapshot = await get(adminRequestsRef)
    
    if (!snapshot.exists()) {
      return NextResponse.json({ requests: [] })
    }
    
    const data = snapshot.val()
    const requests = Object.entries(data).map(([id, value]: [string, any]) => ({
      id,
      ...value
    }))
    
    // Sort by timestamp, newest first
    requests.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    
    return NextResponse.json({ requests })
    
  } catch (error: any) {
    console.error('❌ Error fetching admin requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin requests', details: error.message },
      { status: 500 }
    )
  }
}
