'use client'

import { balanceRead, ruleViolations, voteMarginCheck, type Composition } from '@/engine/balance'

/**
 * DESIGN.md §5.7. Shows the heuristic read now; Phase 4 swaps in real simulated
 * win rates (GAME_DESIGN §10.5) once the Worker lands.
 */
export function BalanceMeter({ composition }: { composition: Composition }) {
  const read = balanceRead(composition)
  const violations = ruleViolations(composition)
  const margin = voteMarginCheck(composition)

  // map score −5…+5 onto 0…100%
  const pos = Math.max(4, Math.min(96, ((read.score + 5) / 10) * 100))

  return (
    <div className="space-y-2">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-[var(--danger)] via-[var(--warn)] to-[var(--safe)]">
        <div
          className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-[var(--text-primary)] transition-[left] duration-300"
          style={{ left: `${pos}%` }}
        />
      </div>

      <p className="text-sm text-[var(--text-secondary)]">{read.copy}</p>

      {!margin.afterOne && (
        <p className="rounded-lg bg-[var(--danger)]/15 px-3 py-2 text-sm text-[var(--danger)]">
          The wolves can out-vote the town before anyone learns anything.
        </p>
      )}

      {violations.length > 0 && (
        <ul className="space-y-1">
          {violations.slice(0, 3).map((v) => (
            <li key={v} className="text-xs text-[var(--warn)]">
              ⚠ {v}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
