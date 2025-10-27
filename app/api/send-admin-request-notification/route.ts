import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, displayName, firstName, lastName, zone, requestedAt } = body

    // Email configuration
    const ADMIN_EMAIL = 'arjun.ramdhan@nhsf.org.uk'
    
    // Zone display names
    const zoneNames: Record<string, string> = {
      'ALL': 'All Zones (Multi-Zone Access)',
      'NZ+CZ': 'North & Central Zone (Nov 22)',
      'LZ+SZ': 'London & South Zone (Nov 23)',
    }
    
    const zoneName = zoneNames[zone] || zone
    
    // Prepare email content
    const emailSubject = `🔔 New Admin Access Request from ${displayName}`
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <div style="background-color: #ea580c; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🛡️ NHSF (UK) Admin Access Request</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ Action Required: New admin access request pending your review</p>
          </div>

          <h2 style="color: #1f2937; margin-bottom: 20px;">Request Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">Name:</td>
              <td style="padding: 12px 0; color: #1f2937;">${displayName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">Email:</td>
              <td style="padding: 12px 0; color: #1f2937;">${email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">Requested Zone:</td>
              <td style="padding: 12px 0; color: #1f2937;">${zoneName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">First Name:</td>
              <td style="padding: 12px 0; color: #1f2937;">${firstName || 'Not provided'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">Last Name:</td>
              <td style="padding: 12px 0; color: #1f2937;">${lastName || 'Not provided'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-weight: bold; color: #4b5563;">Requested At:</td>
              <td style="padding: 12px 0; color: #1f2937;">${new Date().toLocaleString('en-GB', { 
                timeZone: 'Europe/London',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/access-requests" 
               style="display: inline-block; background-color: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Review Request Now
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p>This is an automated notification from NHSF (UK) (UK) Dharmic Games Admin System</p>
            <p style="margin: 5px 0;">Please log in to your admin dashboard to approve or reject this request</p>
          </div>
        </div>
      </div>
    `

    // Try to send via Resend if configured
    if (process.env.RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'NHSF (UK) Admin System <onboarding@resend.dev>', // Change this to your verified domain
          to: [ADMIN_EMAIL],
          subject: emailSubject,
          html: emailBody,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json()
        console.error('Resend API error:', errorData)
        throw new Error('Failed to send email via Resend')
      }

      const data = await resendResponse.json()
      return NextResponse.json({ success: true, messageId: data.id })
    }

    // Fallback: Try nodemailer with Gmail SMTP (if configured)
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const nodemailer = require('nodemailer')
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD, // App password, not regular password
        },
      })

      await transporter.sendMail({
        from: `"NHSF (UK) Admin System" <${process.env.SMTP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: emailSubject,
        html: emailBody,
      })

      return NextResponse.json({ success: true, method: 'smtp' })
    }

    // No email service configured
    console.warn('No email service configured. Email not sent.')
    return NextResponse.json({ 
      success: false, 
      error: 'No email service configured. Please set up RESEND_API_KEY or SMTP credentials.' 
    }, { status: 500 })

  } catch (error: any) {
    console.error('Error sending email notification:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send email notification' 
    }, { status: 500 })
  }
}

