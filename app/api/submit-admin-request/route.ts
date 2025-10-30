import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      zones,
      password
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const selectedZones = Object.values(zones || {}).some((selected: any) => selected);
    if (!selectedZones) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one zone' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Hash password (bcrypt)
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const adminRequest = {
      id: requestId,
      name: fullName,
      email,
      zones: Object.keys(zones).filter((z) => zones[z]),
      status: 'pending',
      passwordHash, // store only hash
      requestedAt: new Date().toISOString(),
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    await adminDb.collection('adminRequests').doc(requestId).set(adminRequest);

    if (process.env.BREVO_API_KEY) {
      try {
        const superadminEmail = process.env.SUPERADMIN_EMAIL || 'arjun.ramdhan.nhsf@gmail.com';
        const emailSubject = `New Admin Access Request - ${fullName}`;
        const emailBody = `
          <h2>New Admin Access Request</h2>
          <p>A new admin access request has been submitted:</p>
          <ul>
            <li><strong>Name:</strong> ${fullName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Requested Zones:</strong> ${adminRequest.zones.join(', ')}</li>
            <li><strong>Requested At:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          <p><strong>Request ID:</strong> ${requestId}</p>
          <hr>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nhsf-dharmic-games.vercel.app'}/superadmin/requests">Review Admin Requests</a></p>
        `;
        await sendEmail(superadminEmail, emailSubject, emailBody);
      } catch {}
    }

    return NextResponse.json({ success: true, requestId });

  } catch (error: any) {
    console.error('❌ Error creating admin request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit admin request', details: error.message },
      { status: 500 }
    );
  }
}