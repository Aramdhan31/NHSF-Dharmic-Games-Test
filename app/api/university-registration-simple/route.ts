import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      universityName, 
      contactPerson, 
      contactEmail, 
      contactRole, 
      zone, 
      password 
    } = body

    console.log('🚀 University registration request:', { contactEmail, universityName, zone })

    // Validate required fields
    if (!universityName || !contactEmail || !password || !zone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if university already exists
    const universitiesRef = collection(db, 'universities')
    const q = query(universitiesRef, where('email', '==', contactEmail))
    const existingUniversities = await getDocs(q)
    
    if (!existingUniversities.empty) {
      return NextResponse.json(
        { error: 'University with this email already exists' },
        { status: 400 }
      )
    }

    // Create university document in Firestore (no Firebase Auth)
    const universityData = {
      name: universityName,
      email: contactEmail,
      contactPerson,
      contactRole,
      zone,
      password, // Store password directly (for simple login)
      approved: true,
      status: 'active',
      createdAt: new Date(),
      sports: [],
      players: []
    }

    console.log('💾 Saving university data to Firestore:', universityData)
    const docRef = await addDoc(universitiesRef, universityData)
    
    console.log('✅ University document created with ID:', docRef.id)

    return NextResponse.json({
      success: true,
      message: 'University registered successfully! You can now login.',
      universityId: docRef.id,
      universityName,
      email: contactEmail
    })

  } catch (error: any) {
    console.error('❌ University registration error:', error)
    
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
