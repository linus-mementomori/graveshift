'use client'

/**
 * Escape hatch for a wedged install.
 *
 * The service worker is what makes the app work offline, and it is also the
 * thing most likely to serve something stale after a deploy. `public/sw.js` now
 * versions its cache per build and fetches navigations network-first, which
 * should make this unnecessary, but "should" is doing real work in that
 * sentence, and a user staring at a screen that won't update needs a button,
 * not a DevTools tutorial.
 *
 * Deliberately does NOT clear localStorage: an in-progress game lives there,
 * and losing a game mid-party to fix a rendering glitch is a bad trade.
 */
export async function clearAppCache(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } finally {
    // Cache-busting query param defeats the HTTP cache as well as the SW.
    window.location.replace(`/?fresh=${Date.now()}`)
  }
}
