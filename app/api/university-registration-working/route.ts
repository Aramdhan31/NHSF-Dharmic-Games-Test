import { NextRequest, NextResponse } from 'next/server'
import { realtimeDb } from '@/lib/firebase'
import { ref, push, set, get } from 'firebase/database'
import { sendEmail } from '@/lib/sendEmail'

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Realtime Database is available
    if (!realtimeDb) {
      console.error('❌ Firebase Realtime Database not initialized')
      return NextResponse.json(
        { error: 'Database not available. Please try again later.' },
        { status: 503 }
      )
    }

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

    // Check if university with this email already exists in Realtime Database
    const universitiesRef = ref(realtimeDb, 'universities')
    const snapshot = await get(universitiesRef)
    
    if (snapshot.exists()) {
      const data = snapshot.val()
      const existingUni = Object.values(data).find((uni: any) => uni.email === contactEmail)
      if (existingUni) {
        return NextResponse.json(
          { error: 'A university with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Create university data
    const universityData = {
      name: universityName,
      email: contactEmail,
      contactPerson,
      contactRole,
      zone,
      password, // Store password directly for now
      approved: true,
      status: 'active',
      isCompeting: false,
      competingStatus: 'inactive',
      sports: [],
      players: {},
      checkedIn: false,
      checkInTime: null,
      createdBy: 'system', // Add createdBy field for Firebase rules
      createdAt: Date.now(),
      lastUpdated: Date.now()
    }

    // Add to Firebase Realtime Database
    const newUniversityRef = push(universitiesRef)
    await set(newUniversityRef, universityData)
    
    console.log('✅ University registered successfully:', newUniversityRef.key)

    // Send email notification to Super Admin
    try {
      await sendEmail(
        'arjun.ramdhan.nhsf@gmail.com',
        `🎓 New University Registered: ${universityName}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎓 New University Registration</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">NHSF Dharmic Games</p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e293b; margin-top: 0;">University Details</h2>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #f97316;">
                <p style="margin: 0 0 8px 0;"><strong>🏫 University Name:</strong> ${universityName}</p>
                <p style="margin: 0 0 8px 0;"><strong>👤 Contact Person:</strong> ${contactPerson}</p>
                <p style="margin: 0 0 8px 0;"><strong>📧 Contact Email:</strong> ${contactEmail}</p>
                <p style="margin: 0 0 8px 0;"><strong>👔 Role:</strong> ${contactRole}</p>
                <p style="margin: 0 0 8px 0;"><strong>🌍 Zone:</strong> ${zone}</p>
                <p style="margin: 0 0 8px 0;"><strong>📅 Registered:</strong> ${new Date().toLocaleString()}</p>
                <p style="margin: 0 0 8px 0;"><strong>🆔 University ID:</strong> ${docRef.id}</p>
              </div>
              
              <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px;">
                <h3 style="color: #047857; margin-top: 0;">✅ Registration Status</h3>
                <p style="color: #047857; margin: 0;">This university has been automatically approved and can now login to the system.</p>
              </div>
            </div>
            
            <div style="background: #1e293b; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">NHSF Dharmic Games Admin System</p>
              <p style="margin: 5px 0 0 0; opacity: 0.7;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        `
      )
      console.log('📧 University registration email sent successfully')
    } catch (emailError) {
      console.error('❌ Failed to send university registration email:', emailError)
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'University registered successfully! You can now login.',
      universityId: newUniversityRef.key,
      universityName,
      email: contactEmail
    })

  } catch (error: any) {
    console.error('❌ University registration error:', error)
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    
    return NextResponse.json(
      { 
        error: 'Registration failed. Please try again.',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
