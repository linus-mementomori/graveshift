'use client'

import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isAdminEmail } from './supabase'

export interface AuthState {
  session: Session | null
  user: User | null
  email: string | null
  isAdmin: boolean
  /** True until the initial session lookup resolves. Never blocks gameplay. */
  loading: boolean
}

/**
 * Session hook. Returns a resolved, signed-out state immediately when Supabase
 * isn't configured, so no screen ever hangs waiting on a client that can't exist.
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const email = session?.user?.email ?? null

  return {
    session,
    user: session?.user ?? null,
    email,
    isAdmin: isAdminEmail(email),
    loading,
  }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
