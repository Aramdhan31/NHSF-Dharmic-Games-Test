import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      university,
      zone,
      role,
      reason,
      experience,
      availability,
      userId,
      userEmail,
      requestedAt
    } = body;

    // Validate required fields
    if (!name || !email || !university || !zone || !role || !reason) {
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

    // Generate unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create admin request data
    const adminRequest = {
      id: requestId,
      name,
      email,
      university,
      zone,
      role,
      reason,
      experience: experience || '',
      availability: availability || '',
      userId: userId || '',
      userEmail: userEmail || email,
      status: 'pending',
      requestedAt: requestedAt || new Date().toISOString(),
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    // Save to Firestore
    await adminDb.collection('adminRequests').doc(requestId).set(adminRequest);

    console.log('✅ Admin request saved (Firestore):', requestId);

    // Send email notification to superadmin (optional)
    try {
      const superadminEmail = process.env.SUPERADMIN_EMAIL || 'arjun.ramdhan.nhsf@gmail.com';
      const emailSubject = `New Admin Access Request - ${name} (${university})`;
      const emailBody = `
        <h2>New Admin Access Request</h2>
        <p>A new admin access request has been submitted:</p>
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>University:</strong> ${university}</li>
          <li><strong>Zone:</strong> ${zone}</li>
          <li><strong>Requested Role:</strong> ${role}</li>
          <li><strong>Requested At:</strong> ${new Date(adminRequest.requestedAt).toLocaleString()}</li>
        </ul>
        ${reason ? `<h3>Reason for Admin Access:</h3><p>${reason}</p>` : ''}
        ${experience ? `<h3>Relevant Experience:</h3><p>${experience}</p>` : ''}
        ${availability ? `<h3>Availability:</h3><p>${availability}</p>` : ''}
        <p><strong>Request ID:</strong> ${requestId}</p>
        <hr>
        <p>Please log in to the admin dashboard to review and approve/reject this request.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nhsf-dharmic-games.vercel.app'}/superadmin/requests">Review Admin Requests</a></p>
      `;

      if (process.env.BREVO_API_KEY) {
        await sendEmail(superadminEmail, emailSubject, emailBody);
        console.log('✅ Email notification sent to superadmin');
      } else {
        console.log('📧 Email service not configured - skipping email notification');
      }
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Admin request submitted successfully',
      requestId
    });

  } catch (error: any) {
    console.error('❌ Error creating admin request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit admin request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    const snapshot = await adminDb.collection('adminRequests').get();

    const requestsRaw = snapshot.docs.map((doc) => doc.data());
    let requests = requestsRaw as any[];

    if (status !== 'all') {
      requests = requests.filter((r: any) => r.status === status);
    }

    requests.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({ success: true, requests });

  } catch (error: any) {
    console.error('❌ Error fetching admin requests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch admin requests',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
