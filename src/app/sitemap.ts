import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/** Required by `output: 'export'` — the file is generated once at build time. */
export const dynamic = 'force-static'

/**
 * Static sitemap — works with `output: 'export'`, emitted as /sitemap.xml.
 *
 * Only genuinely public, indexable pages belong here. Account, admin, the
 * editor and the play flow are all excluded: they need a session, render
 * nothing useful to a crawler, and would dilute the pages that matter.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[0]['changeFrequency'] }[] = [
    { path: '/', priority: 1.0, freq: 'monthly' },
    { path: '/guide/', priority: 0.9, freq: 'monthly' },
    { path: '/setup/players/', priority: 0.6, freq: 'yearly' },
    { path: '/setup/theme/', priority: 0.6, freq: 'yearly' },
  ]

  return pages.map(({ path, priority, freq }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }))
}
