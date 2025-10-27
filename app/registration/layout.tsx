import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registration - NHSF UK Dharmic Games 2025',
  description: 'Register for the NHSF UK Dharmic Games 2025! University registration, individual registration, and on-day registration available. Join the National Hindu Student Forum competition.',
  keywords: [
    'NHSF UK Registration',
    'Dharmic Games Registration',
    'University Registration',
    'Individual Registration',
    'Student Registration',
    'Hindu Student Forum',
    'UK University Registration',
    'Competition Registration',
    'Student Competition',
    'University Sports Registration',
    'Hindu Society Registration',
    'Student Event Registration',
    'UK Hindu Students',
    'University Competition',
    'Student Games Registration'
  ],
  openGraph: {
    title: 'Registration - NHSF UK Dharmic Games 2025',
    description: 'Register for the NHSF UK Dharmic Games 2025! University registration, individual registration, and on-day registration available.',
    url: 'https://nhsf-dharmic-games.vercel.app/registration',
    siteName: 'NHSF UK Dharmic Games',
    images: [
      {
        url: '/Images/NHSF-Dharmic-Games-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'NHSF UK Dharmic Games Registration',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Registration - NHSF UK Dharmic Games 2025',
    description: 'Register for the NHSF UK Dharmic Games 2025! University registration, individual registration, and on-day registration available.',
    images: ['/Images/NHSF-Dharmic-Games-logo.jpg'],
  },
  alternates: {
    canonical: '/registration',
  },
}

export default function RegistrationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
