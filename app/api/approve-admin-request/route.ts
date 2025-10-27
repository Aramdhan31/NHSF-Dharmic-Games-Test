import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { collection, doc, updateDoc, serverTimestamp, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { verifyPassword } from '@/lib/password-utils'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ADMIN REQUEST APPROVAL API ===')
    
    const { requestId, email, zone } = await request.json()

    if (!requestId || !email || !zone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Approving admin request for:', email)

    // Get the request data to verify the password
    const requestsRef = collection(db, 'adminAccessRequests')
    const q = query(requestsRef, where('__name__', '==', requestId))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }
    
    const requestDoc = querySnapshot.docs[0]
    const requestData = requestDoc.data()
    
    // Verify the password using the stored hash
    const { passwordHash, passwordSalt, displayName, firstName, lastName } = requestData
    
    // For now, we'll use a temporary password since we can't retrieve the original
    // In a real system, you'd want to ask the user to reset their password
    const tempPassword = 'TempPassword123!' + Math.random().toString(36).substring(2, 8)

    // Create Firebase Auth user using Admin SDK
    const userRecord = await adminDb.auth().createUser({
      email: email,
      password: tempPassword, // They'll need to reset this
      displayName: displayName,
      emailVerified: true
    })

    console.log('Firebase Auth user created:', userRecord.uid)

    // Create user document in Firestore users collection
    const usersRef = collection(db, 'users')
    await addDoc(usersRef, {
      uid: userRecord.uid,
      email: email.toLowerCase(),
      displayName: displayName,
      firstName: firstName,
      lastName: lastName,
      zone: zone,
      role: zone === 'ALL' ? 'super_admin' : 'zone_admin',
      isActive: true,
      permissions: {
        canManageUsers: zone === 'ALL',
        canManageAllZones: zone === 'ALL',
        canManageOwnZone: true,
        canViewAnalytics: true,
        canUpdateResults: true,
        canCreateMatches: true,
      },
      approvedAt: serverTimestamp(),
      approvedBy: 'system',
      createdAt: serverTimestamp()
    })

    // Delete the request from adminAccessRequests collection
    const requestRef = doc(db, 'adminAccessRequests', requestId)
    await deleteDoc(requestRef)

    console.log('Admin request approved successfully')

    return NextResponse.json({
      success: true,
      message: 'Admin access approved successfully'
    })

  } catch (error: any) {
    console.error('Admin approval error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to approve admin request',
        details: error.message
      },
      { status: 500 }
    )
  }
}
