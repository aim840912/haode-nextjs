import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://haode-nextjs.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/register',
          '/profile',
          '/_next/',
          '/private/',
          '/inquiries/',
          '/diagnosis/',
          '/search?*',
          '/*.json$',
          '/*.log$',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/products',
          '/news',
          '/moments',
          '/locations',
          '/farm-tour',
          '/schedule',
          '/products/*',
          '/news/*',
          '/moments/*',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/register',
          '/profile',
          '/inquiries/',
          '/diagnosis/',
          '/*.json$',
          '/*.log$',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/products', '/news', '/moments', '/locations', '/farm-tour', '/schedule'],
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/register',
          '/profile',
          '/inquiries/',
          '/*.json$',
        ],
        crawlDelay: 2,
      },
      {
        userAgent: 'facebookexternalhit',
        allow: ['/', '/products', '/news', '/moments'],
        disallow: ['/admin/', '/api/', '/login', '/register'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
