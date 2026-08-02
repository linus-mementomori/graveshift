'use client'

import { ButtonLink, Screen } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'

export default function SeatsPage() {
  const { playerCount, names, setName } = useGameStore()

  return (
    <Screen
      title="Setup"
      step="4 of 5"
      action={<ButtonLink href="/setup/deal">Deal the roles →</ButtonLink>}
    >
      <h2 className="display glow-sm text-3xl">Who&apos;s here?</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Enter them in the order they&apos;re sitting. You&apos;ll be reading this list in the dark.
      </p>

      <ol className="mt-6 space-y-2">
        {Array.from({ length: playerCount }, (_, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="caption w-5 shrink-0 text-right text-[var(--text-muted)] tabular-nums">
              {i + 1}
            </span>
            <input
              value={names[i] ?? ''}
              onChange={(e) => setName(i, e.target.value)}
              placeholder={`Player ${i + 1}`}
              className="h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 text-base outline-none focus:border-[var(--accent)]"
            />
          </li>
        ))}
      </ol>
    </Screen>
  )
}
