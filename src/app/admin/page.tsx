'use client'

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Notice, NotConfigured, Screen } from '@/components/ui'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

/**
 * Admin dashboard.
 *
 * This route's JavaScript is PUBLIC — with `output: 'export'` every visitor can
 * download it. That is fine and expected: the isAdmin check below only decides
 * what we bother to render. The real boundary is `public.is_admin()` in the RLS
 * policies (supabase/schema.sql), so a non-admin who opens this page gets empty
 * results from Postgres, not hidden ones from React.
 *
 * CLOUD_PLAN §10: aggregates first, per-host names behind an explicit toggle.
 */

interface RecentGame {
  id: string
  display_name: string | null
  theme_id: string | null
  player_count: number
  status: string
  winner_faction: string | null
  started_at: string
}

interface Stats {
  hosts: number
  games: number
  completed: number
  thisWeek: number
  customThemes: number
  topThemes: [string, number][]
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="card-atmo rounded-xl border border-[var(--border-subtle)] px-4 py-4">
      <div className="display glow-sm text-3xl tabular-nums text-[var(--accent)]">{value}</div>
      <div className="caption mt-1 text-[var(--text-muted)]">{label}</div>
    </div>
  )
}

export default function AdminPage() {
  const { email, isAdmin, loading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentGame[] | null>(null)
  const [showHosts, setShowHosts] = useState(false)

  useEffect(() => {
    if (!supabase || !isAdmin) return
    const since = new Date(Date.now() - WEEK_MS).toISOString()

    async function load() {
      const db = supabase!
      const countOf = (table: string) =>
        db.from(table).select('*', { count: 'exact', head: true })

      const [hosts, games, completed, week, themes, themeRows] = await Promise.all([
        countOf('profiles'),
        countOf('games'),
        db.from('games').select('*', { count: 'exact', head: true }).eq('status', 'complete'),
        db.from('games').select('*', { count: 'exact', head: true }).gte('started_at', since),
        countOf('custom_themes'),
        db.from('games').select('theme_id').limit(1000),
      ])

      const tally = new Map<string, number>()
      for (const row of themeRows.data ?? []) {
        const id = (row as { theme_id: string | null }).theme_id ?? 'custom'
        tally.set(id, (tally.get(id) ?? 0) + 1)
      }

      setStats({
        hosts: hosts.count ?? 0,
        games: games.count ?? 0,
        completed: completed.count ?? 0,
        thisWeek: week.count ?? 0,
        customThemes: themes.count ?? 0,
        topThemes: [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      })
    }

    load()
  }, [isAdmin])

  async function loadHosts() {
    setShowHosts(true)
    if (!supabase) return
    const since = new Date(Date.now() - WEEK_MS).toISOString()
    const { data } = await supabase
      .from('admin_recent_games')
      .select('id, display_name, theme_id, player_count, status, winner_faction, started_at')
      .gte('started_at', since)
      .limit(50)
    setRecent((data as RecentGame[]) ?? [])
  }

  if (!isSupabaseConfigured) {
    return (
      <Screen title="Admin" action={<ButtonLink href="/" variant="ghost">← Home</ButtonLink>}>
        <div className="pt-4">
          <NotConfigured />
        </div>
      </Screen>
    )
  }

  if (loading) {
    return (
      <Screen title="Admin">
        <p className="caption breathe pt-16 text-center text-[var(--text-muted)]">Loading…</p>
      </Screen>
    )
  }

  if (!isAdmin) {
    return (
      <Screen
        title="Admin"
        action={
          <ButtonLink href={email ? '/account' : '/auth/sign-in'}>
            {email ? '← Account' : 'Sign in'}
          </ButtonLink>
        }
      >
        <div className="pt-4">
          <Notice>
            {email
              ? 'This account does not have admin access.'
              : 'Sign in with an admin account to view this dashboard.'}
          </Notice>
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      title="Admin"
      step="last 7 days"
      action={<ButtonLink href="/account" variant="ghost">← Account</ButtonLink>}
    >
      <h2 className="display glow-sm text-3xl">Dashboard</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Signed in as {email}. Figures come straight from Postgres under RLS.
      </p>

      {!stats ? (
        <p className="caption mt-8 text-[var(--text-muted)]">Loading…</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Stat value={stats.hosts} label="Registered hosts" />
            <Stat value={stats.thisWeek} label="Games this week" />
            <Stat value={stats.games} label="Games all time" />
            <Stat value={stats.completed} label="Played to a winner" />
            <Stat value={stats.customThemes} label="Custom themes" />
            <Stat
              value={stats.games ? `${Math.round((stats.completed / stats.games) * 100)}%` : '—'}
              label="Completion rate"
            />
          </div>

          <h3 className="display glow-sm mt-10 text-xl">Most-used themes</h3>
          {stats.topThemes.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              No games recorded yet — sync lands with ROADMAP Phase&nbsp;1.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {stats.topThemes.map(([id, n]) => (
                <li key={id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm">{id}</span>
                  <span
                    className="h-2 rounded-full bg-[var(--accent)]"
                    style={{ width: `${(n / stats.topThemes[0][1]) * 60}%` }}
                  />
                  <span className="caption tabular-nums text-[var(--text-muted)]">{n}</span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="display glow-sm mt-10 text-xl">Who played this week</h3>
          {!showHosts ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">
                Hidden by default — this section names individual hosts.
              </p>
              <Button variant="secondary" onClick={loadHosts}>
                Show hosts
              </Button>
            </div>
          ) : recent === null ? (
            <p className="caption mt-3 text-[var(--text-muted)]">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">No games in the last 7 days.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recent.map((g) => (
                <li
                  key={g.id}
                  className="card-atmo flex items-center justify-between rounded-xl border border-[var(--border-subtle)] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{g.display_name ?? 'Unnamed host'}</p>
                    <p className="caption text-[var(--text-muted)]">
                      {g.theme_id ?? 'custom'} · {g.player_count}p ·{' '}
                      {new Date(g.started_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="caption shrink-0 text-[var(--text-muted)]">{g.status}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Screen>
  )
}
