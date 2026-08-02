'use client'

import { Button, ButtonLink, Screen, cn } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { countByFaction, totalPlayers } from '@/engine/balance'

const QUICK = [6, 8, 10, 12, 15]

export default function PlayerCountPage() {
  const { playerCount, setPlayerCount, composition } = useGameStore()
  const { village, mafia, neutral } = countByFaction(composition)
  const powerish = village - (composition.villager ?? 0)

  return (
    <Screen
      title="Setup"
      step="1 of 5"
      action={<ButtonLink href="/setup/theme">Choose a world →</ButtonLink>}
    >
      <h2 className="display glow-sm text-3xl">How many are playing?</h2>

      <div className="mt-12 flex items-center justify-center gap-8">
        <Button
          variant="secondary"
          aria-label="One fewer player"
          className="!h-16 !w-16 !min-h-16 !rounded-full !px-0 text-3xl"
          onClick={() => setPlayerCount(playerCount - 1)}
          disabled={playerCount <= 5}
        >
          −
        </Button>
        <span className="display glow w-24 text-center text-7xl tabular-nums text-[var(--accent)]">
          {playerCount}
        </span>
        <Button
          variant="secondary"
          aria-label="One more player"
          className="!h-16 !w-16 !min-h-16 !rounded-full !px-0 text-3xl"
          onClick={() => setPlayerCount(playerCount + 1)}
          disabled={playerCount >= 20}
        >
          +
        </Button>
      </div>

      <div className="mt-8 flex justify-center gap-2">
        {QUICK.map((n) => (
          <button
            key={n}
            onClick={() => setPlayerCount(n)}
            className={cn(
              'h-11 w-11 rounded-lg border text-sm tabular-nums transition-colors',
              n === playerCount
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-[var(--border-subtle)] text-[var(--text-secondary)]',
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-[var(--text-secondary)]">
        {mafia} mafia · {powerish} power {powerish === 1 ? 'role' : 'roles'} ·{' '}
        {composition.villager ?? 0} plain
        {neutral > 0 && ` · ${neutral} neutral`}
      </p>
      <p className="caption mt-2 text-center text-[var(--text-muted)]">
        recommended setup for {totalPlayers(composition)}
      </p>
    </Screen>
  )
}
