import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      email,
      ticketType,
      zone
    } = body

    console.log('Sending member confirmation email for:', fullName)

    // Email configuration
    const RESEND_API_KEY = process.env.RESEND_API_KEY

    if (!RESEND_API_KEY) {
      console.error('Resend API key not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Zone display names and dates
    const zoneInfo: Record<string, { name: string; date: string; location?: string }> = {
      'NZ+CZ': {
        name: 'North & Central Zone',
        date: 'November 22, 2025',
        location: 'Manchester'
      },
      'LZ+SZ': {
        name: 'London & South Zone',
        date: 'November 23, 2025',
        location: 'London'
      }
    }

    const selectedZone = zoneInfo[zone] || { name: zone, date: 'TBA', location: 'TBA' }

    // Ticket type display names
    const ticketTypeInfo: Record<string, { name: string; description: string }> = {
      'spectator': {
        name: 'Spectator Ticket',
        description: 'You will be watching the games and supporting the teams'
      },
      'referee_volunteer_external': {
        name: 'Referee/Volunteer/External Ticket',
        description: 'You will be helping with the event or participating as an external member'
      }
    }

    const ticket = ticketTypeInfo[ticketType] || { name: ticketType, description: 'Thank you for registering!' }

    // Prepare email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316, #dc2626); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Registration Confirmed!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${fullName}!</h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Thank you for registering for the NHSF (UK) (UK) Dharmic Games! We're excited to have you join us for this amazing event.
          </p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h3 style="color: #1f2937; margin-top: 0;">Your Registration Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Name:</td>
              <td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Email:</td>
              <td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Ticket Type:</td>
              <td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${ticket.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Event:</td>
              <td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${selectedZone.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Date:</td>
              <td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${selectedZone.date}</td>
            </tr>
            ${selectedZone.location ? `
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Location:</td>
              <td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${selectedZone.location}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-weight: bold;">
            📅 What's Next?
          </p>
          <p style="margin: 5px 0 0 0; color: #92400e;">
            ${ticket.description} We'll send you more details about the event closer to the date. Keep an eye on your inbox!
          </p>
        </div>

        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #065f46; font-weight: bold;">
            🎯 Stay Connected
          </p>
          <p style="margin: 5px 0 0 0; color: #065f46;">
            Follow us on social media and check our website for updates about the event, schedules, and any important announcements.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" 
             style="background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Visit Our Website
          </a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center;">
          <p>Thank you for being part of the NHSF (UK) (UK) Dharmic Games community!</p>
          <p style="margin: 5px 0;">If you have any questions, please contact us at <a href="mailto:arjun.ramdhan@nhsf.org.uk" style="color: #f97316;">arjun.ramdhan@nhsf.org.uk</a></p>
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
        to: [email],
        subject: `🎉 Welcome to NHSF (UK) (UK) Dharmic Games - ${selectedZone.name}`,
        html: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      console.error('Failed to send member confirmation email:', errorData)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    const emailResult = await emailResponse.json()
    console.log('Member confirmation email sent successfully:', emailResult.id)

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully',
      emailId: emailResult.id
    })

  } catch (error: any) {
    console.error('Error sending member confirmation email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
