import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'

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

    // Create Firebase Auth user
    console.log('🔥 Creating Firebase Auth user for:', contactEmail)
    const userCredential = await createUserWithEmailAndPassword(auth, contactEmail, password)
    const user = userCredential.user
    
    console.log('✅ Firebase Auth user created:', user.uid)

    // Create university document in Firestore
    const universityData = {
      id: user.uid,
      name: universityName,
      email: contactEmail,
      contactPerson,
      contactRole,
      zone,
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
      universityId: user.uid,
      universityName,
      email: contactEmail
    })

  } catch (error: any) {
    console.error('❌ University registration error:', error)
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak. Please choose a stronger password.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
