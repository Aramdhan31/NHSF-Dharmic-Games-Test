import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      requestId,
      action,
      reviewedBy,
      reviewNotes,
      reviewedAt
    } = body;

    if (!requestId || !action || !reviewedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Load request doc
    const docRef = adminDb.collection('adminRequests').doc(requestId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    const request = docSnap.data() as any;
    if (request.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    // Update request status
    const updated = {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy,
      reviewedAt,
      reviewNotes: reviewNotes || '',
      lastUpdated: Date.now()
    };
    await docRef.update(updated);

    // If approved, add to Firestore admins collection
    if (action === 'approve' && request.email) {
      const adminsRef = adminDb.collection('admins').doc(request.email);
      await adminsRef.set({
        email: request.email,
        name: request.name || request.email,
        role: 'admin',
        zones: request.zones || [],
        approvedAt: Date.now(),
        approvedBy: reviewedBy
      }, { merge: true });
    }

    // Optional email notification
    try {
      if (process.env.BREVO_API_KEY && request.email) {
        const subject = action === 'approve' ? 'Your admin request was approved' : 'Your admin request was rejected';
        const html = `
          <h2>Admin Request ${action === 'approve' ? 'Approved' : 'Rejected'}</h2>
          <p>Hi ${request.name || ''},</p>
          <p>Your request for admin access has been <strong>${action === 'approve' ? 'approved' : 'rejected'}</strong>.</p>
          ${reviewNotes ? `<p><strong>Notes:</strong> ${reviewNotes}</p>` : ''}
        `;
        await sendEmail(request.email, subject, html);
      }
    } catch (e) {
      console.warn('Email notification failed:', e);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Error processing admin request action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
