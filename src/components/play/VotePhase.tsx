'use client'

import { Button, CueStrip, Screen, Speak, Notice, cn } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { getTheme, roleName } from '@/themes'
import { CUES } from '@/audio/cues'
import { livingSeats, tallyVote, voterWeight, MIN_VOTES_TO_EXECUTE } from '@/engine/machine'
import type { GameState } from '@/engine/types'
import { deathLine } from './narration'

/**
 * VOTE + DUSK, GAME_DESIGN.md §6.
 *
 * The host enters a count per nominee. The app owns the arithmetic: silenced
 * seats contribute 0 voting weight and a revealed Mayor contributes 2.
 */
export function VotePhase({ game }: { game: GameState }) {
  const { votes, setVote, clearVotes, doExecute, skipVote } = useGameStore()
  const theme = getTheme(game.themeId)
  const alive = livingSeats(game)

  const weight = voterWeight(game)
  const tally = tallyVote(game, votes)
  const cast = Object.values(votes).reduce((n, v) => n + v, 0)

  // Plurality rule: the bar is measured against whoever is currently ahead,
  // not against a fixed majority. That is the number players are watching.
  const leadCount = Math.max(0, ...alive.map((s) => votes[s.id] ?? 0))
  const doomedId = tally.executedId

  const target = tally.executedId
    ? game.seats.find((s) => s.id === tally.executedId)
    : undefined

  return (
    <Screen
      title={`Vote · Day ${game.dayNumber}`}
      step={`${cast}/${weight} cast · most votes, min ${MIN_VOTES_TO_EXECUTE}`}
      action={
        <>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={clearVotes}>
              ↺ Clear
            </Button>
            <Button variant="secondary" onClick={skipVote}>
              No execution
            </Button>
          </div>
          <Button
            variant="danger"
            disabled={!target}
            onClick={() => target && doExecute(target.id)}
          >
            {target
              ? `Execute ${target.name}`
              : tally.tie
                ? 'Tied, nobody dies'
                : `Needs ${MIN_VOTES_TO_EXECUTE}+ votes`}
          </Button>
        </>
      }
    >
      <CueStrip text={theme.cueOverrides.VOTE ?? CUES.VOTE.text} cueId="VOTE" />

      <div className="mt-8">
        <Speak>{theme.narration.vote}</Speak>
      </div>

      {tally.tie && (
        <div className="mt-6">
          <Notice tone="error">
            Tied at the top. <strong>Nobody is executed</strong>. Everyone tied walks away.
            Keep voting to break it, or move on and let the night come.
          </Notice>
        </div>
      )}

      <div className="mt-8 space-y-2">
        {alive.map((seat) => {
          const n = votes[seat.id] ?? 0
          const silenced = seat.marks.includes('silenced')
          const pct = leadCount > 0 ? Math.min(100, (n / leadCount) * 100) : 0
          const doomed = seat.id === doomedId
          return (
            <div
              key={seat.id}
              className={cn(
                'card-atmo rounded-xl border px-3 py-2.5',
                doomed ? 'border-[var(--danger)]' : 'border-[var(--border-subtle)]',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {seat.name}
                    {seat.roleId === 'mayor' && seat.marks.includes('revealed') && (
                      <span className="caption ml-2 text-[var(--accent)]">2×</span>
                    )}
                  </p>
                  {silenced && (
                    <p className="caption text-[var(--text-muted)]">🔇 cannot vote</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  aria-label={`One fewer vote for ${seat.name}`}
                  className="!h-10 !w-10 !min-h-10 !rounded-lg !px-0"
                  onClick={() => setVote(seat.id, n - 1)}
                  disabled={n === 0}
                >
                  −
                </Button>
                <span className="w-5 text-center text-sm tabular-nums">{n}</span>
                <Button
                  variant="ghost"
                  aria-label={`One more vote for ${seat.name}`}
                  className="!h-10 !w-10 !min-h-10 !rounded-lg !px-0"
                  onClick={() => setVote(seat.id, n + 1)}
                  disabled={cast >= weight}
                >
                  +
                </Button>
              </div>
              {n > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-void)]">
                  <div
                    className={cn(
                      'h-full transition-[width] duration-250',
                      doomed ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="caption mt-6 leading-relaxed text-[var(--text-muted)]">
        Most votes is executed, minimum {MIN_VOTES_TO_EXECUTE}. A tie at the top saves everyone
        tied. {weight} votes available.
      </p>
    </Screen>
  )
}

/** DUSK. The reveal after an execution, then back into the night. */
export function DuskPhase({ game }: { game: GameState }) {
  const { lastDeaths, pendingHunterIds, resolveHunter, continueToNight } = useGameStore()
  const theme = getTheme(game.themeId)
  const alive = livingSeats(game)

  const hunterId = pendingHunterIds[0]
  if (hunterId) {
    const hunter = game.seats.find((s) => s.id === hunterId)
    return (
      <Screen title="Dusk" step="the Hunter fires">
        <div className="pt-6">
          <CueStrip text="One shot. Make them feel it." />
          <div className="mt-6">
            <Speak>{hunter?.name}, you have one shot left. Who goes with you?</Speak>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {alive.map((s) => (
              <Button key={s.id} variant="secondary" onClick={() => resolveHunter(hunterId, s.id)}>
                {s.name}
              </Button>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => resolveHunter(hunterId, null)}>
              Fire into the dark
            </Button>
          </div>
        </div>
      </Screen>
    )
  }

  const executed = lastDeaths[0]
    ? game.seats.find((s) => s.id === lastDeaths[0].seatId)
    : undefined

  return (
    <Screen
      title="Dusk"
      step={`${alive.length} alive`}
      action={<Button onClick={continueToNight}>Night {game.dayNumber + 1} falls →</Button>}
    >
      <CueStrip text={theme.cueOverrides.EXECUTION ?? CUES.EXECUTION.text} cueId="EXECUTION" />

      <div className="mt-8">
        <Speak>{theme.narration.execution}</Speak>
      </div>

      {executed ? (
        <div className="mt-10">
          <p className="display glow text-4xl text-[var(--danger)]">{executed.name}</p>
          {/*
            Every theme has always carried a deathFlavour.execution line and none
            of them was ever rendered: the vote was the one death announced with
            no flavour at all. It now reads the way a night death reads at dawn.
          */}
          <p className="speak-sm mt-3 !text-lg text-[var(--text-secondary)]">
            {deathLine(theme, game, executed.id, 'execution')}
          </p>
          {game.settings.revealRoleOnDeath && (
            <p className="caption mt-2 text-[var(--text-muted)]">
              was the {roleName(theme, executed.roleId)}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-10">
          <Notice>Nobody was executed. The night comes anyway.</Notice>
        </div>
      )}
    </Screen>
  )
}
