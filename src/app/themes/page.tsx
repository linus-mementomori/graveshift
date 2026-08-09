'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, ButtonLink, Notice, NotConfigured, Screen } from '@/components/ui'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { listMyThemes, deleteTheme, type CustomTheme } from '@/lib/cloud/themes'
import { THEMES } from '@/themes'

export default function MyThemesPage() {
  const { email, loading } = useAuth()
  const [themes, setThemes] = useState<CustomTheme[] | null>(null)

  useEffect(() => {
    if (!email) return
    listMyThemes().then(setThemes)
  }, [email])

  async function remove(id: string) {
    if (!confirm('Delete this theme? Games already played with it keep their history.')) return
    if (await deleteTheme(id)) setThemes((t) => (t ?? []).filter((x) => x.id !== id))
  }

  if (!isSupabaseConfigured) {
    return (
      <Screen title="My themes" action={<ButtonLink href="/" variant="ghost">← Home</ButtonLink>}>
        <div className="pt-4">
          <NotConfigured />
        </div>
      </Screen>
    )
  }

  if (loading) {
    return (
      <Screen title="My themes">
        <p className="caption breathe pt-16 text-center text-[var(--text-muted)]">Loading…</p>
      </Screen>
    )
  }

  if (!email) {
    return (
      <Screen title="My themes" action={<ButtonLink href="/auth/sign-in">Sign in</ButtonLink>}>
        <div className="space-y-4 pt-4">
          <Notice>
            Themes are saved to your account, so they follow you between devices.
            Sign in to make one.
          </Notice>
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      title="My themes"
      action={
        <>
          <ButtonLink href="/themes/editor">＋ New theme</ButtonLink>
          <ButtonLink href="/account" variant="ghost">
            ← Account
          </ButtonLink>
        </>
      }
    >
      <h2 className="display glow-sm text-3xl">Your worlds</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        A theme changes every word and colour: the names, the flavour, and every line you read
        aloud. It never changes the rules.
      </p>

      {themes === null ? (
        <p className="caption mt-6 text-[var(--text-muted)]">Loading…</p>
      ) : themes.length === 0 ? (
        <div className="mt-6 space-y-4">
          <Notice>You haven&apos;t made a theme yet.</Notice>
          <p className="text-sm text-[var(--text-secondary)]">
            The quickest start is to copy one of the built-ins and rewrite its script:
          </p>
          <ul className="space-y-2">
            {THEMES.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/themes/editor?base=${t.id}`}
                  className="card-atmo flex items-center justify-between rounded-xl border border-[var(--border-subtle)] px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{t.name}</span>
                    <span className="caption text-[var(--text-muted)]">{t.category}</span>
                  </span>
                  <span className="caption shrink-0 text-[var(--accent)]">Copy →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {themes.map((t) => (
            <li
              key={t.id}
              className="card-atmo rounded-xl border border-[var(--border-subtle)] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="display glow-sm truncate text-base text-[var(--accent)]">
                    {t.theme.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                    {t.theme.tagline || 'No tagline'}
                  </p>
                  <p className="caption mt-1 text-[var(--text-muted)]">
                    {t.theme.category} · edited {new Date(t.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Link
                    href={`/themes/editor?id=${t.id}`}
                    className="caption text-[var(--accent)] underline underline-offset-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => remove(t.id)}
                    className="caption text-[var(--text-muted)] underline underline-offset-4"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Button variant="secondary" onClick={() => (location.href = '/themes/editor')}>
          Start one from scratch
        </Button>
      </div>
    </Screen>
  )
}
