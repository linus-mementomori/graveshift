'use client'

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Notice, NotConfigured, Screen } from '@/components/ui'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth, signOut } from '@/lib/useAuth'

interface GameRow {
  id: string
  theme_id: string | null
  player_count: number
  status: string
  winner_faction: string | null
  started_at: string
}

export default function AccountPage() {
  const { email, isAdmin, loading } = useAuth()
  const [games, setGames] = useState<GameRow[] | null>(null)

  useEffect(() => {
    if (!supabase || !email) return
    supabase
      .from('games')
      .select('id, theme_id, player_count, status, winner_faction, started_at')
      .order('started_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setGames(data ?? []))
  }, [email])

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

          {isAdmin && (
            <div className="mt-5">
              <ButtonLink href="/admin" variant="secondary">
                Open admin dashboard
              </ButtonLink>
            </div>
          )}

          <h3 className="display glow-sm mt-10 text-xl">Game history</h3>
          {games === null ? (
            <p className="caption mt-3 text-[var(--text-muted)]">Loading…</p>
          ) : games.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              No games yet. History starts recording once the play engine lands — see
              ROADMAP Phase&nbsp;1.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {games.map((g) => (
                <li
                  key={g.id}
                  className="card-atmo flex items-center justify-between rounded-xl border border-[var(--border-subtle)] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {g.theme_id ?? 'Custom theme'} · {g.player_count} players
                    </p>
                    <p className="caption text-[var(--text-muted)]">
                      {new Date(g.started_at).toLocaleDateString()} · {g.status}
                    </p>
                  </div>
                  {g.winner_faction && (
                    <span className="caption shrink-0 text-[var(--accent)]">
                      {g.winner_faction} won
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Screen>
  )
}
