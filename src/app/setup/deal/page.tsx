'use client'

import { ButtonLink, Screen, Stub } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { getTheme } from '@/themes'

/**
 * PHASE 1 STUB — the pass-the-phone deal (DESIGN.md §7.6).
 * Needs engine/deal.ts (seeded shuffle) and the RevealPanel hold-to-reveal
 * component with the 3-second cover countdown. See ROADMAP.md Phase 1.
 */
export default function DealPage() {
  const { names, playerCount, themeId, settings } = useGameStore()
  const theme = getTheme(themeId)

  return (
    <Screen
      title="Setup"
      step="5 of 5"
      action={<ButtonLink href="/play">Begin — Night 1</ButtonLink>}
    >
      <h2 className="display glow-sm text-3xl">Pass the phone</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Each player holds to reveal their own role, then hands it back.
      </p>

      <div className="mt-6 space-y-2">
        {names.slice(0, playerCount).map((n, i) => (
          <div
            key={i}
            className="card-atmo flex h-14 items-center justify-between rounded-xl border border-[var(--border-subtle)] px-4"
          >
            <span className="text-sm">{n || `Player ${i + 1}`}</span>
            <span className="caption text-[var(--text-muted)]">hold to reveal</span>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <Stub note="Phase 1: engine/deal.ts (seeded shuffle) + RevealPanel with the 3-second cover countdown. Role content is never rendered to the DOM until the hold begins." />
        <p className="caption text-[var(--text-muted)]">
          {theme.name} · {playerCount} players · Night 0 {settings.nightZero ? 'on' : 'off'} ·
          reveal on death {settings.revealRoleOnDeath ? 'on' : 'off'}
        </p>
      </div>
    </Screen>
  )
}
