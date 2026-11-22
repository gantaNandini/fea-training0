import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/utils/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin-login',
          '/api/',
          '/checkout',
          '/cart',
          '/learn',
          '/my-courses',
          '/orders',
          '/profile',
          '/wishlist',
          '/post-login',
          '/reset-password',
          '/forgot-password',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
