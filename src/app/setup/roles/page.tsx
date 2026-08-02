'use client'

import { Button, ButtonLink, Screen, cn } from '@/components/ui'
import { BalanceMeter } from '@/components/BalanceMeter'
import { useGameStore } from '@/store/gameStore'
import { ROLE_LIST } from '@/engine/roles'
import { totalPlayers } from '@/engine/balance'
import { getTheme, roleName } from '@/themes'
import type { Faction, RoleId } from '@/engine/types'

const SECTIONS: { faction: Faction; label: string }[] = [
  { faction: 'mafia', label: 'mafia' },
  { faction: 'village', label: 'village' },
  { faction: 'neutral', label: 'neutral' },
]

export default function RolesPage() {
  const { composition, adjustRole, resetToPreset, playerCount, themeId, settings, toggleSetting } =
    useGameStore()
  const theme = getTheme(themeId)
  const assigned = totalPlayers(composition)
  const balanced = assigned === playerCount

  return (
    <Screen
      title="Setup"
      step="3 of 5"
      action={
        <>
          <BalanceMeter composition={composition} />
          <label className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] px-4 py-3">
            <span className="text-sm">
              Night 0
              <span className="block text-xs text-[var(--text-muted)]">
                First night, no kills. Helps the village.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.nightZero}
              onChange={(e) => toggleSetting('nightZero', e.target.checked)}
              className="h-6 w-6 accent-[var(--accent)]"
            />
          </label>
          <ButtonLink href="/setup/seats" className={cn(!balanced && 'pointer-events-none opacity-40')}>
            {balanced ? 'Name the players →' : `${assigned} of ${playerCount} seats filled`}
          </ButtonLink>
        </>
      }
    >
      <div className="flex items-baseline justify-between">
        <h2 className="display glow-sm text-3xl">Roles</h2>
        <button onClick={resetToPreset} className="caption text-[var(--accent)]">
          reset
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {SECTIONS.map(({ faction, label }) => (
          <section key={faction}>
            <h3 className="caption mb-2 text-[var(--text-muted)]">
              {label} · {theme.factionNames[faction]}
            </h3>
            <div className="space-y-1.5">
              {ROLE_LIST.filter((r) => r.faction === faction).map((role) => {
                const n = composition[role.id] ?? 0
                const locked = !!role.minPlayers && playerCount < role.minPlayers
                return (
                  <div
                    key={role.id}
                    className={cn(
                      'card-atmo flex items-center gap-3 rounded-xl border px-3 py-2',
                      n > 0 ? 'border-[var(--accent)]/50' : 'border-[var(--border-subtle)]',
                      locked && 'opacity-40',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {roleName(theme, role.id as RoleId)}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {locked ? `Needs ${role.minPlayers}+ players` : role.summary}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      aria-label={`Remove one ${role.id}`}
                      className="!h-10 !w-10 !min-h-10 !rounded-lg !px-0"
                      onClick={() => adjustRole(role.id, -1)}
                      disabled={n === 0}
                    >
                      −
                    </Button>
                    <span className="w-4 text-center text-sm tabular-nums">{n}</span>
                    <Button
                      variant="ghost"
                      aria-label={`Add one ${role.id}`}
                      className="!h-10 !w-10 !min-h-10 !rounded-lg !px-0"
                      onClick={() => adjustRole(role.id, 1)}
                      disabled={locked || assigned >= playerCount}
                    >
                      +
                    </Button>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </Screen>
  )
}
