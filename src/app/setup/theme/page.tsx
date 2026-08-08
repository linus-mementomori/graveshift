'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ButtonLink, Screen, cn } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { THEMES, registerCustomTheme } from '@/themes'
import { useAuth } from '@/lib/useAuth'
import { listMyThemes, type CustomTheme } from '@/lib/cloud/themes'
import type { Theme } from '@/themes/types'

export default function ThemePage() {
  const { themeId, setTheme } = useGameStore()
  const { email } = useAuth()
  const [mine, setMine] = useState<CustomTheme[]>([])

  // Custom themes are registered into the theme registry as they load, so every
  // play screen can keep calling getTheme(id) without knowing the difference.
  useEffect(() => {
    if (!email) return
    listMyThemes().then((rows) => {
      for (const row of rows) registerCustomTheme(row.theme)
      setMine(rows)
    })
  }, [email])

  const Card = ({ theme, custom }: { theme: Theme; custom?: boolean }) => {
    const selected = theme.id === themeId
    return (
      <button
        onClick={() => setTheme(theme.id)}
        data-theme={custom ? undefined : theme.id}
        aria-pressed={selected}
        className={cn(
          'card-atmo flex min-h-32 flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200',
          selected
            ? 'border-2 border-[var(--accent)] shadow-[0_0_24px_var(--accent-glow)]'
            : 'border-[var(--border-subtle)]',
        )}
      >
        <span className="display glow-sm text-base leading-tight text-[var(--accent)]">
          {theme.name}
        </span>
        <span className="text-xs leading-snug text-[var(--text-secondary)]">{theme.tagline}</span>
        <span className="caption text-[var(--text-muted)]">
          {custom ? `yours · ${theme.category}` : theme.category}
        </span>
      </button>
    )
  }

  return (
    <Screen
      title="Setup"
      step="2 of 5"
      action={<ButtonLink href="/setup/roles">Roles →</ButtonLink>}
    >
      <h2 className="display glow-sm text-3xl">Choose a world</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        The rules never change. Everything else does.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {THEMES.map((t) => (
          <Card key={t.id} theme={t} />
        ))}
      </div>

      {mine.length > 0 && (
        <>
          <h3 className="display glow-sm mt-8 text-xl">Your themes</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {mine.map((t) => (
              <Card key={t.id} theme={t.theme} custom />
            ))}
          </div>
        </>
      )}

      <p className="caption mt-8 text-center text-[var(--text-muted)]">
        <Link href="/themes" className="text-[var(--accent)] underline underline-offset-4">
          {email ? 'Write your own theme' : 'Sign in to write your own'}
        </Link>
      </p>
    </Screen>
  )
}
