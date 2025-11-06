import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { getDatabase, ref, push, set } from 'firebase/database'
import { realtimeDb } from '@/lib/firebase'

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

    // If participant, also save to nested structure under university
    if (ticketType === 'participant' && universityId && sport) {
      try {
        // Convert sport name to sportId (e.g., "Kho Kho" -> "kho_kho")
        const sportId = sport.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        const teamId = 'main_team' // Default team for now
        
        // Split fullName into firstName and lastName
        const nameParts = fullName.trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        
        // Create player data for nested structure
        const playerData = {
          firstName,
          lastName,
          email: body.email?.trim() || null,
          phone: body.phone?.trim() || null,
          sport,
          position: 'Player',
          playerId: docRef.id, // Link to member registration
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          checkedIn: false,
          checkInDate: '',
          checkInTime: '',
          idChecked: false, // ID check checkbox
          signedIn: false // Sign-in checkbox
        }
        
        // Save to nested structure: universities/{uniId}/sports/{sportId}/teams/{teamId}/players/{playerId}
        const playersRef = ref(realtimeDb, `universities/${universityId}/sports/${sportId}/teams/${teamId}/players`)
        const newPlayerRef = push(playersRef)
        await set(newPlayerRef, {
          ...playerData,
          playerId: newPlayerRef.key
        })
        
        // Also mirror to global players list for admin dashboard
        const globalPlayersRef = ref(realtimeDb, `players/${newPlayerRef.key}`)
        await set(globalPlayersRef, {
          ...playerData,
          playerId: newPlayerRef.key,
          universityId,
          universityName: university,
          sportId,
          teamId,
          path: `universities/${universityId}/sports/${sportId}/teams/${teamId}/players/${newPlayerRef.key}`
        })
        
        console.log('Player saved to nested structure:', {
          universityId,
          sportId,
          teamId,
          playerId: newPlayerRef.key
        })
      } catch (playerError) {
        console.error('Error saving player to nested structure:', playerError)
        // Don't fail the registration if nested save fails
      }
    }

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
