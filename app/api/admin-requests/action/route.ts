import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, get, update, set } from 'firebase/database';
import { sendEmail } from '@/lib/sendEmail';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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

    // Validate required fields
    if (!requestId || !action || !reviewedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the request from database
    const requestsRef = ref(realtimeDb, 'adminRequests');
    const snapshot = await get(requestsRef);
    
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: 'No requests found' },
        { status: 404 }
      );
    }

    const data = snapshot.val();
    const requestKey: string | undefined = Object.keys(data).find(key => data[key].id === requestId);
    
    if (!requestKey) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    const request: any = data[requestKey];
    
    if (request.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    // Update request status
    const updatedRequest = {
      ...request,
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy,
      reviewedAt,
      reviewNotes: reviewNotes || '',
      lastUpdated: Date.now()
    };

    // Update in database
    const requestRef = ref(realtimeDb, `adminRequests/${requestKey}`);
    await update(requestRef, updatedRequest);

    // If approved, create Firebase Auth account and admin record
    if (action === 'approve') {
      try {
        // Generate a temporary password for the admin
        const tempPassword = `Admin${Math.random().toString(36).substring(2, 8)}!`;
        
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, request.email, tempPassword);
        const user = userCredential.user;
        
        // Update user profile
        await updateProfile(user, {
          displayName: request.name
        });

        // Create admin record in Realtime Database
        const adminData = {
          uid: user.uid,
          email: request.email,
          name: request.name,
          university: request.university,
          zone: request.zone,
          role: request.role,
          status: 'active',
          permissions: {
            canManageUsers: request.role === 'super-admin',
            canManageAllZones: request.role === 'super-admin',
            canManageOwnZone: true,
            canViewAnalytics: true,
            canUpdateResults: true,
            canCreateMatches: true,
            canManageUniversities: request.role === 'super-admin' || request.role === 'zone-admin'
          },
          approvedAt: Date.now(),
          approvedBy: reviewedBy,
          createdAt: Date.now()
        };

        // Save admin to admins collection
        const adminsRef = ref(realtimeDb, `admins/${user.uid}`);
        await set(adminsRef, adminData);

        console.log(`✅ Admin account created for:`, request.email);
        
        // Update the email body to include login credentials
        const emailBody = `
          <h2>Admin Access Request Approved</h2>
          
          <p>Dear ${request.name},</p>
          
          <p>Congratulations! Your admin access request has been <strong>approved</strong>.</p>
          
          <p>You now have admin access to the NHSF Dharmic Games system.</p>
          
          <h3>Login Credentials:</h3>
          <ul>
            <li><strong>Email:</strong> ${request.email}</li>
            <li><strong>Temporary Password:</strong> ${tempPassword}</li>
          </ul>
          
          <p><strong>Important:</strong> Please change your password after your first login for security reasons.</p>
          
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin">Access Admin Dashboard</a></p>
          
          <h3>Request Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${request.name}</li>
            <li><strong>University:</strong> ${request.university}</li>
            <li><strong>Zone:</strong> ${request.zone}</li>
            <li><strong>Role:</strong> ${request.role}</li>
            <li><strong>Requested At:</strong> ${new Date(request.requestedAt).toLocaleString()}</li>
            <li><strong>Approved At:</strong> ${new Date(reviewedAt).toLocaleString()}</li>
            <li><strong>Approved By:</strong> ${reviewedBy}</li>
          </ul>
          
          ${reviewNotes ? `
          <h3>Review Notes:</h3>
          <p>${reviewNotes}</p>
          ` : ''}
          
          <hr>
          <p>Thank you for your interest in the NHSF Dharmic Games!</p>
        `;

        // Send approval email with credentials
        await sendEmail(
          request.email,
          'Admin Access Approved - NHSF Dharmic Games',
          emailBody
        );

      } catch (authError: any) {
        console.error('❌ Failed to create admin account:', authError);
        // Revert the request status
        await update(requestRef, {
          ...request,
          status: 'pending',
          lastUpdated: Date.now()
        });
        
        return NextResponse.json({
          success: false,
          error: 'Failed to create admin account',
          details: authError.message
        }, { status: 500 });
      }
    } else {
      // For rejected requests, send rejection email
      const emailBody = `
        <h2>Admin Access Request Rejected</h2>
        
        <p>Dear ${request.name},</p>
        
        <p>Unfortunately, your request for admin access has been rejected.</p>
        
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${request.name}</li>
          <li><strong>University:</strong> ${request.university}</li>
          <li><strong>Zone:</strong> ${request.zone}</li>
          <li><strong>Requested Role:</strong> ${request.role}</li>
          <li><strong>Requested At:</strong> ${new Date(request.requestedAt).toLocaleString()}</li>
          <li><strong>Reviewed At:</strong> ${new Date(reviewedAt).toLocaleString()}</li>
          <li><strong>Reviewed By:</strong> ${reviewedBy}</li>
        </ul>
        
        ${reviewNotes ? `
        <h3>Review Notes:</h3>
        <p>${reviewNotes}</p>
        ` : ''}
        
        <p>If you believe this is an error or would like to discuss further, please contact the tournament organizers.</p>
        
        <hr>
        <p>Thank you for your interest in the NHSF Dharmic Games!</p>
      `;

      await sendEmail(
        request.email,
        'Admin Access Request Rejected - NHSF Dharmic Games',
        emailBody
      );
    }

    console.log(`✅ Request ${action}d:`, requestId);

    return NextResponse.json({
      success: true,
      message: `Request ${action}d successfully`,
      request: updatedRequest
    });

  } catch (error: any) {
    console.error('❌ Error processing admin request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process admin request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
