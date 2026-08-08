'use client'

import { useEffect, useState } from 'react'
import {
  Button,
  ButtonLink,
  Notice,
  NotConfigured,
  Screen,
  Select,
  Textarea,
  cn,
} from '@/components/ui'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { listMyThemes, type CustomTheme } from '@/lib/cloud/themes'
import {
  sendFeedback,
  listMyFeedback,
  KINDS,
  type FeedbackKind,
  type FeedbackRow,
} from '@/lib/cloud/feedback'

const MAX = 2000
const KIND_IDS = Object.keys(KINDS) as FeedbackKind[]

export default function FeedbackPage() {
  const { email, loading } = useAuth()
  const [kind, setKind] = useState<FeedbackKind | null>(null)
  const [message, setMessage] = useState('')
  const [themeId, setThemeId] = useState<string>('')
  const [myThemes, setMyThemes] = useState<CustomTheme[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [mine, setMine] = useState<FeedbackRow[] | null>(null)

  useEffect(() => {
    if (!email) return
    listMyFeedback().then(setMine)
  }, [email])

  // Only fetched when they actually pick "Submit a theme".
  useEffect(() => {
    if (kind !== 'theme' || myThemes.length > 0) return
    listMyThemes().then((rows) => {
      setMyThemes(rows)
      if (rows[0]) setThemeId(rows[0].id)
    })
  }, [kind, myThemes.length])

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!kind) return
    setBusy(true)
    setStatus(null)

    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    const res = await sendFeedback({
      kind,
      message,
      customThemeId: themeId || null,
      page: referrer || undefined,
    })

    if (res.ok) {
      setStatus({ tone: 'success', text: 'Sent. It goes straight to the developer — thank you.' })
      setMessage('')
      setKind(null)
      listMyFeedback().then(setMine)
    } else {
      setStatus({ tone: 'error', text: res.error ?? 'Could not send that.' })
    }
    setBusy(false)
  }

  if (!isSupabaseConfigured) {
    return (
      <Screen title="Feedback" action={<ButtonLink href="/account" variant="ghost">← Account</ButtonLink>}>
        <div className="pt-4">
          <NotConfigured />
        </div>
      </Screen>
    )
  }

  if (loading) {
    return (
      <Screen title="Feedback">
        <p className="caption breathe pt-16 text-center text-[var(--text-muted)]">Loading…</p>
      </Screen>
    )
  }

  if (!email) {
    return (
      <Screen title="Feedback" action={<ButtonLink href="/auth/sign-in">Sign in</ButtonLink>}>
        <div className="pt-4">
          <Notice>
            Sign in to send feedback — it&apos;s tied to your account so the developer can follow up
            rather than shouting into the void.
          </Notice>
        </div>
      </Screen>
    )
  }

  const meta = kind ? KINDS[kind] : null
  const over = message.length > MAX
  const canSend = !!kind && message.trim().length >= 4 && !over

  return (
    <Screen
      title="Feedback"
      action={
        <>
          {status && <Notice tone={status.tone}>{status.text}</Notice>}
          <Button onClick={() => submit()} disabled={busy || !canSend}>
            {busy ? 'Sending…' : !kind ? 'Pick a category first' : 'Send to the developer'}
          </Button>
          <ButtonLink href="/account" variant="ghost">
            ← Account
          </ButtonLink>
        </>
      }
    >
      <h2 className="display glow-sm text-3xl">Tell me what&apos;s going on</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        Rules that resolved oddly, a beat that confused the table, a theme you want everyone to
        have. Specifics beat politeness.
      </p>

      {/* ── category ───────────────────────────────────────────────────── */}
      <h3 className="caption mt-7 text-[var(--text-muted)]">What is this about?</h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {KIND_IDS.map((id) => {
          const selected = kind === id
          return (
            <button
              key={id}
              onClick={() => setKind(id)}
              aria-pressed={selected}
              className={cn(
                'card-atmo rounded-xl border p-3 text-left transition-all duration-150',
                selected
                  ? 'border-2 border-[var(--accent)] shadow-[0_0_18px_var(--accent-glow)]'
                  : 'border-[var(--border-subtle)]',
              )}
            >
              <span
                className={cn(
                  'block text-sm font-medium',
                  selected && 'text-[var(--accent)]',
                )}
              >
                {KINDS[id].label}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-[var(--text-muted)]">
                {KINDS[id].hint}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── the message ────────────────────────────────────────────────── */}
      {kind && (
        <form onSubmit={submit} className="mt-6 space-y-3">
          {kind === 'theme' && (
            <>
              {myThemes.length === 0 ? (
                <Notice>
                  You haven&apos;t saved a theme yet. Write one first and it&apos;ll show up here to
                  attach — or send this without one and just describe the idea.
                </Notice>
              ) : (
                <Select
                  label="Which theme"
                  value={themeId}
                  onChange={(e) => setThemeId(e.target.value)}
                  options={[
                    { value: '', label: '— none, just describing it —' },
                    ...myThemes.map((t) => ({ value: t.id, label: t.theme.name })),
                  ]}
                />
              )}
            </>
          )}

          <Textarea
            label={meta?.label ?? 'Details'}
            hint={`${message.length}/${MAX}`}
            tone={over ? 'warn' : 'muted'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder={meta?.placeholder}
          />
        </form>
      )}

      {/* ── history ────────────────────────────────────────────────────── */}
      {mine && mine.length > 0 && (
        <>
          <h3 className="display glow-sm mt-10 text-xl">What you&apos;ve sent</h3>
          <ul className="mt-3 space-y-2">
            {mine.map((f) => (
              <li
                key={f.id}
                className="card-atmo rounded-xl border border-[var(--border-subtle)] px-3 py-2.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="caption text-[var(--text-muted)]">
                    {KINDS[f.kind]?.label ?? f.kind} ·{' '}
                    {new Date(f.created_at).toLocaleDateString()}
                  </span>
                  <span
                    className={cn(
                      'caption shrink-0',
                      f.status === 'done'
                        ? 'text-[var(--safe)]'
                        : f.status === 'wontfix'
                          ? 'text-[var(--text-muted)]'
                          : 'text-[var(--accent)]',
                    )}
                  >
                    {f.status}
                  </span>
                </div>
                {f.theme_name && (
                  <p className="caption mt-1 text-[var(--accent)]">theme: {f.theme_name}</p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {f.message}
                </p>
                {f.admin_note && (
                  <p className="mt-2 border-l-2 border-[var(--accent)]/50 pl-2 text-sm text-[var(--text-primary)]">
                    {f.admin_note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Screen>
  )
}
