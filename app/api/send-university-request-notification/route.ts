import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      zone,
      contactPerson,
      sports,
      estimatedPlayers
    } = body

    console.log('Sending university registration notification for:', name)

    // Email configuration
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const ADMIN_EMAIL = 'arjun.ramdhan@nhsf.org.uk'

    if (!RESEND_API_KEY) {
      console.error('Resend API key not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Prepare email content
    const sportsList = Array.isArray(sports) ? sports.join(', ') : 'No sports selected'
    const playerCount = estimatedPlayers || 'Not specified'

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316, #dc2626); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎓 New University Registration Request</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0;">University Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">University Name:</td>
              <td style="padding: 8px 0; color: #6b7280;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Contact Email:</td>
              <td style="padding: 8px 0; color: #6b7280;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Zone:</td>
              <td style="padding: 8px 0; color: #6b7280;">${zone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Contact Person:</td>
              <td style="padding: 8px 0; color: #6b7280;">${contactPerson}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Sports:</td>
              <td style="padding: 8px 0; color: #6b7280;">${sportsList}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Estimated Players:</td>
              <td style="padding: 8px 0; color: #6b7280;">${playerCount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Request Date:</td>
              <td style="padding: 8px 0; color: #6b7280;">${new Date().toLocaleString('en-GB', { 
                timeZone: 'Europe/London',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-weight: bold;">
            ⚠️ Action Required: Please review and approve this university registration request in the admin panel.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin" 
             style="background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Review in Admin Panel
          </a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>This is an automated notification from the NHSF (UK) (UK) Dharmic Games registration system.</p>
        </div>
      </div>
    `

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NHSF (UK) (UK) Dharmic Games <noreply@nhsf-dharmic-games.com>',
        to: [ADMIN_EMAIL],
        subject: `🎓 New University Registration: ${name}`,
        html: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      console.error('Failed to send university registration email:', errorData)
      return NextResponse.json(
        { error: 'Failed to send email notification' },
        { status: 500 }
      )
    }

    const emailResult = await emailResponse.json()
    console.log('University registration email sent successfully:', emailResult.id)

    return NextResponse.json({
      success: true,
      message: 'University registration notification sent successfully',
      emailId: emailResult.id
    })

  } catch (error: any) {
    console.error('Error sending university registration notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
