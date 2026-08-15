'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink, Notice, NotConfigured, Screen } from '@/components/ui'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth, signOut } from '@/lib/useAuth'
import { useGameStore } from '@/store/gameStore'
import { clearAppCache } from '@/lib/pwa'
import { SupportLink } from '@/components/SupportLink'

interface GameRow {
  id: string
  theme_id: string | null
  player_count: number
  status: string
  winner_faction: string | null
  started_at: string
  composition: Record<string, number> | null
}

export default function AccountPage() {
  const router = useRouter()
  const { email, isAdmin, loading } = useAuth()
  const [games, setGames] = useState<GameRow[] | null>(null)

  const localGame = useGameStore((s) => s.game)
  const cloudGameId = useGameStore((s) => s.cloudGameId)
  const { setTheme, setPlayerCount, setComposition } = useGameStore()

  const liveId = localGame && localGame.phase !== 'end' ? cloudGameId : null

  useEffect(() => {
    if (!supabase || !email) return
    supabase
      .from('games')
      .select('id, theme_id, player_count, status, winner_faction, started_at, composition')
      .order('started_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setGames((data as GameRow[]) ?? []))
  }, [email])

  /**
   * Set up a fresh game with the same theme and role board.
   *
   * Not a true "restore": finished games are stored with seat names stripped
   * (CLOUD_PLAN §14.2: they're the real names of guests who never signed up),
   * so there is nothing to restore *to*. Re-running the same setup is the
   * useful thing that data can honestly support, and it drops you at the seat
   * list to name this table's players.
   */
  function playAgain(row: GameRow) {
    if (row.theme_id) setTheme(row.theme_id)
    setPlayerCount(row.player_count)
    if (row.composition) setComposition(row.composition as never)
    router.push('/setup/seats')
  }

  return (
    <Screen
      title="Account"
      action={
        <>
          {email && (
            <Button variant="secondary" onClick={() => signOut().then(() => location.assign('/'))}>
              Sign out
            </Button>
          )}
          <ButtonLink href="/" variant="ghost">
            ← Home
          </ButtonLink>
        </>
      }
    >
      {!isSupabaseConfigured ? (
        <div className="pt-4">
          <NotConfigured />
        </div>
      ) : loading ? (
        <p className="caption breathe pt-16 text-center text-[var(--text-muted)]">Loading…</p>
      ) : !email ? (
        <div className="space-y-4 pt-4">
          <Notice>You&apos;re not signed in.</Notice>
          <ButtonLink href="/auth/sign-in">Sign in</ButtonLink>
        </div>
      ) : (
        <>
          <h2 className="display glow-sm text-3xl">Your account</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{email}</p>

          <div className="mt-5 space-y-3">
            <ButtonLink href="/themes" variant="secondary">
              My themes
            </ButtonLink>
            <ButtonLink href="/feedback" variant="secondary">
              Send feedback
            </ButtonLink>
            {/*
              The same screen a reset link lands on. Both cases are "a session
              exists, set a new password". A Google-only account has no password
              to change, and updateUser() says so plainly if they try.
            */}
            <ButtonLink href="/auth/update-password" variant="secondary">
              Change password
            </ButtonLink>
            <SupportLink />
            {isAdmin && (
              <ButtonLink href="/admin" variant="secondary">
                Open admin dashboard
              </ButtonLink>
            )}
          </div>

          {/*
            Offline-first apps go stale in ways users can't diagnose. One button
            beats explaining DevTools. Keeps localStorage, so an in-progress
            game survives.
          */}
          <button
            onClick={clearAppCache}
            className="caption mt-4 text-[var(--text-muted)] underline underline-offset-4"
          >
            App behaving oddly? Refresh offline data
          </button>

          {/* A game still in flight is the most useful thing on this screen. */}
          {localGame && localGame.phase !== 'end' && (
            <div className="mt-8">
              <ButtonLink href="/play">
                ↻ Resume · {localGame.phase} {localGame.dayNumber}
              </ButtonLink>
            </div>
          )}

          <h3 className="display glow-sm mt-10 text-xl">Game history</h3>
          {games === null ? (
            <p className="caption mt-3 text-[var(--text-muted)]">Loading…</p>
          ) : games.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              No games yet. Host one and it&apos;ll appear here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {games.map((g) => {
                const isLive = g.id === liveId
                return (
                  <li
                    key={g.id}
                    className="card-atmo rounded-xl border border-[var(--border-subtle)] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {g.theme_id ?? 'Custom theme'} · {g.player_count} players
                        </p>
                        <p className="caption text-[var(--text-muted)]">
                          {new Date(g.started_at).toLocaleDateString()} ·{' '}
                          {isLive ? 'in progress' : g.status}
                        </p>
                      </div>
                      {g.winner_faction && !isLive && (
                        <span className="caption shrink-0 text-[var(--accent)]">
                          {g.winner_faction} won
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5">
                      {isLive ? (
                        <ButtonLink href="/play" className="!min-h-11 !text-sm">
                          ↻ Resume this game
                        </ButtonLink>
                      ) : (
                        <Button
                          variant="secondary"
                          className="!min-h-11 !text-sm"
                          onClick={() => playAgain(g)}
                        >
                          Play again with these roles
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </Screen>
  )
}
