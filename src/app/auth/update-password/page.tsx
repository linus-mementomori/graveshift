'use client'

import { useEffect, useState } from 'react'
import { Button, ButtonLink, Field, Notice, NotConfigured, Screen } from '@/components/ui'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const MIN_LENGTH = 8

/**
 * Where a password-reset link lands.
 *
 * Supabase signs the user in when they open the recovery link, so by the time
 * this renders there is already a session. That is what makes updateUser()
 * work, and it is also why this page is reachable from `/account` for a signed
 * in user who just wants to change their password: both cases are "session
 * exists, set a new password".
 *
 * It does NOT redirect a signed-out visitor away. Landing here with no session
 * means the link expired or was already used, and saying so is far more useful
 * than a silent bounce to the sign-in screen.
 */
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase) return setReady(false)

    // The recovery token in the URL is consumed by detectSessionInUrl, which
    // may not have finished when this effect first runs, so listen as well as
    // ask. PASSWORD_RECOVERY is the event the reset link produces.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true)
    })

    supabase.auth.getSession().then(({ data }) => {
      setReady((prev) => prev || Boolean(data.session))
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return

    if (password.length < MIN_LENGTH) {
      return setError(`Use at least ${MIN_LENGTH} characters.`)
    }
    if (password !== confirm) {
      return setError('Those two do not match.')
    }

    setBusy(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setBusy(false)
      return
    }
    setDone(true)
    setBusy(false)
  }

  if (done) {
    return (
      <Screen title="Password changed">
        <div className="mt-6 space-y-4">
          <Notice>Done. Your new password is active on every device.</Notice>
          <ButtonLink href="/account/">Go to your account</ButtonLink>
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      title="New password"
      action={<ButtonLink href="/account/" variant="ghost">← Back</ButtonLink>}
    >
      <h2 className="display glow-sm text-3xl">Set a new password</h2>

      <div className="mt-6 space-y-4">
        {!isSupabaseConfigured && <NotConfigured />}

        {ready === false && (
          <Notice tone="error">
            This link has expired or has already been used. Reset links last one hour and work once.
            Request a fresh one and it will work.
          </Notice>
        )}

        {error && <Notice tone="error">{error}</Notice>}

        <form onSubmit={save} className="space-y-3">
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="at least 8 characters"
          />
          <Field
            label="Type it again"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
          <Button type="submit" disabled={!isSupabaseConfigured || busy || ready === false}>
            {busy ? 'Saving…' : 'Save new password'}
          </Button>
        </form>

        {ready === false && (
          <ButtonLink href="/auth/forgot/" variant="secondary">
            Send me a new link
          </ButtonLink>
        )}
      </div>
    </Screen>
  )
}
