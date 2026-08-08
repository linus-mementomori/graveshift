'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Palette, User, Gamepad2, Volume2, Users, NotebookPen, Coffee } from 'lucide-react'
import { cn } from './ui'
import { useGameStore } from '@/store/gameStore'
import { Sheet } from './game/Sheet'
import { RosterSheet } from './game/RosterSheet'
import { NotesSheet } from './game/NotesSheet'
import { Soundboard } from './Soundboard'
import { SUPPORT_URL } from './SupportLink'

/**
 * Floating tab dock.
 *
 * Two personalities:
 *
 *   BROWSING — Play · Guide · Themes · Account, plain navigation.
 *
 *   IN GAME  — Game · Sound · Roster · Notes. The last three open sheets rather
 *              than navigating, so the host never loses their place in the
 *              night. This is why the soundboard moved here: sound is something
 *              a host wants at *any* beat, not only the ones we happened to put
 *              a button on.
 *
 * It floats clear of the bottom edge with its own margin and safe-area padding.
 * Screens add matching bottom padding via <BottomNavSpacer/> so nothing ends up
 * trapped underneath it.
 */

const BROWSE_TABS = [
  { href: '/', label: 'Play', icon: Home },
  { href: '/guide', label: 'Guide', icon: BookOpen },
  { href: '/themes', label: 'Themes', icon: Palette },
  { href: '/account', label: 'Account', icon: User },
  // Fifth tab instead of a floating widget — the overlay ate too much screen.
  { href: SUPPORT_URL, label: 'Support', icon: Coffee, external: true },
] as const

type SheetId = 'sound' | 'roster' | 'notes' | null

/** Auth screens own their whole viewport; setup has its own action deck. */
const HIDDEN_PREFIXES = ['/auth']

export function BottomNav() {
  const pathname = usePathname() ?? '/'
  const game = useGameStore((s) => s.game)
  const [sheet, setSheet] = useState<SheetId>(null)

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const inGame = pathname.startsWith('/play') && !!game && game.phase !== 'end'

  return (
    <>
      {inGame && game && (
        <>
          <Sheet open={sheet === 'sound'} title="Soundboard" onClose={() => setSheet(null)}>
            <Soundboard game={game} alwaysOpen />
          </Sheet>
          <Sheet open={sheet === 'roster'} title="Roster" onClose={() => setSheet(null)}>
            <RosterSheet game={game} />
          </Sheet>
          <Sheet open={sheet === 'notes'} title="Notes" onClose={() => setSheet(null)}>
            <NotesSheet game={game} />
          </Sheet>
        </>
      )}

      <nav
        aria-label="Main"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        {/*
          A translucent slab floats the dock off the page — you can see content
          moving behind it, but labels stay readable over anything.
          The slab is the ONLY container: the active tab gets no box of its own,
          just the accent colour, a glow, and the underline beneath it.
        */}
        <ul
          className={cn(
            'pointer-events-auto flex w-full max-w-[420px] items-stretch gap-1',
            // Dark tint, not a white one: a light overlay plus backdrop-blur
            // smears whatever text is behind into a milky grey band. Tinting
            // toward the page's own dark base keeps it readable and still lets
            // content show through.
            'rounded-2xl border border-white/[0.06] bg-[var(--bg-base)]/70 backdrop-blur-xl',
            'shadow-[0_8px_28px_rgb(0_0_0/0.5)]',
          )}
        >
          {inGame ? (
            <>
              <Tab
                label="Game"
                icon={Gamepad2}
                active={sheet === null}
                onClick={() => setSheet(null)}
              />
              <Tab
                label="Sound"
                icon={Volume2}
                active={sheet === 'sound'}
                onClick={() => setSheet(sheet === 'sound' ? null : 'sound')}
              />
              <Tab
                label="Roster"
                icon={Users}
                active={sheet === 'roster'}
                onClick={() => setSheet(sheet === 'roster' ? null : 'roster')}
              />
              <Tab
                label="Notes"
                icon={NotebookPen}
                active={sheet === 'notes'}
                onClick={() => setSheet(sheet === 'notes' ? null : 'notes')}
              />
            </>
          ) : (
            BROWSE_TABS.map((tab) => (
              <Tab
                key={tab.href}
                href={tab.href}
                label={tab.label}
                icon={tab.icon}
                external={'external' in tab && tab.external}
                // "/" must match exactly or it lights up on every route.
                active={
                  'external' in tab && tab.external
                    ? false
                    : tab.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(tab.href)
                }
              />
            ))
          )}
        </ul>
      </nav>
    </>
  )
}

function Tab({
  href,
  label,
  icon: Icon,
  active,
  onClick,
  external,
}: {
  href?: string
  label: string
  icon: typeof Home
  active: boolean
  onClick?: () => void
  external?: boolean
}) {
  const inner = (
    <>
      <Icon
        size={19}
        strokeWidth={active ? 2 : 1.5}
        aria-hidden
        // The neon: the icon itself glows in the live theme accent.
        className={active ? 'drop-shadow-[0_0_8px_var(--accent)]' : undefined}
      />
      <span className="caption text-[10px] leading-none">{label}</span>
      {/*
        A short lit bar instead of a filled pill. Reads as "selected" at a
        glance without putting a second container inside the slab.
      */}
      <span
        aria-hidden
        className={cn(
          'h-[2px] w-6 rounded-full transition-opacity duration-150',
          active
            ? 'bg-[var(--accent)] opacity-100 shadow-[0_0_8px_var(--accent)]'
            : 'opacity-0',
        )}
      />
    </>
  )

  const className = cn(
    'flex min-h-[52px] w-full flex-col items-center justify-center gap-1 transition-colors duration-150',
    // Lit, not filled: colour, glow and the underline are the whole active state.
    active
      ? 'text-[var(--accent)] [text-shadow:0_0_10px_var(--accent)]'
      : 'text-[var(--text-muted)] active:text-[var(--text-secondary)]',
  )

  /**
   * External tabs can't be a <Link>, and a bare target="_blank" silently does
   * nothing in an installed PWA or behind a popup blocker — the same bug that
   * made the support button appear dead. Fall back to same-tab navigation.
   */
  function openExternal(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    const win = window.open(href, '_blank', 'noopener,noreferrer')
    if (!win && href) window.location.href = href
  }

  return (
    <li className="flex-1">
      {external && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={openExternal}
          className={className}
        >
          {inner}
        </a>
      ) : href ? (
        <Link href={href} aria-current={active ? 'page' : undefined} className={className}>
          {inner}
        </Link>
      ) : (
        <button onClick={onClick} aria-pressed={active} className={className}>
          {inner}
        </button>
      )}
    </li>
  )
}

/** Reserves the space the floating dock covers. */
export function BottomNavSpacer() {
  const pathname = usePathname() ?? '/'
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null
  return <div aria-hidden className="h-[calc(76px_+_env(safe-area-inset-bottom))] shrink-0" />
}
