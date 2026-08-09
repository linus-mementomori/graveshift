'use client'

import { useState } from 'react'
import { cn } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { getTheme, roleName, roleFlavour } from '@/themes'
import { ROLES } from '@/engine/roles'
import type { GameState, Seat } from '@/engine/types'

/**
 * Every seat, what they are, what they can do, and whether they're still alive.
 *
 * This is the host's cheat sheet. The thing they'd otherwise be holding in
 * their head (CONTEXT.md §2: "the host holds 12 secret identities and forgets
 * who the Doctor saved"). It is also the single most dangerous screen in the
 * app: it shows every hidden role at once. Hence the deliberate friction of
 * having to reveal it, and the standing warning.
 */
export function RosterSheet({ game }: { game: GameState }) {
  const [revealed, setRevealed] = useState(false)
  const theme = getTheme(game.themeId)

  const alive = game.seats.filter((s) => s.alive).length

  if (!revealed) {
    return (
      <div className="pt-4">
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          This shows <strong className="text-[var(--text-primary)]">every player&apos;s role</strong>,
          alive or dead. Make sure nobody is reading over your shoulder.
        </p>
        <button
          onClick={() => setRevealed(true)}
          className="mt-4 w-full rounded-xl border border-[var(--accent)]/50 bg-[var(--accent-soft)]/25 py-3 text-sm text-[var(--accent)]"
        >
          Show the roster
        </button>
        <p className="caption mt-3 text-[var(--text-muted)]">
          {alive} of {game.seats.length} still alive
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 pt-1">
      <p className="caption text-[var(--text-muted)]">
        {alive} alive · {game.seats.length - alive} out · night {game.dayNumber}
      </p>
      {game.seats.map((seat) => (
        <RosterRow key={seat.id} seat={seat} theme={theme} />
      ))}
    </div>
  )
}

function RosterRow({ seat, theme }: { seat: Seat; theme: ReturnType<typeof getTheme> }) {
  const role = ROLES[seat.roleId]
  const faction = role.faction

  const factionColour =
    faction === 'mafia'
      ? 'text-[var(--danger)]'
      : faction === 'neutral'
        ? 'text-[var(--warn)]'
        : 'text-[var(--info)]'

  // Charges are what the host actually forgets: potions spent, shots left.
  const charges = Object.entries(seat.charges)
    .filter(([, n]) => typeof n === 'number')
    .map(([k, n]) => `${k} ${n}`)

  return (
    <div
      className={cn(
        'card-atmo rounded-xl border px-3 py-2.5',
        seat.alive ? 'border-[var(--border-subtle)]' : 'border-transparent opacity-45',
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn('truncate text-sm font-medium', !seat.alive && 'line-through')}>
          {seat.name}
        </span>
        <span className={cn('caption shrink-0', factionColour)}>
          {/* Word as well as colour. Never encode meaning in colour alone (DESIGN §8). */}
          {seat.alive ? faction : 'out'}
        </span>
      </div>

      <p className="mt-0.5 text-xs text-[var(--accent)]">{roleName(theme, seat.roleId)}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
        {roleFlavour(theme, seat.roleId)}
      </p>

      {(charges.length > 0 || seat.marks.length > 0 || seat.loverId) && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {charges.map((c) => (
            <span
              key={c}
              className="caption rounded border border-[var(--border-subtle)] px-1.5 py-0.5 text-[var(--text-muted)]"
            >
              {c}
            </span>
          ))}
          {seat.marks.map((m) => (
            <span
              key={m}
              className="caption rounded border border-[var(--warn)]/40 px-1.5 py-0.5 text-[var(--warn)]"
            >
              {m}
            </span>
          ))}
          {seat.loverId && (
            <span className="caption rounded border border-[var(--accent)]/40 px-1.5 py-0.5 text-[var(--accent)]">
              lover
            </span>
          )}
        </div>
      )}

      {seat.notes && (
        <p className="mt-1.5 border-l-2 border-[var(--accent)]/40 pl-2 text-xs italic text-[var(--text-secondary)]">
          {seat.notes}
        </p>
      )}
    </div>
  )
}
