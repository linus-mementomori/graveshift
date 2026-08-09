'use client'

import { cn } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import type { GameState } from '@/engine/types'

/**
 * Per-seat scratch notes.
 *
 * "Claimed Seer on day 1", "was very quiet after the vote". The app already
 * remembers the mechanical state; this is for the social read, which is the one
 * thing it cannot infer.
 *
 * Notes are never uploaded. They sit alongside seat names, which are stripped
 * before any cloud sync (CLOUD_PLAN §14.2).
 */
export function NotesSheet({ game }: { game: GameState }) {
  const setSeatNote = useGameStore((s) => s.setSeatNote)

  return (
    <div className="space-y-2 pt-1">
      <p className="caption text-[var(--text-muted)]">Saved as you type. Never leaves this device.</p>
      {game.seats.map((seat) => (
        <div
          key={seat.id}
          className={cn(
            'rounded-xl border border-[var(--border-subtle)] px-3 py-2',
            !seat.alive && 'opacity-45',
          )}
        >
          <label className="block">
            <span
              className={cn(
                'caption text-[var(--text-secondary)]',
                !seat.alive && 'line-through',
              )}
            >
              {seat.name}
              {!seat.alive && ' · out'}
            </span>
            <input
              value={seat.notes ?? ''}
              onChange={(e) => setSeatNote(seat.id, e.target.value)}
              placeholder="claimed Seer, went quiet after the vote…"
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-2.5 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>
      ))}
    </div>
  )
}
