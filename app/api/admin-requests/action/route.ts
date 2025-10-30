import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/sendEmail';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, action, reviewedBy, reviewNotes, reviewedAt } = body;

    if (!requestId || !action || !reviewedBy) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 });
    }

    const docRef = adminDb.collection('adminRequests').doc(requestId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const request = snap.data() as any;
    if (request.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Request already processed' }, { status: 400 });
    }

    // Update status first
    await docRef.update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy,
      reviewedAt,
      reviewNotes: reviewNotes || '',
      lastUpdated: Date.now(),
    });

    if (action === 'approve' && request.email) {
      const auth = getAuth();

      // If we have a passwordHash (bcrypt), import user so they can sign in immediately
      if (request.passwordHash) {
        try {
          // Delete any existing user with same email to avoid import conflict
          try { const existing = await auth.getUserByEmail(request.email); if (existing?.uid) await auth.deleteUser(existing.uid); } catch {}

          const uid = `admin_${Buffer.from(request.email).toString('hex').slice(0, 24)}`;
          await auth.importUsers([
            {
              uid,
              email: request.email,
              emailVerified: true,
              displayName: request.name || request.email,
              passwordHash: Buffer.from(request.passwordHash),
            }
          ], { hash: { algorithm: 'BCRYPT' } });
        } catch (e) {
          // Fallback: if import fails, leave account creation to a reset link path
        }
      } else {
        // No hash stored; skip
      }

      // Add to admins collection (Firestore)
      await adminDb.collection('admins').doc(request.email).set({
        email: request.email,
        name: request.name || request.email,
        role: 'admin',
        zones: request.zones || [],
        approvedAt: Date.now(),
        approvedBy: reviewedBy,
      }, { merge: true });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Error processing admin request action:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request', details: error.message }, { status: 500 });
  }
}
