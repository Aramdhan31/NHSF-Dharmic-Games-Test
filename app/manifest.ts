import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NHSF UK Dharmic Games 2025',
    short_name: 'NHSF Dharmic Games',
    description: 'NHSF UK Dharmic Games 2025 - Represent your university in Zonal and National competitions! Register your team and compete for the National Championship title.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ea580c',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/Images/NHSF-Dharmic-Games-logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any'
      },
      {
        src: '/Images/NHSF-Dharmic-Games-logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any'
      },
      {
        src: '/Images/NHSF-Dharmic-Games-logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'maskable'
      },
      {
        src: '/Images/NHSF-Dharmic-Games-logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable'
      }
    ],
    categories: ['education', 'sports', 'entertainment'],
    lang: 'en-GB',
    dir: 'ltr'
  }
}
