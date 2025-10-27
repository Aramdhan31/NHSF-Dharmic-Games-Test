import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, push, set, get } from 'firebase/database';
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
      userId,
      userEmail,
      status: 'pending',
      requestedAt,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    // Save to Firebase Realtime Database
    const requestsRef = ref(realtimeDb, 'adminRequests');
    const newRequestRef = push(requestsRef);
    await set(newRequestRef, adminRequest);

    console.log('✅ Admin request saved:', requestId);

    // Send email notification to superadmin
    try {
      const superadminEmail = process.env.SUPERADMIN_EMAIL || 'admin@nhsf-dharmic-games.com';
      
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
          <li><strong>Requested At:</strong> ${new Date(requestedAt).toLocaleString()}</li>
        </ul>
        
        <h3>Reason for Admin Access:</h3>
        <p>${reason}</p>
        
        ${experience ? `
        <h3>Relevant Experience:</h3>
        <p>${experience}</p>
        ` : ''}
        
        ${availability ? `
        <h3>Availability:</h3>
        <p>${availability}</p>
        ` : ''}
        
        <p><strong>Request ID:</strong> ${requestId}</p>
        
        <hr>
        <p>Please log in to the admin dashboard to review and approve/reject this request.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/superadmin/requests">Review Admin Requests</a></p>
      `;

      await sendEmail({
        to: superadminEmail,
        subject: emailSubject,
        html: emailBody
      });

      console.log('✅ Email notification sent to superadmin');
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Get all admin requests from Firebase
    const requestsRef = ref(realtimeDb, 'adminRequests');
    const snapshot = await get(requestsRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json({
        success: true,
        requests: []
      });
    }

    const data = snapshot.val();
    let requests = Object.values(data).map((request: any) => ({
      ...request,
      id: request.id || Object.keys(data).find(key => data[key] === request)
    }));

    // Filter by status if specified
    if (status !== 'all') {
      requests = requests.filter((request: any) => request.status === status);
    }

    // Sort by creation date (newest first)
    requests.sort((a: any, b: any) => b.createdAt - a.createdAt);

    return NextResponse.json({
      success: true,
      requests
    });

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
