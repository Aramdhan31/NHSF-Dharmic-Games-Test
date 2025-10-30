import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || ''
    if (!email) return NextResponse.json({ approved: false, pending: false })
    if (!adminDb) return NextResponse.json({ approved: false, pending: false })

    const approvedSnap = await adminDb.collection('admins').doc(email).get()
    if (approvedSnap.exists) return NextResponse.json({ approved: true, pending: false })

    const reqSnap = await adminDb.collection('adminRequests').where('email', '==', email).orderBy('createdAt', 'desc').limit(1).get()
    const pending = !reqSnap.empty && reqSnap.docs[0].data().status === 'pending'
    return NextResponse.json({ approved: false, pending })
  } catch (e: any) {
    return NextResponse.json({ approved: false, pending: false }, { status: 200 })
  }
}
