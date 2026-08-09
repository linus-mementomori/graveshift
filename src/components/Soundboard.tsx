'use client'

import { useEffect, useState } from 'react'
import { cn } from './ui'
import { CUES } from '@/audio/cues'
import { EXTRA_SOUNDS } from '@/audio/files'
import { recommendedCue } from '@/audio/recommend'
import { getTheme } from '@/themes'
import type { CueId, GameState } from '@/engine/types'

/**
 * The host's sound panel, living in the in-game dock.
 *
 * Two kinds of sound sit here:
 *
 *   CUES: one per beat of the night order. These ALWAYS work: if there's no
 *   MP3 in /public/audio/ the player falls back to the generated synth patch.
 *   The one matching the current phase or beat is pulled out and marked
 *   recommended, so the common case is a single tap rather than scanning
 *   sixteen buttons in a dark room.
 *
 *   EXTRAS: scares and stings with no fixed place in the night. File-only, so
 *   they're probed first and hidden unless the MP3 actually exists. A dead
 *   button is worse than a missing one when you can't debug a 404 mid-game.
 */

const CUE_ORDER: CueId[] = [
  'NIGHT_FALL',
  'WOLVES_WAKE',
  'SEER_WAKE',
  'DOCTOR_WAKE',
  'WITCH_WAKE',
  'NIGHT_END',
  'DAWN',
  'DEATH_REVEAL',
  'NO_DEATH',
  'DAY',
  'VOTE',
  'EXECUTION',
  'LAST_WORDS',
  'VICTORY_VILLAGE',
  'VICTORY_MAFIA',
  'VICTORY_NEUTRAL',
]

/** Turn WOLVES_WAKE into "Wolves wake". */
const cueLabel = (id: CueId) => {
  const s = id.replace(/_/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function Soundboard({
  game,
  alwaysOpen = false,
}: {
  game?: GameState | null
  alwaysOpen?: boolean
}) {
  const [openState, setOpen] = useState(false)
  const open = alwaysOpen || openState
  const [available, setAvailable] = useState<Set<string> | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)

  const theme = game ? getTheme(game.themeId) : null
  const recommended = recommendedCue(game ?? null)

  // Probe the extras once, lazily. Cues need no probe. They always have a synth.
  useEffect(() => {
    if (!open || available) return
    let active = true
    import('@/audio/player').then(async (p) => {
      const found = await p.probe(EXTRA_SOUNDS.map((s) => s.file))
      if (active) setAvailable(found)
    })
    return () => {
      active = false
    }
  }, [open, available])

  async function fireCue(id: CueId) {
    const p = await import('@/audio/player')
    const { sustained } = await p.playCue(id)
    setPlaying(sustained ? id : null)
  }

  async function fireFile(file: string) {
    const p = await import('@/audio/player')
    await p.playFile(file)
    setPlaying(null)
  }

  async function hush() {
    const p = await import('@/audio/player')
    p.stop()
    setPlaying(null)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="caption mb-3 text-[var(--text-muted)]"
        aria-label="Open soundboard"
      >
        ♪ Soundboard
      </button>
    )
  }

  const usableExtras = EXTRA_SOUNDS.filter((s) => available?.has(s.file))
  const others = CUE_ORDER.filter((id) => id !== recommended)

  return (
    <div className="pt-1">
      {/* ── the one they probably want ─────────────────────────────────── */}
      {recommended && (
        <>
          <p className="caption mb-2 text-[var(--accent)]">Recommended now</p>
          <button
            onClick={() => fireCue(recommended)}
            className={cn(
              'card-atmo mb-1.5 w-full rounded-xl border-2 border-[var(--accent)] px-3 py-3 text-left',
              'shadow-[0_0_18px_var(--accent-glow)] active:scale-[0.99]',
            )}
          >
            <span className="block text-sm font-medium text-[var(--accent)]">
              ▶ {cueLabel(recommended)}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-[var(--text-secondary)]">
              {theme?.cueOverrides[recommended] ?? CUES[recommended].text}
            </span>
          </button>
          <button onClick={hush} className="caption mb-4 text-[var(--text-muted)]">
            ■ Stop {playing ? '(playing)' : ''}
          </button>
        </>
      )}

      {/* ── everything else in the night order ─────────────────────────── */}
      <p className="caption mb-2 text-[var(--text-muted)]">All cues</p>
      <div className="grid grid-cols-2 gap-2">
        {others.map((id) => (
          <button
            key={id}
            onClick={() => fireCue(id)}
            title={CUES[id].text}
            className="card-atmo min-h-11 rounded-lg border border-[var(--border-subtle)] px-2.5 py-2 text-left active:scale-[0.98] active:border-[var(--accent)]"
          >
            <span className="block truncate text-xs font-medium">{cueLabel(id)}</span>
          </button>
        ))}
      </div>

      {/* ── host extras, only the ones with a real file ────────────────── */}
      <p className="caption mt-5 mb-2 text-[var(--text-muted)]">Extras</p>
      {available === null ? (
        <p className="caption text-[var(--text-muted)]">Checking…</p>
      ) : usableExtras.length === 0 ? (
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
          None installed. Drop MP3s into <code>public/audio/</code>. See that folder&apos;s README
          for the filenames. Cues above work regardless.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {usableExtras.map((s) => (
            <button
              key={s.id}
              onClick={() => fireFile(s.file)}
              title={s.hint}
              className="card-atmo min-h-11 rounded-lg border border-[var(--border-subtle)] px-2.5 py-2 text-left active:scale-[0.98] active:border-[var(--accent)]"
            >
              <span className="block truncate text-xs font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
