'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, ButtonLink, Field, Notice, NotConfigured, Screen } from '@/components/ui'
import { supabase, isSupabaseConfigured, passwordResetRedirectTo } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function requestReset(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: passwordResetRedirectTo(),
    })

    // Only a transport failure is worth showing. Anything about whether the
    // address exists stays hidden: see the note under the success state.
    if (error) {
      setError(error.message)
      setBusy(false)
      return
    }
    setSent(true)
    setBusy(false)
  }

  return (
    <Screen
      title="Reset password"
      action={<ButtonLink href="/auth/sign-in" variant="ghost">← Back</ButtonLink>}
    >
      <h2 className="display glow-sm text-3xl">Forgotten it?</h2>

      {sent ? (
        <div className="mt-6 space-y-4">
          <Notice>
            If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way.
            The link is good for one hour.
          </Notice>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Nothing arrived? Check spam, then try again. If you signed up with Google there is no
            password to reset. Use <em>Continue with Google</em> instead.
          </p>
          <ButtonLink href="/auth/sign-in" variant="secondary">
            Back to sign in
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Enter the address you signed up with and we will send you a link to set a new password.
          </p>

          {!isSupabaseConfigured && <NotConfigured />}
          {error && <Notice tone="error">{error}</Notice>}

          <form onSubmit={requestReset} className="space-y-3">
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button type="submit" disabled={!isSupabaseConfigured || busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

          <p className="pt-2 text-center text-sm text-[var(--text-secondary)]">
            Remembered it?{' '}
            <Link href="/auth/sign-in" className="text-[var(--accent)] underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      )}
    </Screen>
  )
}
