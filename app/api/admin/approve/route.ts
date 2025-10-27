import { NextRequest, NextResponse } from 'next/server'
import { realtimeDb } from '@/lib/firebase'
import { ref, update, remove } from 'firebase/database'
import { sendEmail } from '@/lib/sendEmail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, adminEmail, adminName } = body
    
    if (!requestId || !adminEmail || !adminName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // TODO: Add proper superadmin authentication check
    // For now, we'll allow access to anyone authenticated
    
    // 1. Update request status to approved
    const requestRef = ref(realtimeDb, `adminRequests/${requestId}`)
    await update(requestRef, { 
      status: 'approved',
      approvedAt: Date.now(),
      approvedBy: 'superadmin' // TODO: Get actual admin user
    })
    
    // 2. Add to admins collection
    const adminsRef = ref(realtimeDb, `admins/${adminEmail.replace(/\./g, '_')}`)
    await update(adminsRef, {
      email: adminEmail,
      name: adminName,
      role: 'admin',
      approvedAt: Date.now(),
      approvedBy: 'superadmin' // TODO: Get actual admin user
    })
    
    // 3. Send approval email to requester
    try {
      await sendEmail(
        adminEmail,
        '✅ Admin Access Approved - NHSF Dharmic Games',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">✅ Admin Access Approved</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">NHSF Dharmic Games</p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e293b; margin-top: 0;">Congratulations!</h2>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 8px 0;"><strong>👤 Name:</strong> ${adminName}</p>
                <p style="margin: 0 0 8px 0;"><strong>📧 Email:</strong> ${adminEmail}</p>
                <p style="margin: 0 0 8px 0;"><strong>🆔 Request ID:</strong> ${requestId}</p>
                <p style="margin: 0 0 8px 0;"><strong>📅 Approved:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <h3 style="color: #047857; margin-top: 0;">🎉 You now have admin access!</h3>
                <p style="color: #047857; margin: 0 0 10px 0;">You can now:</p>
                <ul style="color: #047857; margin: 0; padding-left: 20px;">
                  <li>View and edit all university data</li>
                  <li>Manage player registrations</li>
                  <li>Check in universities on event day</li>
                  <li>Access the admin dashboard</li>
                </ul>
              </div>
              
              <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px;">
                <h3 style="color: #92400e; margin-top: 0;">🔗 Next Steps</h3>
                <p style="color: #92400e; margin: 0 0 10px 0;">Access your admin dashboard:</p>
                <a href="https://nhsf-dharmic-games.vercel.app/admin" 
                   style="display: inline-block; background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  🚀 Go to Admin Dashboard
                </a>
              </div>
            </div>
            
            <div style="background: #1e293b; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">NHSF Dharmic Games Admin System</p>
              <p style="margin: 5px 0 0 0; opacity: 0.7;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        `
      )
      console.log('📧 Approval email sent successfully')
    } catch (emailError) {
      console.error('❌ Failed to send approval email:', emailError)
      // Don't fail the approval if email fails
    }
    
    console.log('✅ Admin request approved:', { requestId, adminEmail, adminName })
    
    return NextResponse.json({
      success: true,
      message: 'Admin access approved successfully',
      requestId,
      adminEmail
    })
    
  } catch (error: any) {
    console.error('❌ Error approving admin request:', error)
    return NextResponse.json(
      { error: 'Failed to approve admin request', details: error.message },
      { status: 500 }
    )
  }
}
