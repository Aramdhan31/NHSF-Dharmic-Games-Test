import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing type or data' },
        { status: 400 }
      )
    }

    // Validate required fields based on type
    if (type === 'player') {
      const { name, studentId, email, university, sports } = data
      if (!name || !studentId || !email || !university || !sports || sports.length === 0) {
        return NextResponse.json(
          { error: 'Missing required player fields' },
          { status: 400 }
        )
      }
    } else if (type === 'university') {
      const { name, email, contactPerson, sports } = data
      if (!name || !email || !contactPerson || !sports || sports.length === 0) {
        return NextResponse.json(
          { error: 'Missing required university fields' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid registration type' },
        { status: 400 }
      )
    }

    // Prepare check-in data
    const checkInData = {
      ...data,
      type: type === 'player' ? 'player_check_in' : 'university_full_house',
      checkInDate: serverTimestamp(),
      checkedInBy: 'admin', // Could be enhanced to track which admin checked in
      status: type === 'player' ? 'checked_in' : 'full_house',
      onDayCheckIn: true
    }

    // Save to Firebase
    let collectionName = ''
    if (type === 'player') {
      collectionName = 'onDayPlayers'
    } else if (type === 'university') {
      collectionName = 'onDayUniversities'
    }

    const docRef = await addDoc(collection(db, collectionName), checkInData)

    console.log(`${type} checked in on-the-day:`, {
      id: docRef.id,
      name: data.name,
      type
    })

    return NextResponse.json({
      success: true,
      message: type === 'player' ? 'Player checked in successfully' : 'Team marked as full house successfully',
      id: docRef.id
    })

  } catch (error: any) {
    console.error('On-the-day check-in error:', error)
    
    return NextResponse.json(
      { error: 'Failed to process on-the-day check-in' },
      { status: 500 }
    )
  }
}
