/**
 * Project Remus service worker — ARCHITECTURE.md §6.
 *
 * Job: make the app work in a basement with no signal. Nothing more.
 *
 * ⚠ HISTORY: this file used to be cache-first for EVERYTHING, permanently. That
 * repeatedly served stale bundles after a rebuild — screens frozen on "Loading…",
 * a dashboard insisting the cloud wasn't configured, a login that reported an
 * invalid API key because the OLD project's credentials were baked into a cached
 * chunk. Two rules below prevent all of that; don't remove either.
 */

/**
 * Bumped by `scripts/stamp-sw.mjs` at build time.
 *
 * RULE 1: the cache name must change whenever the build does. A fixed name
 * means a returning visitor keeps yesterday's JavaScript forever.
 */
const VERSION = '__BUILD_ID__'
const CACHE = `remus-${VERSION}`

/** Pages worth having offline. Hashed assets are cached on demand below. */
const SHELL = [
  '/',
  '/setup/players/',
  '/setup/theme/',
  '/setup/roles/',
  '/setup/seats/',
  '/setup/deal/',
  '/play/',
  '/guide/',
  '/manifest.webmanifest',
  '/tex/grain.svg',
]

/**
 * Audio is precached OPTIONALLY — the folder is expected to be partly empty,
 * and `cache.addAll()` is all-or-nothing, so one missing MP3 would silently
 * discard the entire shell. Each file is added individually and allowed to fail.
 */
const OPTIONAL_AUDIO = [
  'night-fall', 'wolves-wake', 'seer-wake', 'doctor-wake', 'witch-wake',
  'night-end', 'dawn', 'death-reveal', 'no-death', 'day', 'vote',
  'execution', 'last-words', 'victory-village', 'victory-mafia', 'victory-neutral',
  'good-luck-sleeping', 'scream', 'suspense', 'laugh', 'heartbeat-long', 'door-creak',
].map((name) => `/audio/${name}.mp3`)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (c) => {
        await c.addAll(SHELL).catch(() => undefined)
        // Best-effort, one at a time, so a 404 costs only that file.
        await Promise.all(OPTIONAL_AUDIO.map((url) => c.add(url).catch(() => undefined)))
      })
      .then(() => self.skipWaiting()),
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

/** Let the page force an update — see clearAppCache() in src/lib/pwa.ts. */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // RULE 2: same-origin only. Pointed at Supabase this would cache auth and
  // REST responses forever, and the `caches.match('/')` fallback would hand a
  // JSON parser an HTML document. See docs/CLOUD_PLAN.md §14.1.
  if (url.origin !== self.location.origin) return

  // Navigations go NETWORK-FIRST. A page shell is the one thing that must never
  // be stale — it's what pulls in the current JS. Falls back to cache offline,
  // which is the whole point of the worker.
  const isNavigation =
    request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => undefined)
          return res
        })
        .catch(() => caches.match(request).then((hit) => hit ?? caches.match('/'))),
    )
    return
  }

  // Everything else (hashed JS/CSS, fonts, the texture) is immutable per build
  // and safe to serve cache-first.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit
      return fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => undefined)
          return res
        })
        .catch(() => undefined)
    }),
  )
})
