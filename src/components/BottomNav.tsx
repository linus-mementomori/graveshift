'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Palette, User, Gamepad2, Volume2, Users, NotebookPen } from 'lucide-react'
import { cn } from './ui'
import { useGameStore } from '@/store/gameStore'
import { Sheet } from './game/Sheet'
import { RosterSheet } from './game/RosterSheet'
import { NotesSheet } from './game/NotesSheet'
import { Soundboard } from './Soundboard'

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
            <Soundboard alwaysOpen />
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
          No slab, no border, no fill — the dock is just the icons, floating over
          whatever is behind them. The only thing marking the active tab is that
          it lights up in the theme accent.
        */}
        <ul className="pointer-events-auto flex w-full max-w-[420px] items-stretch gap-1">
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
            BROWSE_TABS.map(({ href, label, icon }) => (
              <Tab
                key={href}
                href={href}
                label={label}
                icon={icon}
                // "/" must match exactly or it lights up on every route.
                active={href === '/' ? pathname === '/' : pathname.startsWith(href)}
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
}: {
  href?: string
  label: string
  icon: typeof Home
  active: boolean
  onClick?: () => void
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
    </>
  )

  const className = cn(
    'flex min-h-[52px] w-full flex-col items-center justify-center gap-1 transition-colors duration-150',
    // Lit, not filled: the accent colour plus a glow is the entire active state.
    active
      ? 'text-[var(--accent)] [text-shadow:0_0_10px_var(--accent)]'
      : 'text-[var(--text-muted)] active:text-[var(--text-secondary)]',
  )

  return (
    <li className="flex-1">
      {href ? (
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
