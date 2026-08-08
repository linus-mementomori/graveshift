'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--bg-void)] font-semibold shadow-[0_0_20px_var(--accent-glow),inset_0_0_20px_rgb(0_0_0/0.15)]',
  secondary:
    'bg-[var(--bg-raised)] text-[var(--text-primary)] border border-[var(--border-strong)]',
  ghost: 'text-[var(--text-secondary)]',
  danger: 'bg-[var(--danger)] text-white font-semibold shadow-[0_0_20px_rgb(229_72_77/0.35)]',
}

const BASE =
  'w-full min-h-14 rounded-xl px-5 flex items-center justify-center gap-2 text-base tracking-wide transition-[transform,box-shadow] duration-[120ms] active:scale-[0.98] disabled:opacity-40 disabled:shadow-none'

export function Button({
  children,
  variant = 'primary',
  className,
  ...rest
}: { variant?: ButtonVariant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(BASE, VARIANTS[variant], className)} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
}: {
  href: string
  children: ReactNode
  variant?: ButtonVariant
  className?: string
}) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], className)}>
      {children}
    </Link>
  )
}

/** The three-band play frame from DESIGN.md §2.3. */
export function Screen({
  title,
  step,
  children,
  action,
}: {
  title: string
  step?: string
  children: ReactNode
  action?: ReactNode
}) {
  const pathname = usePathname() ?? '/'
  const hasDock = !pathname.startsWith('/auth')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between px-5">
        <span className="caption text-[var(--text-muted)]">{title}</span>
        {step && <span className="caption text-[var(--text-muted)]">{step}</span>}
      </header>
      <main className="flex-1 overflow-y-auto px-5 pb-6">{children}</main>
      {action && (
        <footer
          className={cn(
            'shrink-0 space-y-3 px-5 pt-3',
            // The dock floats over everything, so the action deck has to clear
            // it or the primary button ends up underneath a tab bar.
            hasDock
              ? 'pb-[calc(88px_+_env(safe-area-inset-bottom))]'
              : 'pb-[max(1.25rem,env(safe-area-inset-bottom))]',
          )}
        >
          {action}
        </footer>
      )}
    </div>
  )
}

/** Host-spoken text. Wrapped in « » so the host never confuses it with UI copy. */
export function Speak({ children }: { children: ReactNode }) {
  return (
    <p className="speak text-[var(--text-primary)]" aria-live="polite">
      «{children}»
    </p>
  )
}

/**
 * DESIGN.md §5.2 — the performance instruction strip.
 *
 * Text only. The play button used to live here, but sound moved into the dock's
 * soundboard: a host wants sound at any beat, not only the ones that happened
 * to have a button, and two places to trigger it was one too many.
 */
export function CueStrip({ text }: { text: string; cueId?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)]/25 px-3 py-2">
      <span aria-hidden className="text-[var(--accent)]">
        ♪
      </span>
      <span className="caption flex-1 leading-4 text-[var(--text-secondary)]">{text}</span>
    </div>
  )
}

/** Labelled text input, styled to match the seat-name inputs. */
export function Field({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="caption text-[var(--text-muted)]">{label}</span>
      <input
        {...rest}
        className="mt-1.5 h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 text-base outline-none focus:border-[var(--accent)]"
      />
    </label>
  )
}

/** Multi-line input. `hint` carries the word count / limit for read-aloud lines. */
export function Textarea({
  label,
  hint,
  tone,
  ...rest
}: {
  label: string
  hint?: string
  tone?: 'warn' | 'muted'
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="caption flex items-baseline justify-between gap-2 text-[var(--text-muted)]">
        <span>{label}</span>
        {hint && (
          <span className={tone === 'warn' ? 'text-[var(--warn)]' : 'text-[var(--text-muted)]'}>
            {hint}
          </span>
        )}
      </span>
      <textarea
        {...rest}
        className="mt-1.5 min-h-20 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm leading-relaxed outline-none focus:border-[var(--accent)]"
      />
    </label>
  )
}

export function Select({
  label,
  options,
  ...rest
}: {
  label: string
  options: { value: string; label: string }[]
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="caption text-[var(--text-muted)]">{label}</span>
      <select
        {...rest}
        className="mt-1.5 h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 text-base outline-none focus:border-[var(--accent)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

type NoticeTone = 'info' | 'error' | 'success'

const TONES: Record<NoticeTone, string> = {
  info: 'border-[var(--border-strong)] text-[var(--text-secondary)]',
  error: 'border-[var(--danger)]/50 bg-[var(--danger)]/10 text-[var(--danger)]',
  success: 'border-[var(--safe)]/50 bg-[var(--safe)]/10 text-[var(--safe)]',
}

export function Notice({ tone = 'info', children }: { tone?: NoticeTone; children: ReactNode }) {
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm leading-relaxed', TONES[tone])}>
      {children}
    </div>
  )
}

/**
 * Shown wherever a screen needs Supabase but the env vars aren't set.
 * The app must never crash or hang because the cloud isn't configured.
 */
export function NotConfigured() {
  return (
    <Notice>
      <p className="mb-1 font-medium text-[var(--text-primary)]">Cloud not configured</p>
      Accounts need a Supabase project. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then restart the dev
      server. See <code>docs/CLOUD_PLAN.md</code> §11. Hosting a game works without this.
    </Notice>
  )
}
