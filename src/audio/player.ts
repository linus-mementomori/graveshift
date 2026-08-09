'use client'

/**
 * The one entry point for playing anything.
 *
 * Order of preference per cue:
 *   1. an MP3 in /public/audio/ (if the file exists)
 *   2. the generated synth patch (audio/synth.ts)
 *   3. silence. Never an error, never a broken screen
 *
 * That fallback chain is the important part: the host is mid-game in a dark
 * room, and a missing file must degrade to "a different sound" or "no sound",
 * never to a crash or a stuck button.
 */

import { CUES } from './cues'
import { CUE_FILES, audioUrl } from './files'
import type { CueId } from '@/engine/types'

/** Cached <audio> elements, so a repeated cue doesn't re-download. */
const cache = new Map<string, HTMLAudioElement>()
/** Files we've already learned are missing. Don't retry them all game. */
const missing = new Set<string>()

/** Whatever is currently sustaining, so a new sound can replace it. */
let current: HTMLAudioElement | null = null

function element(file: string): HTMLAudioElement | null {
  if (missing.has(file)) return null

  let el = cache.get(file)
  if (!el) {
    el = new Audio(audioUrl(file))
    el.preload = 'auto'
    // A 404 (or an unplayable file) marks it missing so we fall through to the
    // synth from here on rather than failing on every beat.
    el.addEventListener('error', () => {
      missing.add(file)
      cache.delete(file)
    })
    cache.set(file, el)
  }
  return el
}

export interface PlayResult {
  source: 'file' | 'synth' | 'none'
  /** True while a sustained sound is running (so the UI can offer Stop). */
  sustained: boolean
}

/**
 * Play a cue. Returns which source actually produced sound, so the button can
 * label itself honestly.
 */
export async function playCue(cueId: CueId): Promise<PlayResult> {
  stop()

  const file = CUE_FILES[cueId]
  if (file) {
    const el = element(file)
    if (el) {
      try {
        el.currentTime = 0
        await el.play()
        current = el
        // Only treat it as sustained if it's long enough to be worth stopping.
        const sustained = Number.isFinite(el.duration) ? el.duration > 5 : false
        if (!sustained) current = null
        return { source: 'file', sustained }
      } catch {
        // Autoplay refused, decode failed, file corrupt. Fall through.
        missing.add(file)
      }
    }
  }

  const patch = CUES[cueId]?.synth
  if (patch) {
    const synth = await import('./synth')
    synth.play(patch as never)
    return { source: 'synth', sustained: patch === 'drone' }
  }

  return { source: 'none', sustained: false }
}

/** Play a soundboard extra. These are files only. No synth equivalent. */
export async function playFile(file: string): Promise<boolean> {
  stop()
  const el = element(file)
  if (!el) return false
  try {
    el.currentTime = 0
    await el.play()
    current = el
    return true
  } catch {
    missing.add(file)
    return false
  }
}

export function stop(): void {
  if (current) {
    current.pause()
    current.currentTime = 0
    current = null
  }
  // The synth keeps its own sustained handle; clearing it is cheap and safe
  // even when nothing is running.
  void import('./synth').then((s) => s.stopAll())
}

/** Has this file already failed to load? Lets the soundboard grey it out. */
export const isMissing = (file: string) => missing.has(file)

/**
 * Probe which soundboard files actually exist, so the host isn't shown buttons
 * that do nothing. Cheap: HEAD requests, cached by the browser.
 */
export async function probe(files: string[]): Promise<Set<string>> {
  const found = new Set<string>()
  await Promise.all(
    files.map(async (file) => {
      if (missing.has(file)) return
      try {
        const res = await fetch(audioUrl(file), { method: 'HEAD' })
        if (res.ok) found.add(file)
        else missing.add(file)
      } catch {
        missing.add(file)
      }
    }),
  )
  return found
}
