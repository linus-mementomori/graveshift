'use client'

import Link from 'next/link'
import { ButtonLink } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { getTheme } from '@/themes'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

export default function Home() {
  const themeId = useGameStore((s) => s.themeId)
  const theme = getTheme(themeId)
  const { email } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col justify-between px-5 pt-24 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div>
        <h1 className="display pulse-glow text-5xl text-[var(--accent)]">NIGHTFALL</h1>
        <p className="caption mt-3 text-[var(--text-muted)]">
          the game master in your pocket
        </p>
        <p className="speak-sm mt-10 text-[var(--text-secondary)]">{theme.tagline}</p>
      </div>

      <div className="space-y-3">
        <ButtonLink href="/setup/players">▶ New game</ButtonLink>
        <ButtonLink href="/guide" variant="secondary">
          How to host
        </ButtonLink>
        {isSupabaseConfigured && (
          <p className="caption pt-1 text-center">
            <Link
              href={email ? '/account' : '/auth/sign-in'}
              className="text-[var(--text-muted)] underline underline-offset-4"
            >
              {email ? 'Your account' : 'Sign in'}
            </Link>
          </p>
        )}
        <p className="caption pt-2 text-center text-[var(--text-muted)]">
          {theme.name} · 5–20 players · works offline
        </p>
      </div>
    </div>
  )
}
