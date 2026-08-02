import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client for Nightfall.
 *
 * CLOUD_PLAN P1: the account is OPTIONAL. This module must never be on the
 * critical path of hosting a game — nothing under src/engine or the play flow
 * imports it, and the app renders fine with no Supabase project at all.
 *
 * Prefer the publishable key (`sb_publishable_…`); the legacy `anon` key still
 * works and is accepted here for compatibility.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** True when the project has been pointed at a Supabase instance. */
export const isSupabaseConfigured = Boolean(url && key)

/**
 * Null until the env vars are set, so every screen still renders (with an
 * explanatory notice) before Supabase is wired up.
 *
 * NOTE: NEXT_PUBLIC_* values are inlined at BUILD time, not read at runtime —
 * whatever builds the site needs both variables or you ship `undefined`.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

/**
 * Accounts permitted to open the admin dashboard.
 *
 * NOTE: this list is a UX gate only — it decides what the browser bothers to
 * render. It is NOT the security boundary. Actual enforcement lives in the RLS
 * policies in supabase/schema.sql (`public.is_admin()`), which Postgres applies
 * to every request regardless of what this bundle claims. Keep the two in sync.
 */
export const ADMIN_EMAILS = ['REPLACE-WITH-YOUR-EMAIL@example.com']

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

/** Where OAuth should land. Trailing slash matters — next.config sets trailingSlash. */
export const authRedirectTo = (): string =>
  typeof window === 'undefined' ? '' : `${window.location.origin}/auth/callback/`
