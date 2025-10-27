export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'NHSF Dharmic Games', email: 'arjun.ramdhan.nhsf@gmail.com' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();
    console.log('📧 Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Email send failed:', error);
    throw error;
  }
}
