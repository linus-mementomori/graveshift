/**
 * Stamps a unique build id into the exported service worker.
 *
 * Runs after `next build`, against `out/sw.js` — the source in `public/sw.js`
 * keeps its `__BUILD_ID__` placeholder so the repo stays diff-clean.
 *
 * Without this the cache name is fixed, and a returning visitor keeps the old
 * bundle forever: that is what caused the "invalid API key" on a rebuilt app
 * (stale chunk holding a previous Supabase project's credentials).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const target = resolve('out/sw.js')

if (!existsSync(target)) {
  console.warn('[stamp-sw] out/sw.js not found — skipping.')
  process.exit(0)
}

const buildId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const source = readFileSync(target, 'utf8')

if (!source.includes('__BUILD_ID__')) {
  console.warn('[stamp-sw] no __BUILD_ID__ placeholder found — already stamped?')
  process.exit(0)
}

writeFileSync(target, source.replaceAll('__BUILD_ID__', buildId))
console.log(`[stamp-sw] service worker cache stamped: graveshift-${buildId}`)
