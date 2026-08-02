'use client'

import { ButtonLink, Screen, cn } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { THEMES } from '@/themes'

export default function ThemePage() {
  const { themeId, setTheme } = useGameStore()

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
        {THEMES.map((t) => {
          const selected = t.id === themeId
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              data-theme={t.id}
              aria-pressed={selected}
              className={cn(
                'card-atmo flex min-h-32 flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200',
                selected
                  ? 'border-2 border-[var(--accent)] shadow-[0_0_24px_var(--accent-glow)]'
                  : 'border-[var(--border-subtle)]',
              )}
            >
              <span className="display glow-sm text-base leading-tight text-[var(--accent)]">
                {t.name}
              </span>
              <span className="text-xs leading-snug text-[var(--text-secondary)]">
                {t.tagline}
              </span>
              <span className="caption text-[var(--text-muted)]">{t.category}</span>
            </button>
          )
        })}
      </div>
    </Screen>
  )
}
