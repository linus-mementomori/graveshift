'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

/**
 * Applies the selected theme to <html data-theme>, which swaps every colour
 * token at once (DESIGN.md §3.1). Also registers the service worker so the app
 * works offline after the first visit (CONTEXT.md D5).
 */
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const themeId = useGameStore((s) => s.themeId)

  useEffect(() => {
    document.documentElement.dataset.theme = themeId
  }, [themeId])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    /**
     * Production only.
     *
     * `public/sw.js` carries a `__BUILD_ID__` placeholder that `stamp-sw.mjs`
     * replaces after `next build`. In dev nothing stamps it, so the cache name
     * is the literal string and never changes. Meaning the worker happily
     * serves last hour's HTML, pointing at chunk hashes that no longer exist.
     * That produced a 404 on layout.js, which stopped every client component
     * mounting, which looked like the app hanging on "Loading…".
     *
     * Offline support is worth nothing during development and costs hours.
     */
    if (process.env.NODE_ENV !== 'production') {
      // Also clean up a worker left behind by an earlier dev session.
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) void r.unregister()
      })
      return
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is a progressive enhancement. Never block the app */
    })
  }, [])

  return <>{children}</>
}
