import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { collection, doc, updateDoc, serverTimestamp, query, where, getDocs, addDoc } from 'firebase/firestore'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { requestId, name, email, username, zone, contactPerson, contactRole } = await request.json()

    if (!requestId || !name || !email || !username || !zone || !contactPerson || !contactRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the request data to get the password
    const requestSnapshot = await getDocs(query(collection(db, 'universityRequests'), where('__name__', '==', requestId)))
    
    if (requestSnapshot.empty) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }
    
    const requestData = requestSnapshot.docs[0].data()
    const password = requestData.password

    // Create Firebase Auth user (like admin approval)
    const userRecord = await adminDb.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: true
    })

    console.log('Firebase Auth user created:', userRecord.uid)

    // Create university document in universities collection
    const universitiesRef = collection(db, 'universities')
    await addDoc(universitiesRef, {
      uid: userRecord.uid,
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      zone,
      contactPerson,
      contactRole,
      approved: true,
      status: 'active',
      signupDate: new Date().toISOString(),
    })

    // Update the request status
    const requestRef = doc(db, 'universityRequests', requestId)
    await updateDoc(requestRef, {
      status: 'approved',
      reviewed: true,
      reviewedDate: serverTimestamp()
    })

    // Send approval email (no password needed - they already have their account)
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nhsf-dharmic-games.vercel.app'}/api/send-university-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          username,
          zone
        }),
      })

      if (emailResponse.ok) {
        console.log('Approval email sent successfully')
      } else {
        console.error('Failed to send approval email')
      }
    } catch (emailError) {
      console.error('Error sending approval email:', emailError)
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'University approved successfully'
    })

  } catch (error: any) {
    console.error('University approval error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to approve university',
        details: error.message
      },
      { status: 500 }
    )
  }
}
