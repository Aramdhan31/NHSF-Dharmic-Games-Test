import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Results - NHSF UK Dharmic Games 2025',
  description: 'Watch live scores, matches, and leaderboards in real-time for the NHSF UK Dharmic Games 2025. No login required! View live results from North & Central Zone and London & South Zone tournaments.',
  keywords: [
    'Live Results',
    'Live Scores',
    'Live Matches',
    'Real-time Results',
    'NHSF UK Live',
    'Dharmic Games Live',
    'Live Leaderboard',
    'Live Analytics',
    'University Competition Live',
    'Hindu Student Games Live',
    'Zonals Live Results',
    'Live Tournament',
    'Live Competition',
    'Real-time Scores',
    'Live Updates'
  ],
  openGraph: {
    title: 'Live Results - NHSF UK Dharmic Games 2025',
    description: 'Watch live scores, matches, and leaderboards in real-time for the NHSF UK Dharmic Games 2025. No login required!',
    url: 'https://nhsf-dharmic-games.vercel.app/live',
    siteName: 'NHSF UK Dharmic Games',
    images: [
      {
        url: '/Images/NHSF-Dharmic-Games-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'NHSF UK Dharmic Games Live Results',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Results - NHSF UK Dharmic Games 2025',
    description: 'Watch live scores, matches, and leaderboards in real-time for the NHSF UK Dharmic Games 2025. No login required!',
    images: ['/Images/NHSF-Dharmic-Games-logo.jpg'],
  },
  alternates: {
    canonical: '/live',
  },
}

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
