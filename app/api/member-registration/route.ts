import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      ticketType,
      university,
      sport,
      emergencyContactName,
      emergencyContactNumber,
      disclaimerAccepted,
      universityId
    } = body

    // Validate required fields
    if (!fullName || !ticketType || !emergencyContactName || !emergencyContactNumber || !disclaimerAccepted) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Additional validation for participants
    if (ticketType === 'participant') {
      if (!university || !sport) {
        return NextResponse.json(
          { error: 'University and sport are required for participants' },
          { status: 400 }
        )
      }
    }

    // University ID is only required for university-associated registrations
    // For external registrations (spectators, referees, etc.), it can be null

    // Prepare member data
    const memberData = {
      fullName: fullName.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      ticketType,
      university: ticketType === 'participant' ? university?.trim() : null,
      sport: ticketType === 'participant' ? sport : null,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactNumber: emergencyContactNumber.trim(),
      disclaimerAccepted,
      registrationDate: serverTimestamp(),
      universityId: universityId || null, // null for external registrations
      status: 'registered'
    }

    // Save to Firebase
    const membersRef = collection(db, 'members')
    const docRef = await addDoc(membersRef, memberData)

    console.log('Member registered successfully:', {
      id: docRef.id,
      fullName,
      ticketType,
      universityId
    })

    // Send confirmation email
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-member-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email: body.email,
          ticketType,
          zone: body.zone
        }),
      })

      if (emailResponse.ok) {
        console.log('Member confirmation email sent successfully')
      } else {
        console.error('Failed to send member confirmation email')
      }
    } catch (emailError) {
      console.error('Error sending member confirmation email:', emailError)
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Member registered successfully',
      id: docRef.id
    })

  } catch (error: any) {
    console.error('Member registration error:', error)
    
    return NextResponse.json(
      { error: 'Failed to register member' },
      { status: 500 }
    )
  }
}
