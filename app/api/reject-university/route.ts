import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing request ID' },
        { status: 400 }
      )
    }

    // Update the request status to rejected
    const requestRef = doc(db, 'universityRequests', requestId)
    await updateDoc(requestRef, {
      status: 'rejected',
      reviewed: true,
      reviewedDate: serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      message: 'University request rejected successfully'
    })

  } catch (error: any) {
    console.error('University rejection error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reject university request',
        details: error.message
      },
      { status: 500 }
    )
  }
}
