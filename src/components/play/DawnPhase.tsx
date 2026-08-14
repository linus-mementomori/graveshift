'use client'

import { Button, CueStrip, Screen, Speak, Notice } from '@/components/ui'
import { SeatGrid } from '@/components/SeatGrid'
import { RevealPanel } from '@/components/RevealPanel'
import { useGameStore } from '@/store/gameStore'
import { getTheme, roleName } from '@/themes'
import { CUES } from '@/audio/cues'
import { livingSeats } from '@/engine/machine'
import type { GameState } from '@/engine/types'
import { deathLine } from './narration'

/**
 * DAWN, GAME_DESIGN.md §6.
 * Deliberately sparse. If nobody died, the emptiness IS the design (DESIGN §7.8).
 */
export function DawnPhase({ game }: { game: GameState }) {
  const { lastDeaths, lastInfo, pendingHunterIds, resolveHunter, goDay } = useGameStore()
  const theme = getTheme(game.themeId)
  const alive = livingSeats(game)

  // A Hunter died and still owes a shot. Resolve it before the day (§9).
  const hunterId = pendingHunterIds[0]
  if (hunterId) {
    const hunter = game.seats.find((s) => s.id === hunterId)
    return (
      <Screen title={`Dawn ${game.dayNumber}`} step="the Hunter fires">
        <div className="pt-6">
          <CueStrip text="One shot. Make them feel it." />
          <div className="mt-6">
            <Speak>
              {hunter?.name}, you have one shot left. Who goes with you?
            </Speak>
          </div>
          <div className="mt-8">
            <SeatGrid
              options={alive.map((seat) => ({ seat, disabled: false }))}
              selectedIds={[]}
              onPick={(seatId) => resolveHunter(hunterId, seatId)}
            />
          </div>
          <div className="mt-6">
            <Button variant="secondary" onClick={() => resolveHunter(hunterId, null)}>
              They fire into the dark (no target)
            </Button>
          </div>
        </div>
      </Screen>
    )
  }

  const sleepwalker = lastInfo.find((i) => i.beatId === 'sleepwalker_stir')

  return (
    <Screen
      title={`Dawn ${game.dayNumber}`}
      step={`${alive.length} alive`}
      action={
        <>
          <Button onClick={goDay}>Begin the day →</Button>
        </>
      }
    >
      <CueStrip text={theme.cueOverrides.DAWN ?? CUES.DAWN.text} cueId="DAWN" />

      <div className="mt-8">
        <Speak>{theme.narration.dawn}</Speak>
      </div>

      <div className="mt-10 space-y-4">
        {lastDeaths.length === 0 ? (
          <>
            <Speak>{theme.narration.noDeath}</Speak>
            <p className="caption text-[var(--text-muted)]">
              {theme.cueOverrides.NO_DEATH ?? CUES.NO_DEATH.text}
            </p>
          </>
        ) : (
          lastDeaths.map((d) => {
            const seat = game.seats.find((s) => s.id === d.seatId)
            if (!seat) return null
            return (
              <div key={d.seatId} className="space-y-1">
                <p className="display glow text-3xl text-[var(--danger)]">{seat.name}</p>
                <p className="speak-sm !text-base text-[var(--text-secondary)]">
                  {deathLine(theme, game, d.seatId, d.reason)}
                </p>
                {game.settings.revealRoleOnDeath && (
                  <p className="caption text-[var(--text-muted)]">
                    was the {roleName(theme, seat.roleId)}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      {sleepwalker && (
        <div className="mt-8">
          <p className="caption mb-2 text-[var(--text-muted)]">For the Sleepwalker only</p>
          <RevealPanel label={sleepwalker.label} detail={sleepwalker.detail} armSeconds={2} />
        </div>
      )}

      {game.seats.some((s) => s.alive && s.marks.includes('silenced')) && (
        <div className="mt-8">
          <Notice>
            Silenced today:{' '}
            {game.seats
              .filter((s) => s.alive && s.marks.includes('silenced'))
              .map((s) => s.name)
              .join(', ')}
            . They may not speak or vote.
          </Notice>
        </div>
      )}
    </Screen>
  )
}
