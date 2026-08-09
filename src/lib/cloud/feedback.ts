'use client'

import { supabase } from '@/lib/supabase'

export type FeedbackKind =
  | 'bug'
  | 'idea'
  | 'theme'
  | 'rules'
  | 'praise'
  | 'complaint'
  | 'other'

export type FeedbackStatus = 'new' | 'read' | 'done' | 'wontfix'

export interface FeedbackRow {
  id: string
  user_id: string
  display_name: string | null
  kind: FeedbackKind
  message: string
  custom_theme_id: string | null
  theme_name: string | null
  theme_category: string | null
  page: string | null
  status: FeedbackStatus
  admin_note: string | null
  created_at: string
}

export interface KindMeta {
  label: string
  /** One line telling the user what belongs here, so the picker teaches itself. */
  hint: string
  /** Placeholder that models the level of detail actually useful. */
  placeholder: string
}

/**
 * The categories. Order matters. This is the order they appear in the picker,
 * roughly most to least common.
 *
 * Praise and complaint are split deliberately rather than folded into one
 * "feedback" bucket: knowing whether something worked is as actionable as
 * knowing it didn't, and people write very differently depending on which they
 * think they're doing.
 */
export const KINDS: Record<FeedbackKind, KindMeta> = {
  bug: {
    label: 'Something broke',
    hint: 'A screen, a button, a resolution that went wrong',
    placeholder:
      'On night 3 the Doctor protected Ana and she still died. 8 players, Millers Hollow…',
  },
  idea: {
    label: 'New idea',
    hint: 'A feature or change you want',
    placeholder: 'It would help if the vote screen kept a history of previous days…',
  },
  theme: {
    label: 'Submit a theme',
    hint: 'Put one of your themes forward for everyone',
    placeholder: 'Why this theme is worth shipping, and who it is for…',
  },
  rules: {
    label: 'Rules or balance',
    hint: 'A ruling you disagree with, or a role that feels off',
    placeholder: 'The Jester wins too easily at 8 players because…',
  },
  praise: {
    label: 'What worked',
    hint: 'Something that landed well at the table',
    placeholder: 'The hold-to-reveal deal completely solved people peeking…',
  },
  complaint: {
    label: "What didn't",
    hint: 'Something frustrating, even if you can’t say why',
    placeholder: 'Setup takes too long when I already know the roles I want…',
  },
  other: {
    label: 'Something else',
    hint: 'Anything that doesn’t fit above',
    placeholder: '',
  },
}

/** Back-compat alias. Some callers only need the label. */
export const KIND_LABELS: Record<FeedbackKind, string> = Object.fromEntries(
  Object.entries(KINDS).map(([k, v]) => [k, v.label]),
) as Record<FeedbackKind, string>

export async function sendFeedback(input: {
  kind: FeedbackKind
  message: string
  customThemeId?: string | null
  page?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Cloud not configured.' }

  const text = input.message.trim()
  // Mirrors the DB check constraint, so the user gets a sentence rather than a
  // Postgres error string.
  if (text.length < 4) return { ok: false, error: 'Add a little more detail.' }
  if (text.length > 2000) return { ok: false, error: 'That is over the 2000 character limit.' }

  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return { ok: false, error: 'You need to be signed in to send feedback.' }

  const { error } = await supabase.from('feedback').insert({
    user_id: userId,
    kind: input.kind,
    message: text,
    // Only meaningful for theme submissions; null everywhere else.
    custom_theme_id: input.kind === 'theme' ? (input.customThemeId ?? null) : null,
    page: input.page ?? null,
  })

  return error ? { ok: false, error: error.message } : { ok: true }
}

/**
 * Reads from the admin view. RLS is what decides the scope: a normal user gets
 * only their own rows back, an admin gets everyone's. Same query either way, so
 * there is no client-side filtering to get wrong.
 */
export async function listFeedback(): Promise<FeedbackRow[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('admin_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data as FeedbackRow[]) ?? []
}

export const listMyFeedback = listFeedback
export const listAllFeedback = listFeedback

export async function setFeedbackStatus(id: string, status: FeedbackStatus): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('feedback').update({ status }).eq('id', id)
  return !error
}
