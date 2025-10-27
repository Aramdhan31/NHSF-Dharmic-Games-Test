import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { requestId, newStatus, email } = await request.json()

    if (!requestId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['pending_approval', 'approved'].includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending_approval or approved' },
        { status: 400 }
      )
    }

    // Update the request status
    const requestRef = doc(db, 'universityRequests', requestId)
    await updateDoc(requestRef, {
      status: newStatus,
      reviewed: newStatus === 'approved',
      reviewedDate: serverTimestamp(),
      decisionChanged: true,
      decisionChangedAt: serverTimestamp()
    })

    // If changing to approved, also update the university record
    if (newStatus === 'approved' && email) {
      try {
        // Find the university record by email
        const universitiesRef = collection(db, 'universities')
        const universityQuery = query(universitiesRef, where('email', '==', email))
        const universitySnapshot = await getDocs(universityQuery)
        
        if (!universitySnapshot.empty) {
          const universityDoc = universitySnapshot.docs[0]
          const universityRef = doc(db, 'universities', universityDoc.id)
          await updateDoc(universityRef, {
            approved: true,
            status: 'approved',
            approvedAt: serverTimestamp(),
            decisionChanged: true
          })
        }
      } catch (universityError) {
        console.error('Error updating university record:', universityError)
        // Don't fail the entire operation if university update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Request status changed to ${newStatus} successfully`
    })

  } catch (error: any) {
    console.error('Change reject decision error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to change decision',
        details: error.message
      },
      { status: 500 }
    )
  }
}
