import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing request ID' },
        { status: 400 }
      )
    }

    // Delete the request from universityRequests collection
    const requestRef = doc(db, 'universityRequests', requestId)
    await deleteDoc(requestRef)

    // Also delete any associated university record
    const universitiesRef = collection(db, 'universities')
    const q = query(universitiesRef, where('requestId', '==', requestId))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const universityDoc = querySnapshot.docs[0]
      const universityRef = doc(db, 'universities', universityDoc.id)
      await deleteDoc(universityRef)
    }

    // If there's a university record with the same email, delete it too
    const emailQuery = query(universitiesRef, where('email', '==', requestId))
    const emailSnapshot = await getDocs(emailQuery)
    
    if (!emailSnapshot.empty) {
      for (const docSnapshot of emailSnapshot.docs) {
        const universityRef = doc(db, 'universities', docSnapshot.id)
        await deleteDoc(universityRef)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'University request and associated data deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete university request error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete request',
        details: error.message
      },
      { status: 500 }
    )
  }
}
