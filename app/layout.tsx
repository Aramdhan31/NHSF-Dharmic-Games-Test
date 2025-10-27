import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { FirebaseProvider } from '@/lib/firebase-context'
import { RealtimeSyncProvider } from '@/components/realtime-sync-provider'
import { DynamicUpdateProvider } from '@/components/dynamic-update-provider'
import { LivePointsProvider } from '@/components/live-points-provider'
// import { GoogleAnalytics, SearchConsoleVerification } from '@/components/enhanced-analytics'
import { ErrorBoundary } from '@/components/error-boundary'
// import { GoogleSearchConsole } from '@/components/google-search-console'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ea580c',
}

export const metadata: Metadata = {
  title: {
    default: 'NHSF (UK) Dharmic Games 2025 - National Hindu Student Forum Competition',
    template: '%s | NHSF (UK) Dharmic Games'
  },
  description: 'NHSF (UK) Dharmic Games 2025 - Represent your university in Zonal and National competitions! Register your university team, compete in Zonal & National Competition tournaments, and advance to the National Championships. Join the biggest Hindu student competition in the UK!',
  keywords: [
    'NHSF UK',
    'Dharmic Games',
    'Hindu Student Forum',
    'UK Universities',
    'Zonal Competition',
    'National Championship',
    'Zonal & National Competition',
    'University Teams',
    'Represent Your University',
    'Hindu Students',
    'University Competition',
    'Student Championships',
    'UK Hindu Community',
    'NHSF Dharmic Games 2025',
    'University sports competition',
    'Student tournaments UK',
    'Hindu student society UK',
    'University Zonal & National games',
    'National Championships UK',
    'Zonal tournaments',
    'University representation',
    'Student competition platform',
    'UK university championships',
    'Hindu student competitions',
    'University team registration'
  ],
  authors: [{ name: 'NHSF UK' }],
  creator: 'NHSF UK',
  publisher: 'National Hindu Student Forum UK',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nhsfuksports.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://nhsfuksports.vercel.app',
    siteName: 'NHSF (UK) Dharmic Games',
    title: 'NHSF (UK) Dharmic Games 2025 - National Hindu Student Forum Competition',
    description: 'NHSF (UK) Dharmic Games 2025 - Represent your university in Zonal and National competitions! Register your team and compete for the National Championship title.',
    images: [
      {
        url: '/Images/NHSF-Dharmic-Games-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'NHSF (UK) Dharmic Games 2025 Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NHSF (UK) Dharmic Games 2025 - National Hindu Student Forum Competition',
    description: 'NHSF (UK) Dharmic Games 2025 - Represent your university in Zonal and National competitions! Register your team and compete for the National Championship title.',
    images: ['/Images/NHSF-Dharmic-Games-logo.jpg'],
    creator: '@NHSFUK',
    site: '@NHSFUK',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code
  },
  category: 'Education',
  classification: 'Educational Competition',
  generator: 'Next.js',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NHSF UK Dharmic Games',
  },
  applicationName: 'NHSF (UK) Dharmic Games',
  referrer: 'origin-when-cross-origin',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "NHSF (UK) Dharmic Games 2025",
    "description": "National Hindu Student Forum UK Dharmic Games - Represent your university in Zonal and National competitions! Compete in Zonal & National Competition tournaments and advance to the National Championships.",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "location": {
      "@type": "VirtualLocation",
      "url": "https://nhsfuksports.vercel.app"
    },
    "organizer": {
      "@type": "Organization",
      "name": "National Hindu Student Forum UK",
      "url": "https://nhsfuksports.vercel.app",
      "logo": "https://nhsf-dharmic-games.vercel.app/Images/NHSF-Dharmic-Games-logo.jpg"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock"
    },
    "audience": {
      "@type": "Audience",
      "audienceType": "University Students"
    }
  }

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "National Hindu Student Forum UK",
    "url": "https://nhsfuksports.vercel.app",
    "logo": "https://nhsf-dharmic-games.vercel.app/Images/NHSF-Dharmic-Games-logo.jpg",
    "description": "National Hindu Student Forum UK - Organizing Dharmic Games 2025 Zonal and National competitions for university students across the UK",
    "sameAs": [
      "https://www.facebook.com/NHSFUK",
      "https://www.instagram.com/NHSFUK",
      "https://twitter.com/NHSFUK"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "General Inquiry",
      "email": "info@nhsf.org.uk",
      "availableLanguage": "English"
    }
  }

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "NHSF (UK) Dharmic Games",
    "url": "https://nhsfuksports.vercel.app",
    "description": "National Hindu Student Forum UK Dharmic Games - Represent your university in Zonal and National competitions across the UK",
    "publisher": {
      "@type": "Organization",
      "name": "National Hindu Student Forum UK"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://nhsfuksports.vercel.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://nhsfuksports.vercel.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Teams",
        "item": "https://nhsfuksports.vercel.app/teams"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Live Results",
        "item": "https://nhsfuksports.vercel.app/live"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Zonals",
        "item": "https://nhsfuksports.vercel.app/zonals"
      }
    ]
  }

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning={true}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
        <link rel="canonical" href="https://nhsfuksports.vercel.app" />
        <link rel="icon" href="/Images/NHSF-Dharmic-Games-logo.jpg" />
        <link rel="apple-touch-icon" href="/Images/NHSF-Dharmic-Games-logo.jpg" />
        <meta name="theme-color" content="#ea580c" />
        <meta name="msapplication-TileColor" content="#ea580c" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="google-site-verification" content="your-google-verification-code" />
        <meta name="msvalidate.01" content="your-bing-verification-code" />
        <meta name="yandex-verification" content="your-yandex-verification-code" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="geo.region" content="GB" />
        <meta name="geo.placename" content="United Kingdom" />
        <meta name="geo.position" content="54.7024;-3.2766" />
        <meta name="ICBM" content="54.7024, -3.2766" />
        <meta name="DC.title" content="NHSF UK Dharmic Games 2025" />
        <meta name="DC.creator" content="NHSF UK" />
        <meta name="DC.subject" content="University Competition, Hindu Students, UK Universities" />
        <meta name="DC.description" content="NHSF UK Dharmic Games 2025 - Represent your university in Zonal and National competitions!" />
        <meta name="DC.publisher" content="National Hindu Student Forum UK" />
        <meta name="DC.contributor" content="NHSF UK" />
        <meta name="DC.date" content="2025-01-01" />
        <meta name="DC.type" content="Event" />
        <meta name="DC.format" content="text/html" />
        <meta name="DC.identifier" content="https://nhsfuksports.vercel.app" />
        <meta name="DC.language" content="en-GB" />
        <meta name="DC.coverage" content="United Kingdom" />
        <meta name="DC.rights" content="© 2025 NHSF UK" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Simple cleanup to prevent hydration mismatch
                if (document.body) {
                  document.body.removeAttribute('data-rm-theme');
                  document.body.removeAttribute('lang');
                  document.body.classList.remove('entry-content');
                }
                if (document.documentElement) {
                  document.documentElement.classList.remove('hentry');
                }
              } catch (e) {
                // Silently fail
              }
            `,
          }}
        />
      </head>
      <body className="font-sans" suppressHydrationWarning={true}>
        <ErrorBoundary>
        {/* <GoogleAnalytics />
        <SearchConsoleVerification />
        <GoogleSearchConsole /> */}
        <FirebaseProvider>
          <RealtimeSyncProvider>
            <DynamicUpdateProvider>
              <LivePointsProvider>
                {children}
                <Analytics />
              </LivePointsProvider>
            </DynamicUpdateProvider>
          </RealtimeSyncProvider>
        </FirebaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
