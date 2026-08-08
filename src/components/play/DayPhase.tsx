'use client'

import { useEffect, useState } from 'react'
import { Button, CueStrip, Screen, Speak, Notice, cn } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { getTheme } from '@/themes'
import { CUES } from '@/audio/cues'
import { livingSeats } from '@/engine/machine'
import { forcedOutcome } from '@/engine/winCheck'
import type { GameState } from '@/engine/types'

/** DAY — GAME_DESIGN.md §6. Discussion, notes, the Mayor reveal, then the vote. */
export function DayPhase({ game }: { game: GameState }) {
  const { goVote, revealMayor, callIt } = useGameStore()
  const theme = getTheme(game.themeId)
  const alive = livingSeats(game)
  const [seconds, setSeconds] = useState(game.settings.dayTimerSeconds)

  useEffect(() => {
    if (seconds === null || seconds <= 0) return
    const t = setTimeout(() => setSeconds((n) => (n === null ? null : n - 1)), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  const mayor = alive.find((s) => s.roleId === 'mayor' && !s.marks.includes('revealed'))
  // §10.6 — surface a decided game, but the host keeps the gavel.
  const forced = forcedOutcome(game)

  return (
    <Screen
      title={`Day ${game.dayNumber}`}
      step={`${alive.length} alive`}
      action={<Button onClick={goVote}>Call the vote →</Button>}
    >
      <CueStrip text={theme.cueOverrides.DAY ?? CUES.DAY.text} />

      <div className="mt-8">
        <Speak>{theme.narration.day}</Speak>
      </div>

      {seconds !== null && (
        <div className="mt-6">
          <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--bg-raised)]">
            <div
              className="h-full bg-[var(--accent)] transition-[width] duration-1000"
              style={{
                width: `${Math.max(0, (seconds / (game.settings.dayTimerSeconds || 1)) * 100)}%`,
              }}
            />
          </div>
          <p className="caption mt-2 tabular-nums text-[var(--text-muted)]">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} left
          </p>
        </div>
      )}

      {forced && (
        <div className="mt-6">
          <Notice tone="error">
            <p className="mb-2 font-medium">This is decided — {forced.message}</p>
            <Button variant="secondary" onClick={() => callIt(forced)}>
              Call it for the {forced.faction}
            </Button>
          </Notice>
        </div>
      )}

      {mayor && (
        <div className="mt-6">
          <Button variant="secondary" onClick={() => revealMayor(mayor.id)}>
            {mayor.name} reveals as Mayor (vote counts twice)
          </Button>
        </div>
      )}

      <h3 className="caption mt-8 text-[var(--text-muted)]">Still with us</h3>
      <ul className="mt-3 space-y-2">
        {alive.map((s) => (
          <li
            key={s.id}
            className={cn(
              'card-atmo flex items-center justify-between rounded-xl border border-[var(--border-subtle)] px-4 py-3',
              s.marks.includes('silenced') && 'opacity-60',
            )}
          >
            <span className="truncate text-sm">{s.name}</span>
            <span className="caption shrink-0 text-[var(--text-muted)]">
              {s.marks.includes('silenced')
                ? '🔇 silenced'
                : s.marks.includes('revealed')
                  ? '★ revealed'
                  : ''}
            </span>
          </li>
        ))}
      </ul>

      {game.log.length > 0 && (
        <>
          <h3 className="caption mt-8 text-[var(--text-muted)]">What happened so far</h3>
          <ul className="mt-2 space-y-1">
            {game.log.slice(-6).map((entry, i) => (
              <li key={i} className="text-xs text-[var(--text-secondary)]">
                — {entry.text}
              </li>
            ))}
          </ul>
        </>
      )}
    </Screen>
  )
}
