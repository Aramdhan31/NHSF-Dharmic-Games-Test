import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      university,
      email,
      reason,
      zones
    } = body;

    // Validate required fields
    if (!fullName || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if at least one zone is selected
    const selectedZones = Object.values(zones).some(selected => selected);
    if (!selectedZones) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one zone' },
        { status: 400 }
      );
    }

    // Generate unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create admin request data
    const adminRequest = {
      id: requestId,
      name: fullName,
      email,
      university,
      zones: Object.keys(zones).filter(zone => zones[zone]),
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
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
      
      const emailSubject = `New Admin Access Request - ${fullName}${university ? ` (${university})` : ''}`;
      const emailBody = `
        <h2>New Admin Access Request</h2>
        <p>A new admin access request has been submitted:</p>
        
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${fullName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>University:</strong> ${university || 'Not provided'}</li>
          <li><strong>Requested Zones:</strong> ${Object.keys(zones).filter(zone => zones[zone]).join(', ')}</li>
          <li><strong>Requested At:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        
        ${reason ? `
        <h3>Reason for Admin Access:</h3>
        <p>${reason}</p>
        ` : ''}
        
        <p><strong>Request ID:</strong> ${requestId}</p>
        
        <hr>
        <p>Please log in to the superadmin dashboard to review and approve/reject this request.</p>
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