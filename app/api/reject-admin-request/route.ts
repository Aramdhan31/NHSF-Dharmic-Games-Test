import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, email } = body;

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Request ID is required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Mark request as rejected and schedule deletion in 5 minutes
    const deletionTime = Date.now() + (5 * 60 * 1000); // 5 minutes from now

    // Update the request status to rejected and set deletion time
    await adminDb.collection('adminAccessRequests').doc(requestId).update({
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      scheduledDeletionAt: deletionTime
    });

    // Schedule deletion after 5 minutes
    // Note: In a production environment, you might want to use a Cloud Function or scheduled task
    // For now, we'll use setTimeout which works for server-side API routes
    setTimeout(async () => {
      try {
        await adminDb.collection('adminAccessRequests').doc(requestId).delete();
        console.log(`✅ Deleted rejected admin request: ${requestId}`);
      } catch (error) {
        console.error(`❌ Error deleting rejected request ${requestId}:`, error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log(`✅ Admin request ${requestId} marked as rejected. Will be deleted in 5 minutes.`);

    return NextResponse.json({
      success: true,
      message: 'Admin request rejected. It will be removed in 5 minutes.'
    });
  } catch (error: any) {
    console.error('❌ Error rejecting admin request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject admin request',
        details: error.message
      },
      { status: 500 }
    );
  }
}

