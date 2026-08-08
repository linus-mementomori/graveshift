/**
 * Project Remus service worker — ARCHITECTURE.md §6.
 *
 * Cache-first for everything. There is no network content to be stale about
 * (CONTEXT.md D1/D6), so the only job here is making the app work in a basement
 * with no signal.
 */

const CACHE = 'remus-v1'
const SHELL = ['/', '/setup/players/', '/setup/theme/', '/setup/roles/', '/setup/seats/', '/setup/deal/', '/play/', '/guide/', '/manifest.webmanifest', '/tex/grain.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => undefined)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // Same-origin only. Everything below is cache-FIRST and permanent, which is
  // correct for our static shell and catastrophic for anything else: pointed at
  // Supabase it would cache auth and REST responses forever, and the
  // `caches.match('/')` fallback would hand JSON parsers an HTML document.
  // See docs/CLOUD_PLAN.md §14.1.
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit
      return fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => undefined)
          return res
        })
        .catch(() => caches.match('/'))
    }),
  )
})
