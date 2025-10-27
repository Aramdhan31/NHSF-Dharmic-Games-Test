import { NextRequest, NextResponse } from 'next/server'
import { realtimeDb } from '@/lib/firebase'
import { ref, set } from 'firebase/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up admin user in Firebase Realtime Database...')
    
    // Add you as a superadmin
    const adminRef = ref(realtimeDb, 'admins/arjun-ramdhan')
    await set(adminRef, {
      email: 'arjunramdhan37@outlook.com',
      name: 'Arjun Ramdhan',
      role: 'superadmin',
      permissions: {
        canManageAllZones: true,
        canApproveAdmins: true,
        canManageUniversities: true
      },
      createdAt: Date.now()
    })
    
    console.log('✅ Admin user setup complete!')
    
    return NextResponse.json({
      success: true,
      message: 'Admin user setup complete!',
      admin: {
        email: 'arjunramdhan37@outlook.com',
        name: 'Arjun Ramdhan',
        role: 'superadmin'
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error setting up admin user:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to setup admin user',
        details: error.message
      },
      { status: 500 }
    )
  }
}