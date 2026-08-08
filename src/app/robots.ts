import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/** Required by `output: 'export'` — the file is generated once at build time. */
export const dynamic = 'force-static'

/**
 * Emitted as /robots.txt. Works with `output: 'export'`.
 *
 * The disallowed paths are session-gated or mid-game screens: they render
 * nothing a crawler can use, and letting them into the index would spend crawl
 * budget on dead ends and put empty "Sign in" pages in search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/account/', '/auth/', '/themes/editor/', '/play/', '/setup/deal/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
