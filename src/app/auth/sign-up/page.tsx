'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, ButtonLink, Field, Notice, NotConfigured, Screen } from '@/components/ui'
import { supabase, isSupabaseConfigured, authRedirectTo } from '@/lib/supabase'

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function signUp(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return

    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }

    setBusy(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // full_name feeds the profiles trigger's display_name. Presentation only:
      // user_metadata is user-editable and is never an authorization input.
      options: { data: { full_name: displayName || null }, emailRedirectTo: authRedirectTo() },
    })

    if (error) {
      setError(error.message)
      setBusy(false)
      return
    }

    // With email confirmation ON, there's a user but no session yet.
    if (data.session) {
      window.location.assign('/account/')
      return
    }
    setSent(true)
    setBusy(false)
  }

  return (
    <Screen title="Create account" action={<ButtonLink href="/" variant="ghost">← Back</ButtonLink>}>
      <h2 className="display glow-sm text-3xl">Create an account</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Keeps your game history and your own themes across devices. Everything at the table still
        works offline, signed in or not.
      </p>

      <div className="mt-6 space-y-4">
        {!isSupabaseConfigured && <NotConfigured />}

        {error && <Notice tone="error">{error}</Notice>}

        {sent ? (
          <Notice tone="success">
            <p className="mb-1 font-medium">Check your email</p>
            We sent a confirmation link to <strong>{email}</strong>. Open it to finish setting up
            your account.
          </Notice>
        ) : (
          <form onSubmit={signUp} className="space-y-3">
            <Field
              label="Display name"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
            />
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <Button type="submit" disabled={!isSupabaseConfigured || busy}>
              {busy ? 'Creating…' : 'Create account'}
            </Button>
          </form>
        )}

        <p className="pt-2 text-center text-sm text-[var(--text-secondary)]">
          Already have one?{' '}
          <Link href="/auth/sign-in" className="text-[var(--accent)] underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </Screen>
  )
}
