import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { name, email, username, zone } = await request.json()

    if (!name || !email || !username || !zone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Only initialize Resend if API key is available
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.warn('Resend API key not configured, skipping email send')
      return NextResponse.json({ 
        success: true, 
        message: 'Approval processed (email not sent - API key not configured)' 
      })
    }

    const resend = new Resend(RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: 'NHSF Dharmic Games <noreply@nhsf-dharmic-games.vercel.app>',
      to: [email],
      subject: '🎉 University Registration Approved - NHSF (UK) Dharmic Games',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">NHSF (UK) Dharmic Games</h1>
            <h2 style="color: #059669; margin: 10px 0;">University Registration Approved!</h2>
          </div>
          
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #0c4a6e; margin-top: 0;">🎉 Congratulations!</h3>
            <p style="margin: 10px 0; color: #0c4a6e;">
              Your university registration for <strong>${name}</strong> has been approved by our admin team.
            </p>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #92400e; margin-top: 0;">🔐 Your Login Information</h3>
            <p style="margin: 10px 0; color: #92400e;">
              <strong>Email:</strong> ${email}<br>
              <strong>Username:</strong> ${username}<br>
              <strong>Password:</strong> Your registered password
            </p>
            <p style="margin: 10px 0; color: #92400e; font-size: 14px;">
              ✅ <strong>Ready to login:</strong> You can now access the full university dashboard!
            </p>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #166534; margin-top: 0;">🚀 Next Steps</h3>
            <ol style="color: #166534; margin: 10px 0; padding-left: 20px;">
              <li>Visit the <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://nhsf-dharmic-games.vercel.app'}/myuni/login" style="color: #2563eb;">University Login Page</a></li>
              <li>Log in with your email and password</li>
              <li>Access the full university dashboard</li>
              <li>Start registering your players and teams</li>
            </ol>
          </div>

          <div style="background: #f8fafc; border: 1px solid #64748b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #334155; margin-top: 0;">📋 University Details</h3>
            <p style="margin: 5px 0; color: #334155;">
              <strong>University:</strong> ${name}<br>
              <strong>Zone:</strong> ${zone}<br>
              <strong>Contact Person:</strong> ${username}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 5px 0;">
              If you have any questions, please contact our admin team.
            </p>
            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
              NHSF (UK) Dharmic Games - Bringing Universities Together Through Sports
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send approval email' },
        { status: 500 }
      )
    }

    console.log('University approval email sent successfully:', data?.id)
    return NextResponse.json({ 
      success: true, 
      message: 'Approval email sent successfully',
      emailId: data?.id 
    })

  } catch (error: any) {
    console.error('University approval email error:', error)
    return NextResponse.json(
      { error: 'Failed to process approval email' },
      { status: 500 }
    )
  }
}
