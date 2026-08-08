'use client'

import { useRouter } from 'next/navigation'
import { Button, CueStrip, Screen, Speak, cn } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { getTheme, roleName } from '@/themes'
import { CUES } from '@/audio/cues'
import { ROLES } from '@/engine/roles'
import { isKingmakerFinish } from '@/engine/winCheck'
import type { GameState } from '@/engine/types'

/**
 * END — GAME_DESIGN.md §6, §10.7.
 * The log is the real payoff: it's what the table argues about for ten minutes.
 */
export function EndPhase({ game }: { game: GameState }) {
  const router = useRouter()
  const { newGame, playAgain } = useGameStore()
  const theme = getTheme(game.themeId)
  const winner = game.winner

  const victoryCue =
    winner?.faction === 'village'
      ? CUES.VICTORY_VILLAGE
      : winner?.faction === 'mafia'
        ? CUES.VICTORY_MAFIA
        : CUES.VICTORY_NEUTRAL

  const victoryLine =
    winner?.faction === 'village'
      ? theme.victory.village
      : winner?.faction === 'mafia'
        ? theme.victory.mafia
        : theme.victory.neutral

  const factionLabel =
    winner?.faction === 'village'
      ? theme.factionNames.village
      : winner?.faction === 'mafia'
        ? theme.factionNames.mafia
        : theme.factionNames.neutral

  const kingmaker = winner ? isKingmakerFinish(game, winner) : false

  return (
    <Screen
      title="Game over"
      action={
        <>
          <Button onClick={playAgain}>Rematch — same roles, reshuffled</Button>
          <Button
            variant="secondary"
            onClick={() => {
              newGame()
              router.push('/')
            }}
          >
            New game
          </Button>
        </>
      }
    >
      <CueStrip text={theme.cueOverrides[victoryCue.id] ?? victoryCue.text} />

      <div className="mt-8 text-center">
        <p className="caption text-[var(--text-muted)]">Victory</p>
        <h2 className="display glow-lg pulse-glow mt-2 text-5xl text-[var(--accent)]">
          {factionLabel}
        </h2>
      </div>

      <div className="mt-8">
        <Speak>{victoryLine}</Speak>
      </div>

      {winner?.message && (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">{winner.message}</p>
      )}

      {kingmaker && (
        <p className="caption mt-4 text-[var(--warn)]">
          ⚠ Kingmaker finish — a player who could not win chose who did. That&apos;s the setup&apos;s
          doing, not theirs.
        </p>
      )}

      <h3 className="display glow-sm mt-10 text-xl">Everyone</h3>
      <ul className="mt-3 space-y-2">
        {game.seats.map((seat) => {
          const won = ROLES[seat.roleId].faction === winner?.faction
          return (
            <li
              key={seat.id}
              className={cn(
                'card-atmo flex items-center justify-between rounded-xl border px-4 py-3',
                won
                  ? 'border-[var(--accent)] shadow-[0_0_16px_var(--accent-glow)]'
                  : 'border-[var(--border-subtle)]',
                !seat.alive && 'opacity-60',
              )}
            >
              <span className={cn('truncate text-sm', !seat.alive && 'line-through')}>
                {seat.name}
              </span>
              <span
                className={cn(
                  'caption shrink-0',
                  won ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                )}
              >
                {roleName(theme, seat.roleId)}
              </span>
            </li>
          )
        })}
      </ul>

      <h3 className="display glow-sm mt-10 text-xl">The night-by-night</h3>
      {game.log.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">Nothing was recorded.</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {game.log.map((entry, i) => (
            <li
              key={i}
              className={cn(
                'text-sm',
                entry.decisive
                  ? 'font-medium text-[var(--accent)]'
                  : 'text-[var(--text-secondary)]',
              )}
            >
              — {entry.text}
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}
