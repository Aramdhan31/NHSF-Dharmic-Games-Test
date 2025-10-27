import { NextRequest, NextResponse } from 'next/server'

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

    console.log('🚀 Simple fallback university registration:', { contactEmail, universityName, zone })

    // Validate required fields
    if (!universityName || !contactEmail || !password || !zone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For now, just return success without Firebase
    // This will help us test if the API endpoint works
    console.log('✅ Fallback registration data received:', {
      universityName,
      contactPerson,
      contactEmail,
      contactRole,
      zone,
      passwordLength: password.length
    })

    // Generate a mock ID
    const mockId = 'mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)

    return NextResponse.json({
      success: true,
      message: 'University registered successfully! You can now login.',
      universityId: mockId,
      universityName,
      email: contactEmail,
      note: 'This is a fallback registration - data not saved to database'
    })

  } catch (error: any) {
    console.error('❌ Fallback university registration error:', error)
    
    return NextResponse.json(
      { 
        error: 'Registration failed. Please try again.',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
