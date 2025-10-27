import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/myuni/forgot-password',
        '/forget-password',
        '/demo/',
        '/favorites/',
        '/zone-admin/',
      ],
    },
    sitemap: 'https://nhsfuksports.vercel.app/sitemap.xml',
  }
}
