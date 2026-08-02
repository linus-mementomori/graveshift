'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, ButtonLink, Field, Notice, NotConfigured, Screen } from '@/components/ui'
import { supabase, isSupabaseConfigured, authRedirectTo } from '@/lib/supabase'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setBusy(false)
      return
    }
    // onAuthStateChange in useAuth picks this up; go somewhere useful.
    window.location.assign('/account/')
  }

  async function signInWithGoogle() {
    if (!supabase) return
    setBusy(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectTo() },
    })

    if (error) {
      setError(error.message)
      setBusy(false)
    }
  }

  return (
    <Screen title="Sign in" action={<ButtonLink href="/" variant="ghost">← Back</ButtonLink>}>
      <h2 className="display glow-sm text-3xl">Welcome back</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        An account saves your game history and custom themes. Hosting never requires one.
      </p>

      <div className="mt-6 space-y-4">
        {!isSupabaseConfigured && <NotConfigured />}

        {error && <Notice tone="error">{error}</Notice>}

        <form onSubmit={signInWithPassword} className="space-y-3">
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Button type="submit" disabled={!isSupabaseConfigured || busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span className="caption text-[var(--text-muted)]">or</span>
          <span className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>

        <Button variant="secondary" onClick={signInWithGoogle} disabled={!isSupabaseConfigured || busy}>
          Continue with Google
        </Button>

        <p className="pt-2 text-center text-sm text-[var(--text-secondary)]">
          No account?{' '}
          <Link href="/auth/sign-up" className="text-[var(--accent)] underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </Screen>
  )
}
