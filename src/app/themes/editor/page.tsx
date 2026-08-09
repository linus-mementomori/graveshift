'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Button,
  ButtonLink,
  Field,
  Notice,
  NotConfigured,
  Screen,
  Select,
  Textarea,
} from '@/components/ui'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { getTheme as getCustom, saveTheme } from '@/lib/cloud/themes'
import { getTheme as getBuiltIn, THEMES } from '@/themes'
import { ROLE_LIST } from '@/engine/roles'
import {
  MAX_NARRATION_WORDS,
  NARRATION_KEYS,
  NARRATION_LABELS,
  THEME_CATEGORIES,
  draftFrom,
  validateTheme,
  wordCount,
  type NarrationKey,
} from '@/themes/schema'
import type { Theme } from '@/themes/types'
import type { RoleId } from '@/engine/types'

export default function ThemeEditorPage() {
  return (
    <Suspense
      fallback={
        <Screen title="Theme editor">
          <p className="caption breathe pt-16 text-center text-[var(--text-muted)]">Loading…</p>
        </Screen>
      }
    >
      <Editor />
    </Suspense>
  )
}

function Editor() {
  const params = useSearchParams()
  const editId = params.get('id')
  const baseId = params.get('base')

  const { email, loading } = useAuth()
  const [draft, setDraft] = useState<Theme | null>(null)
  const [baseThemeId, setBaseThemeId] = useState<string | null>(baseId)
  const [savedId, setSavedId] = useState<string | null>(editId)
  const [status, setStatus] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [showRoles, setShowRoles] = useState(false)

  // Load: an existing custom theme, a copy of a built-in, or a blank slate.
  useEffect(() => {
    if (!email) return
    if (editId) {
      getCustom(editId).then((row) => {
        if (row) {
          setDraft(row.theme)
          setBaseThemeId(row.baseThemeId)
        } else {
          setStatus({ tone: 'error', text: 'That theme could not be loaded.' })
        }
      })
      return
    }
    const base = getBuiltIn(baseId ?? 'millersHollow')
    setDraft(draftFrom(base, baseId ? `${base.name} (my version)` : 'My theme'))
  }, [email, editId, baseId])

  const set = <K extends keyof Theme>(key: K, value: Theme[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d))

  const setNarration = (key: NarrationKey, value: string) =>
    setDraft((d) => (d ? { ...d, narration: { ...d.narration, [key]: value } } : d))

  const setRoleSkin = (roleId: RoleId, patch: { name?: string; flavour?: string }) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            roleSkins: {
              ...d.roleSkins,
              [roleId]: {
                name: patch.name ?? d.roleSkins[roleId]?.name ?? '',
                flavour: patch.flavour ?? d.roleSkins[roleId]?.flavour ?? '',
              },
            },
          }
        : d,
    )

  async function save() {
    if (!draft) return
    setBusy(true)
    setStatus(null)

    const check = validateTheme(draft)
    if (!check.ok) {
      setStatus({ tone: 'error', text: check.errors[0] })
      setBusy(false)
      return
    }

    const res = await saveTheme(draft, { id: savedId ?? undefined, baseThemeId })
    if (res.ok && res.id) {
      setSavedId(res.id)
      setStatus({ tone: 'success', text: 'Saved. It will appear in the theme picker during setup.' })
    } else {
      setStatus({ tone: 'error', text: res.error ?? 'Could not save.' })
    }
    setBusy(false)
  }

  if (!isSupabaseConfigured) {
    return (
      <Screen title="Theme editor" action={<ButtonLink href="/" variant="ghost">← Home</ButtonLink>}>
        <div className="pt-4">
          <NotConfigured />
        </div>
      </Screen>
    )
  }

  if (loading || (email && !draft)) {
    return (
      <Screen title="Theme editor">
        <p className="caption breathe pt-16 text-center text-[var(--text-muted)]">Loading…</p>
      </Screen>
    )
  }

  if (!email) {
    return (
      <Screen title="Theme editor" action={<ButtonLink href="/auth/sign-in">Sign in</ButtonLink>}>
        <div className="pt-4">
          <Notice>Sign in to create and save your own themes.</Notice>
        </div>
      </Screen>
    )
  }

  if (!draft) return null

  const problems = validateTheme(draft).errors

  return (
    <Screen
      title={savedId ? 'Edit theme' : 'New theme'}
      action={
        <>
          {status && <Notice tone={status.tone}>{status.text}</Notice>}
          <Button onClick={save} disabled={busy || problems.length > 0}>
            {busy ? 'Saving…' : problems.length > 0 ? `${problems.length} thing(s) to fix` : 'Save theme'}
          </Button>
          <ButtonLink href="/themes" variant="ghost">
            ← My themes
          </ButtonLink>
        </>
      }
    >
      <h2 className="display glow-sm text-3xl">{draft.name || 'Untitled'}</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Everything here is words and colour. The rules, the night order and the roles are identical
        in every theme. That&apos;s what makes a theme safe to write.
      </p>

      {problems.length > 0 && (
        <div className="mt-5">
          <Notice tone="error">
            <p className="mb-1 font-medium">Before you can save</p>
            <ul className="list-inside list-disc space-y-0.5">
              {problems.slice(0, 4).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Notice>
        </div>
      )}

      {/* ── identity ─────────────────────────────────────────────────────── */}
      <h3 className="display glow-sm mt-8 text-xl">The world</h3>
      <div className="mt-3 space-y-3">
        <Field
          label="Name"
          value={draft.name}
          maxLength={60}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Millers Hollow"
        />
        <Field
          label="Tagline"
          value={draft.tagline}
          maxLength={140}
          onChange={(e) => set('tagline', e.target.value)}
          placeholder="Something is wrong in the woods."
        />
        <Select
          label="Category"
          value={draft.category}
          onChange={(e) => set('category', e.target.value as Theme['category'])}
          options={THEME_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Field
          label="Place (substituted into narration)"
          value={draft.place}
          maxLength={40}
          onChange={(e) => set('place', e.target.value)}
          placeholder="the village"
        />
      </div>

      {/* ── factions ─────────────────────────────────────────────────────── */}
      <h3 className="display glow-sm mt-8 text-xl">What the sides are called</h3>
      <div className="mt-3 space-y-3">
        {(['village', 'mafia', 'neutral'] as const).map((f) => (
          <Field
            key={f}
            label={f}
            value={draft.factionNames[f]}
            maxLength={40}
            onChange={(e) => set('factionNames', { ...draft.factionNames, [f]: e.target.value })}
          />
        ))}
      </div>

      {/* ── narration: the script ───────────────────────────────────────── */}
      <h3 className="display glow-sm mt-8 text-xl">The script</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        These are the lines you read out loud. Keep each under {MAX_NARRATION_WORDS} words. Any
        longer and it won&apos;t fit on a phone screen or in one breath.
      </p>
      <div className="mt-3 space-y-3">
        {NARRATION_KEYS.map((key) => {
          const value = draft.narration[key] ?? ''
          const n = wordCount(value)
          const over = n > MAX_NARRATION_WORDS
          return (
            <Textarea
              key={key}
              label={NARRATION_LABELS[key]}
              hint={`${n}/${MAX_NARRATION_WORDS} words`}
              tone={over ? 'warn' : 'muted'}
              value={value}
              onChange={(e) => setNarration(key, e.target.value)}
            />
          )
        })}
      </div>

      {/* ── victory ──────────────────────────────────────────────────────── */}
      <h3 className="display glow-sm mt-8 text-xl">How it ends</h3>
      <div className="mt-3 space-y-3">
        {(['village', 'mafia', 'neutral'] as const).map((f) => (
          <Textarea
            key={f}
            label={`${f} wins`}
            hint={`${wordCount(draft.victory[f])}/${MAX_NARRATION_WORDS} words`}
            value={draft.victory[f]}
            onChange={(e) => set('victory', { ...draft.victory, [f]: e.target.value })}
          />
        ))}
      </div>

      {/* ── role skins ───────────────────────────────────────────────────── */}
      <h3 className="display glow-sm mt-8 text-xl">The cast</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Rename any role. Leave one blank and it keeps its normal name.
      </p>
      {!showRoles ? (
        <div className="mt-3">
          <Button variant="secondary" onClick={() => setShowRoles(true)}>
            Rename roles ({ROLE_LIST.length})
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          {ROLE_LIST.map((role) => (
            <div
              key={role.id}
              className="card-atmo rounded-xl border border-[var(--border-subtle)] p-3"
            >
              <p className="caption mb-2 text-[var(--text-muted)]">{role.id}</p>
              <div className="space-y-2">
                <Field
                  label="Called"
                  value={draft.roleSkins[role.id]?.name ?? ''}
                  maxLength={40}
                  placeholder={role.id}
                  onChange={(e) => setRoleSkin(role.id, { name: e.target.value })}
                />
                <Textarea
                  label="Flavour"
                  value={draft.roleSkins[role.id]?.flavour ?? ''}
                  placeholder={role.summary}
                  onChange={(e) => setRoleSkin(role.id, { flavour: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="caption mt-10 text-[var(--text-muted)]">
        Based on {baseThemeId ? getBuiltIn(baseThemeId).name : 'nothing, written from scratch'} ·{' '}
        {THEMES.length} built-in themes available to copy
      </p>
    </Screen>
  )
}
