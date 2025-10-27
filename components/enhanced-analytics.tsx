'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

export function EnhancedAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page views
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: pathname,
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  }, [pathname, searchParams])

  // Track custom events
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'engagement',
        event_label: parameters?.label || '',
        value: parameters?.value || 0,
        ...parameters,
      })
    }
  }

  // Track user interactions
  const trackUserInteraction = (action: string, category: string, label?: string) => {
    trackEvent('user_interaction', {
      action,
      category,
      label,
    })
  }

  // Track competition events
  const trackCompetitionEvent = (eventType: string, details?: Record<string, any>) => {
    trackEvent('competition_event', {
      event_type: eventType,
      ...details,
    })
  }

  return {
    trackEvent,
    trackUserInteraction,
    trackCompetitionEvent,
  }
}

// Google Analytics 4 setup
export function GoogleAnalytics() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Load Google Analytics
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }
    window.gtag = gtag

    gtag('js', new Date())
    gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_title: document.title,
      page_location: window.location.href,
    })

    return () => {
      // Cleanup
      const existingScript = document.querySelector(`script[src*="googletagmanager"]`)
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  return null
}

// Search Console verification
export function SearchConsoleVerification() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Add Google Search Console verification meta tag
    const meta = document.createElement('meta')
    meta.name = 'google-site-verification'
    meta.content = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || ''
    document.head.appendChild(meta)

    return () => {
      const existingMeta = document.querySelector('meta[name="google-site-verification"]')
      if (existingMeta) {
        document.head.removeChild(existingMeta)
      }
    }
  }, [])

  return null
}
