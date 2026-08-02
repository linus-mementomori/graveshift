'use client'

import { useState } from 'react'
import { Button, ButtonLink, CueStrip, Screen, Speak, Stub, cn } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { getTheme } from '@/themes'
import { CUES } from '@/audio/cues'
import { NIGHT_ORDER } from '@/engine/nightOrder'

/**
 * PHASE 1 STUB — the play loop.
 * This walks the real NIGHT_ORDER table and renders real theme narration and
 * cue text, so the flow and the copy are demonstrable. What's missing is the
 * engine: intents, resolveNight(), and win checks (ROADMAP.md Phase 1).
 */
export default function PlayPage() {
  const { names, playerCount, themeId } = useGameStore()
  const theme = getTheme(themeId)

  // Only beats whose role could plausibly be in play; the real version filters
  // by living actors via engine/machine.ts.
  const beats = NIGHT_ORDER.filter((b) => !b.firstNightOnly)
  const [i, setI] = useState(0)
  const [target, setTarget] = useState<number | null>(null)
  const beat = beats[i]

  const narrationFor = (roleId: string) =>
    roleId === 'werewolf'
      ? theme.narration.wolvesWake
      : roleId === 'seer'
        ? theme.narration.seerWake
        : roleId === 'doctor'
          ? theme.narration.doctorWake
          : `${roleId}, open your eyes.`

  const cue = beat.cueId ? (theme.cueOverrides[beat.cueId] ?? CUES[beat.cueId].text) : null

  return (
    <div className="phase-night min-h-dvh">
      <Screen
        title="Night 1"
        step={`${playerCount} alive`}
        action={
          <>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setTarget(null)
                  setI((n) => Math.max(0, n - 1))
                }}
              >
                ← Back
              </Button>
              <Button variant="secondary" onClick={() => setTarget(null)}>
                ↺ Repeat
              </Button>
            </div>
            {i < beats.length - 1 ? (
              <Button
                onClick={() => {
                  setTarget(null)
                  setI((n) => n + 1)
                }}
              >
                Confirm &amp; continue
              </Button>
            ) : (
              <ButtonLink href="/">End of night — dawn (stub)</ButtonLink>
            )}
          </>
        }
      >
        {cue && <CueStrip text={cue} />}

        <p className="caption glow-sm mt-6 text-[var(--accent)]">{beat.roleId}</p>
        <div className="mt-3">
          <Speak>{narrationFor(beat.roleId)}</Speak>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {names.slice(0, playerCount).map((n, idx) => (
            <button
              key={idx}
              onClick={() => setTarget(idx)}
              className={cn(
                'card-atmo flex h-[72px] flex-col justify-center rounded-xl border px-2 text-left transition-all duration-150',
                target === idx
                  ? 'border-2 border-[var(--accent)] shadow-[0_0_20px_var(--accent-glow)]'
                  : 'border-[var(--border-subtle)]',
              )}
            >
              <span className="truncate text-sm font-medium">{n || `Player ${idx + 1}`}</span>
              <span className="caption text-[var(--text-muted)]">alive</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <Stub note="Phase 1: recordIntent() collects taps without resolving. resolveNight() runs the 10-step pipeline at dawn (GAME_DESIGN §4.2), which is what makes Back trivial and every edge case deterministic." />
        </div>
      </Screen>
    </div>
  )
}
