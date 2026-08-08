'use client'

import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, fetchIsAdmin } from './supabase'

export interface AuthState {
  session: Session | null
  user: User | null
  email: string | null
  /** Answered by the database (public.is_admin()), not by a list in this bundle. */
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
  const [isAdmin, setIsAdmin] = useState(false)
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

  // Admin status is a round-trip, so it resolves just after the session does.
  useEffect(() => {
    let active = true
    if (!session) {
      setIsAdmin(false)
      return
    }
    fetchIsAdmin().then((ok) => {
      if (active) setIsAdmin(ok)
    })
    return () => {
      active = false
    }
  }, [session])

  return {
    session,
    user: session?.user ?? null,
    email: session?.user?.email ?? null,
    isAdmin,
    loading,
  }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
