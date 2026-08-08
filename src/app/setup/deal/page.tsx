'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink, Screen, Speak, cn } from '@/components/ui'
import { RevealPanel } from '@/components/RevealPanel'
import { useGameStore } from '@/store/gameStore'
import { getTheme, roleName, roleFlavour } from '@/themes'
import { ROLES } from '@/engine/roles'

/**
 * The deal — GAME_DESIGN.md §6 (S5), DESIGN.md §7.6.
 *
 * One player at a time. No back-navigation into an already-dealt seat: it would
 * leak. The role is never on screen at the same time as the next player's name.
 */
export default function DealPage() {
  const router = useRouter()
  const { game, startGame, themeId, playerCount, hydrated } = useGameStore()
  const theme = getTheme(themeId)
  const [index, setIndex] = useState(0)
  const [seen, setSeen] = useState(false)

  // Deal on arrival so the roles exist before the first reveal — but only
  // AFTER hydration, or we'd deal a fresh game over one already in progress.
  useEffect(() => {
    if (hydrated && !game) startGame()
  }, [hydrated, game, startGame])

  if (!game) {
    return (
      <Screen title="Setup" step="5 of 5">
        <p className="caption breathe pt-16 text-center text-[var(--text-muted)]">Shuffling…</p>
      </Screen>
    )
  }

  const seat = game.seats[index]
  const isLast = index === game.seats.length - 1
  const role = ROLES[seat.roleId]

  // Teammates a player is allowed to learn during the deal (GAME_DESIGN §4.1).
  const knows =
    role.faction === 'mafia' && seat.roleId !== 'minion'
      ? game.seats.filter(
          (s) => s.id !== seat.id && ROLES[s.roleId].faction === 'mafia' && s.roleId !== 'minion',
        )
      : seat.roleId === 'minion'
        ? game.seats.filter((s) => s.roleId === 'werewolf' || s.roleId === 'alpha')
        : []

  const execTarget =
    seat.roleId === 'executioner'
      ? game.seats.find((s) => s.id === seat.execTargetId)
      : undefined

  const detail = [
    roleFlavour(theme, seat.roleId),
    knows.length > 0 ? `With you: ${knows.map((s) => s.name).join(', ')}.` : '',
    execTarget ? `Your target: ${execTarget.name}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  function next() {
    if (isLast) {
      router.push('/play')
      return
    }
    setIndex((i) => i + 1)
    setSeen(false)
  }

  return (
    <Screen
      title="The deal"
      step={`${index + 1} of ${game.seats.length}`}
      action={
        <Button onClick={next} disabled={!seen}>
          {seen
            ? isLast
              ? 'Everyone has seen — begin Night 1'
              : `${seat.name} has seen it →`
            : 'Hold the card above to reveal'}
        </Button>
      }
    >
      <div className="pt-6 text-center">
        <p className="caption text-[var(--text-muted)]">Pass the phone to</p>
        <h2 className="display glow mt-2 text-4xl text-[var(--accent)]">{seat.name}</h2>
      </div>

      <div className="mt-8">
        {/* key forces a remount per seat so the cover-the-screen countdown
            re-arms for every player, not just the first (DESIGN §5.4). */}
        <RevealPanel
          key={seat.id}
          label={roleName(theme, seat.roleId)}
          detail={detail}
          onRevealed={() => setSeen(true)}
        />
      </div>

      <div className="mt-6 flex justify-center gap-1.5">
        {game.seats.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              i < index
                ? 'bg-[var(--accent)]'
                : i === index
                  ? 'bg-[var(--text-primary)]'
                  : 'bg-[var(--border-strong)]',
            )}
          />
        ))}
      </div>

      <p className="caption mt-6 text-center text-[var(--text-muted)]">
        {theme.name} · {playerCount} players · Night 0 {game.settings.nightZero ? 'on' : 'off'}
      </p>
    </Screen>
  )
}
