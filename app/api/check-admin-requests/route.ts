import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHECKING ADMIN REQUESTS ===')
    
    if (!db) {
      console.error('Firebase database not initialized')
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      )
    }
    
    // Get all admin requests
    const requestsRef = collection(db, 'adminAccessRequests')
    const querySnapshot = await getDocs(requestsRef)
    
    const requests = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      requests.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        zone: data.zone,
        status: data.status,
        requestedAt: data.requestedAt
      })
    })
    
    console.log('Found', requests.length, 'admin requests')
    
    return NextResponse.json({
      success: true,
      requests: requests,
      count: requests.length
    })
    
  } catch (error: any) {
    console.error('Error checking admin requests:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check admin requests',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { requestId } = await request.json()
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID required' },
        { status: 400 }
      )
    }
    
    // Delete the specific request
    const requestRef = doc(db, 'adminAccessRequests', requestId)
    await deleteDoc(requestRef)
    
    console.log('Deleted admin request:', requestId)
    
    return NextResponse.json({
      success: true,
      message: 'Admin request deleted successfully'
    })
    
  } catch (error: any) {
    console.error('Error deleting admin request:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete admin request',
        details: error.message
      },
      { status: 500 }
    )
  }
}
