'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Palette, User } from 'lucide-react'
import { cn } from './ui'

/**
 * App-style bottom tab bar.
 *
 * Deliberately NOT shown everywhere. DESIGN §2.3 pins an action deck to the
 * bottom of every setup and play screen, and §1 principle 3 puts everything
 * tappable during a game in the bottom 45% — a persistent nav there would sit
 * directly under the host's thumb next to "Confirm & continue" and get
 * mis-tapped in the dark. Mid-game, the game IS the navigation.
 *
 * So it appears on the browsing surfaces (home, guide, themes, account) and
 * hides during setup, play and auth.
 *
 * Four tabs, icons + labels: past five, targets get too narrow for a thumb, and
 * unlabelled icons measurably hurt recognition.
 */

const TABS = [
  { href: '/', label: 'Play', icon: Home },
  { href: '/guide', label: 'Guide', icon: BookOpen },
  { href: '/themes', label: 'Themes', icon: Palette },
  { href: '/account', label: 'Account', icon: User },
] as const

/** Surfaces that own their own bottom area. */
const HIDDEN_PREFIXES = ['/play', '/setup', '/auth']

export function BottomNav() {
  const pathname = usePathname() ?? '/'

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex w-full max-w-[480px]">
        {TABS.map(({ href, label, icon: Icon }) => {
          // "/" must match exactly or it would light up on every route.
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 transition-colors',
                  active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  aria-hidden
                  className={active ? 'drop-shadow-[0_0_6px_var(--accent-glow)]' : undefined}
                />
                <span className="caption text-[10px] leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Reserves the space the fixed bar covers, so the last element on a page is
 * never trapped underneath it.
 */
export function BottomNavSpacer() {
  const pathname = usePathname() ?? '/'
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null
  return <div aria-hidden className="h-[calc(56px+env(safe-area-inset-bottom))] shrink-0" />
}
