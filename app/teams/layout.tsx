import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Teams & Universities - NHSF UK Dharmic Games 2025',
  description: 'View all participating universities and teams in the NHSF UK Dharmic Games 2025. North & Central Zone (Nov 22) and London & South Zone (Nov 23) tournaments. Register your university team now!',
  keywords: [
    'NHSF UK Teams',
    'University Teams',
    'Hindu Student Teams',
    'UK Universities',
    'North Central Zone',
    'London South Zone',
    'University Competition',
    'Hindu Society Teams',
    'Student Teams UK',
    'University Sports Teams',
    'Zonals Competition',
    'University Registration',
    'Student Competition',
    'UK Hindu Students',
    'University Hindu Society'
  ],
  openGraph: {
    title: 'Teams & Universities - NHSF UK Dharmic Games 2025',
    description: 'View all participating universities and teams in the NHSF UK Dharmic Games 2025. North & Central Zone (Nov 22) and London & South Zone (Nov 23) tournaments.',
    url: 'https://nhsf-dharmic-games.vercel.app/teams',
    siteName: 'NHSF UK Dharmic Games',
    images: [
      {
        url: '/Images/NHSF-Dharmic-Games-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'NHSF UK Dharmic Games Teams',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teams & Universities - NHSF UK Dharmic Games 2025',
    description: 'View all participating universities and teams in the NHSF UK Dharmic Games 2025. North & Central Zone (Nov 22) and London & South Zone (Nov 23) tournaments.',
    images: ['/Images/NHSF-Dharmic-Games-logo.jpg'],
  },
  alternates: {
    canonical: '/teams',
  },
}

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
