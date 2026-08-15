import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client for Graveshift.
 *
 * CLOUD_PLAN P1: the account is OPTIONAL. This module must never be on the
 * critical path of hosting a game. Nothing under src/engine or the play flow
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
 * NOTE: NEXT_PUBLIC_* values are inlined at BUILD time, not read at runtime.
 * Whatever builds the site needs both variables or you ship `undefined`.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

/**
 * Ask the DATABASE whether the current user is an admin.
 *
 * There is deliberately no hard-coded email list in this bundle. `is_admin()`
 * in supabase/schema.sql is the single source of truth: it is already the RLS
 * boundary, so duplicating it here would only create a second list to forget
 * to update, which is exactly how the dashboard silently shows nothing.
 *
 * Still a UX gate, not security: it decides what we bother to render. Postgres
 * enforces the real rule on every request regardless of what this returns.
 */
export async function fetchIsAdmin(): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('is_admin')
  if (error) return false
  return data === true
}

/** Where OAuth should land. Trailing slash matters. Next.config sets trailingSlash. */
export const authRedirectTo = (): string =>
  typeof window === 'undefined' ? '' : `${window.location.origin}/auth/callback/`

/**
 * Where a password-reset link lands.
 *
 * Deliberately NOT /auth/callback/. Opening a recovery link creates a real
 * session, so the callback would see one and forward straight to /account/,
 * and the user would never be shown a field to type a new password into.
 *
 * Keep the trailing slash: `trailingSlash: true` serves these as directories,
 * and the URL has to match Supabase's redirect allow-list exactly.
 */
export const passwordResetRedirectTo = (): string =>
  typeof window === 'undefined' ? '' : `${window.location.origin}/auth/update-password/`
