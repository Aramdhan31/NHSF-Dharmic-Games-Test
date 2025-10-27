import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { collection, doc, updateDoc, serverTimestamp, query, where, getDocs, addDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMPLE UNIVERSITY APPROVAL ===')
    
    const { requestId, name, email, username, zone, contactPerson, contactRole } = await request.json()

    if (!requestId || !name || !email || !username || !zone || !contactPerson || !contactRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Approving university:', name, email)

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

    console.log('Found request data, creating university account...')

    // Create university document in universities collection (no Firebase Auth needed)
    const universitiesRef = collection(db, 'universities')
    await addDoc(universitiesRef, {
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: password, // Store password for simple login
      zone,
      contactPerson,
      contactRole,
      approved: true,
      status: 'active',
      signupDate: new Date().toISOString(),
      teams: [], // Empty arrays for teams and sports
      sports: [],
      players: []
    })

    console.log('University account created successfully')

    // Update the request status
    const requestRef = doc(db, 'universityRequests', requestId)
    await updateDoc(requestRef, {
      status: 'approved',
      reviewed: true,
      reviewedDate: serverTimestamp()
    })

    console.log('Request status updated to approved')

    // Send approval email
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
