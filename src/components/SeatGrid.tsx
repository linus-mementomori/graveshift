'use client'

import { useState } from 'react'
import { cn } from './ui'
import type { Seat } from '@/engine/types'
import type { TargetOption } from '@/engine/machine'

/**
 * The seat grid — DESIGN.md §5.1.
 *
 * 3 columns at 9+ players (the common case), 2 below. Disabled seats always
 * carry a reason; a dead button with no explanation is a design failure (§5.8).
 */
export function SeatGrid({
  options,
  selectedIds,
  onPick,
}: {
  options: TargetOption[]
  selectedIds: string[]
  onPick: (seatId: string) => void
}) {
  const [reason, setReason] = useState<string | null>(null)
  const cols = options.length > 8 ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <div className="space-y-2">
      <div className={cn('grid gap-3', cols)}>
        {options.map(({ seat, disabled, reason: why }) => {
          const selected = selectedIds.includes(seat.id)
          return (
            <button
              key={seat.id}
              onClick={() => (disabled ? setReason(why ?? 'Not a legal target.') : onPick(seat.id))}
              aria-pressed={selected}
              aria-label={`${seat.name}${seat.alive ? '' : ', dead'}${selected ? ', selected' : ''}`}
              className={cn(
                'card-atmo flex min-h-[72px] flex-col justify-center rounded-xl border px-3 py-2 text-left transition-all duration-150',
                selected
                  ? 'border-2 border-[var(--accent)] shadow-[0_0_20px_var(--accent-glow)]'
                  : 'border-[var(--border-subtle)]',
                disabled && 'opacity-40',
              )}
            >
              <span
                className={cn(
                  'truncate text-sm font-medium',
                  !seat.alive && 'text-[var(--text-muted)] line-through',
                )}
              >
                {seat.name}
              </span>
              <span className="caption text-[var(--text-muted)]">
                {!seat.alive ? '✕ dead' : seat.marks.includes('silenced') ? '🔇 silenced' : 'alive'}
              </span>
            </button>
          )
        })}
      </div>

      {reason && (
        <p className="caption rounded-lg bg-[var(--bg-raised)] px-3 py-2 text-[var(--warn)]">
          {reason}
        </p>
      )}
    </div>
  )
}

/** Read-only roster, used on Dawn/Day/End. */
export function SeatList({
  seats,
  revealRoles,
  roleLabel,
}: {
  seats: Seat[]
  revealRoles?: boolean
  roleLabel: (seat: Seat) => string
}) {
  return (
    <ul className="space-y-2">
      {seats.map((seat) => (
        <li
          key={seat.id}
          className={cn(
            'card-atmo flex items-center justify-between rounded-xl border border-[var(--border-subtle)] px-4 py-3',
            !seat.alive && 'opacity-50',
          )}
        >
          <span className={cn('truncate text-sm', !seat.alive && 'line-through')}>{seat.name}</span>
          <span className="caption shrink-0 text-[var(--text-muted)]">
            {revealRoles ? roleLabel(seat) : seat.alive ? 'alive' : '✕ dead'}
          </span>
        </li>
      ))}
    </ul>
  )
}
