'use client'

import { useEffect } from 'react'

interface SEOStructuredDataProps {
  type: 'Event' | 'Organization' | 'WebSite' | 'BreadcrumbList'
  data: any
}

export function SEOStructuredData({ type, data }: SEOStructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    })
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [type, data])

  return null
}

// Predefined structured data for common use cases
export const NHSFOrganizationData = {
  name: 'National Hindu Student Forum UK',
  url: 'https://nhsf-dharmic-games.vercel.app',
  logo: 'https://nhsf-dharmic-games.vercel.app/Images/NHSF-Dharmic-Games-logo.jpg',
  description: 'National Hindu Student Forum UK - Organizing Dharmic Games 2025 for university students across the UK',
  sameAs: [
    'https://www.facebook.com/NHSFUK',
    'https://www.instagram.com/NHSFUK',
    'https://twitter.com/NHSFUK'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'General Inquiry',
    email: 'info@nhsf.org.uk',
    availableLanguage: 'English'
  }
}

export const DharmicGamesEventData = {
  name: 'NHSF UK Dharmic Games 2025',
  description: 'National Hindu Student Forum UK Dharmic Games - Zonals competition featuring Hindu festivals quiz, Bhagavad Gita challenges, and cultural competitions',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
  location: {
    '@type': 'VirtualLocation',
    url: 'https://nhsf-dharmic-games.vercel.app'
  },
  organizer: {
    '@type': 'Organization',
    name: 'National Hindu Student Forum UK',
    url: 'https://nhsf-dharmic-games.vercel.app'
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'GBP',
    availability: 'https://schema.org/InStock'
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'University Students'
  }
}

export const WebsiteData = {
  name: 'NHSF UK Dharmic Games',
  url: 'https://nhsf-dharmic-games.vercel.app',
  description: 'National Hindu Student Forum UK Dharmic Games - Zonals competition platform',
  publisher: {
    '@type': 'Organization',
    name: 'National Hindu Student Forum UK'
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://nhsf-dharmic-games.vercel.app/search?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
}
