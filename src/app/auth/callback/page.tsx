'use client'

import { useEffect, useState } from 'react'
import { ButtonLink, Notice, Screen } from '@/components/ui'
import { supabase } from '@/lib/supabase'

/**
 * OAuth / email-confirmation landing page.
 *
 * This must exist as a real exported page: with `output: 'export'` and
 * `trailingSlash: true`, the Supabase redirect URL is `/auth/callback/` and a
 * missing page here shows up as a 404 *after* a successful Google login. The
 * classic symptom. Keep the trailing slash in the dashboard's Redirect URLs.
 */
export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    // A recovery link also produces a session, so "we have a session" is not
    // enough to decide where to send someone. Sending a password reset to
    // /account/ would silently swallow the reset: they are signed in, but never
    // get shown a field to set a new password. Recovery goes to the form.
    //
    // resetPasswordForEmail already points at /auth/update-password/ directly,
    // so this is the belt to that braces: it also catches a recovery link that
    // was issued before that redirect existed, or configured by hand.
    const RECOVERY = '/auth/update-password/'
    const isRecovery = () =>
      typeof window !== 'undefined' &&
      (window.location.hash.includes('type=recovery') ||
        new URLSearchParams(window.location.search).get('type') === 'recovery')

    const land = () => window.location.replace(isRecovery() ? RECOVERY : '/account/')

    // The client is created with detectSessionInUrl, so it consumes the hash or
    // ?code= on load. We just wait for the resulting session and move on.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') return window.location.replace(RECOVERY)
      if (session) land()
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) return setError(error.message)
      if (data.session) land()
      else setError('That sign-in link is no longer valid. Try signing in again.')
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <Screen
      title="Signing in"
      action={error ? <ButtonLink href="/auth/sign-in">Back to sign in</ButtonLink> : undefined}
    >
      <div className="pt-16">
        {error ? (
          <Notice tone="error">{error}</Notice>
        ) : (
          <p className="caption breathe text-center text-[var(--text-muted)]">Signing you in…</p>
        )}
      </div>
    </Screen>
  )
}
