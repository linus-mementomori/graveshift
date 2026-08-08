'use client'

import { useEffect, useState } from 'react'
import { Volume2, X } from 'lucide-react'
import { cn } from './ui'
import { EXTRA_SOUNDS } from '@/audio/files'

/**
 * The host's soundboard.
 *
 * Cue strips cover sounds that belong to a beat. This covers the ones that
 * don't — a sarcastic sting, a scream, a creak at nothing. Those are timing
 * choices the host makes by reading the room, so they need to be reachable at
 * any moment rather than bound to a phase.
 *
 * Only buttons whose file actually exists are shown. A soundboard full of dead
 * buttons is worse than a small one, and the host cannot debug a 404 mid-game.
 *
 * Sits above the action deck rather than inside it: DESIGN §1 principle 3 keeps
 * the primary action alone in the thumb zone, and firing a scare by accident
 * instead of confirming a night action would be genuinely bad.
 */
export function Soundboard({ alwaysOpen = false }: { alwaysOpen?: boolean } = {}) {
  const [openState, setOpen] = useState(false)
  const open = alwaysOpen || openState
  const [available, setAvailable] = useState<Set<string> | null>(null)

  // Probe once, lazily, the first time the host opens the tray.
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

  async function fire(file: string) {
    const p = await import('@/audio/player')
    await p.playFile(file)
  }

  async function hush() {
    const p = await import('@/audio/player')
    p.stop()
  }

  const usable = EXTRA_SOUNDS.filter((s) => available?.has(s.file))

  // Nothing installed yet — stay out of the way entirely.
  if (open && available && usable.length === 0) {
    return (
      <div className="mb-3 rounded-xl border border-[var(--border-subtle)] px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="caption text-[var(--text-muted)]">Soundboard</span>
          <button onClick={() => setOpen(false)} aria-label="Close soundboard">
            <X size={14} className="text-[var(--text-muted)]" />
          </button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
          No sound files installed. Drop MP3s into <code>public/audio/</code> — see that
          folder&apos;s README for the filenames.
        </p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="caption mb-3 flex items-center gap-1.5 text-[var(--text-muted)]"
        aria-label="Open soundboard"
      >
        <Volume2 size={14} aria-hidden />
        Soundboard
      </button>
    )
  }

  return (
    <div className="mb-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/15 p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="caption text-[var(--accent)]">Soundboard</span>
        <div className="flex items-center gap-3">
          <button onClick={hush} className="caption text-[var(--text-muted)]">
            ■ Stop
          </button>
          <button onClick={() => setOpen(false)} aria-label="Close soundboard">
            <X size={14} className="text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {available === null ? (
        <p className="caption text-[var(--text-muted)]">Checking…</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {usable.map((s) => (
            <button
              key={s.id}
              onClick={() => fire(s.file)}
              title={s.hint}
              className={cn(
                'card-atmo min-h-11 rounded-lg border border-[var(--border-subtle)] px-2.5 py-2 text-left',
                'active:scale-[0.98] active:border-[var(--accent)]',
              )}
            >
              <span className="block truncate text-xs font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
