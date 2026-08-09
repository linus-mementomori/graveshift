'use client'

/**
 * Custom theme CRUD, CLOUD_PLAN §8.
 *
 * A "modified prompt" and a "custom theme" are the same object: a theme's
 * narration lines ARE the host's script. One table, one editor, one validator.
 *
 * Everything read back from the database goes through validateTheme() before it
 * can reach a play screen (D11). The row is untrusted even though the user
 * wrote it themselves, because rows can be edited by other clients, other
 * sessions, or a future version of this app.
 */

import { supabase } from '@/lib/supabase'
import { validateTheme } from '@/themes/schema'
import type { Theme } from '@/themes/types'

export interface CustomThemeRow {
  id: string
  user_id: string
  base_theme_id: string | null
  name: string
  tagline: string
  category: string
  data: unknown
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CustomTheme {
  id: string
  baseThemeId: string | null
  updatedAt: string
  /** Already validated. Rows that fail validation are dropped, not surfaced. */
  theme: Theme
}

function toCustomTheme(row: CustomThemeRow): CustomTheme | null {
  const result = validateTheme(row.data)
  if (!result.ok || !result.theme) return null
  return {
    id: row.id,
    baseThemeId: row.base_theme_id,
    updatedAt: row.updated_at,
    // The row id is the theme id everywhere in the app, so selection survives
    // a rename.
    theme: { ...result.theme, id: row.id },
  }
}

export async function listMyThemes(): Promise<CustomTheme[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('custom_themes')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error || !data) return []
  return (data as CustomThemeRow[])
    .map(toCustomTheme)
    .filter((t): t is CustomTheme => t !== null)
}

export async function getTheme(id: string): Promise<CustomTheme | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('custom_themes').select('*').eq('id', id).single()
  if (error || !data) return null
  return toCustomTheme(data as CustomThemeRow)
}

export interface SaveResult {
  ok: boolean
  id?: string
  error?: string
}

export async function saveTheme(
  theme: Theme,
  opts: { id?: string; baseThemeId?: string | null } = {},
): Promise<SaveResult> {
  if (!supabase) return { ok: false, error: 'Cloud not configured.' }

  // Validate before the network, so the user gets the real reason rather than a
  // Postgres constraint message.
  const check = validateTheme(theme)
  if (!check.ok) return { ok: false, error: check.errors[0] }

  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return { ok: false, error: 'You need to be signed in to save a theme.' }

  const row = {
    user_id: userId,
    base_theme_id: opts.baseThemeId ?? null,
    name: theme.name,
    tagline: theme.tagline,
    category: theme.category,
    data: theme,
    updated_at: new Date().toISOString(),
  }

  if (opts.id) {
    const { error } = await supabase.from('custom_themes').update(row).eq('id', opts.id)
    return error ? { ok: false, error: error.message } : { ok: true, id: opts.id }
  }

  const { data, error } = await supabase
    .from('custom_themes')
    .insert(row)
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, id: (data as { id: string }).id }
}

export async function deleteTheme(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('custom_themes').delete().eq('id', id)
  return !error
}
