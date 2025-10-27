'use client'

import { useEffect } from 'react'

export function GoogleSearchConsole() {
  useEffect(() => {
    // Add Google Search Console verification meta tag
    const meta = document.createElement('meta')
    meta.name = 'google-site-verification'
    meta.content = 'your-google-verification-code' // Replace with actual code
    document.head.appendChild(meta)

    // Add additional SEO meta tags
    const additionalMeta = document.createElement('meta')
    additionalMeta.name = 'googlebot'
    additionalMeta.content = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    document.head.appendChild(additionalMeta)

    return () => {
      // Cleanup on unmount
      const existingMeta = document.querySelector('meta[name="google-site-verification"]')
      const existingBot = document.querySelector('meta[name="googlebot"]')
      if (existingMeta) existingMeta.remove()
      if (existingBot) existingBot.remove()
    }
  }, [])

  return null
}
