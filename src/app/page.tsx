'use client'

import Link from 'next/link'
import { ButtonLink } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { getTheme } from '@/themes'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

const PHASE_LABEL: Record<string, string> = {
  night: 'Night',
  dawn: 'Dawn',
  day: 'Day',
  vote: 'Vote',
  dusk: 'Dusk',
}

export default function Home() {
  const themeId = useGameStore((s) => s.themeId)
  const theme = getTheme(themeId)
  const { email } = useAuth()
  const game = useGameStore((s) => s.game)

  // Resume is offered only for a game that's actually mid-flight (DESIGN §7.1).
  const resumable = game && game.phase !== 'end'

  return (
    <div className="flex min-h-dvh flex-col justify-between px-5 pt-24 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div>
        <h1 className="display pulse-glow text-5xl text-[var(--accent)]">PROJECT REMUS</h1>
        <p className="caption mt-3 text-[var(--text-muted)]">
          the game master in your pocket
        </p>
        <p className="speak-sm mt-10 text-[var(--text-secondary)]">{theme.tagline}</p>
      </div>

      <div className="space-y-3">
        {resumable && (
          <ButtonLink href="/play">
            ↻ Resume — {PHASE_LABEL[game.phase] ?? game.phase} {game.dayNumber}
          </ButtonLink>
        )}
        <ButtonLink href="/setup/players" variant={resumable ? 'secondary' : 'primary'}>
          ▶ New game
        </ButtonLink>
        <ButtonLink href="/guide" variant="secondary">
          How to host
        </ButtonLink>
        {isSupabaseConfigured && (
          <p className="caption pt-1 text-center">
            <Link
              href={email ? '/account' : '/auth/sign-in'}
              className="text-[var(--text-muted)] underline underline-offset-4"
            >
              {email ? 'Your account' : 'Sign in'}
            </Link>
          </p>
        )}
        <p className="caption pt-2 text-center text-[var(--text-muted)]">
          {theme.name} · 5–20 players · works offline
        </p>
      </div>

      <AboutContent />
    </div>
  )
}

/**
 * Below-the-fold content.
 *
 * The app screen above is deliberately almost wordless — that is correct for a
 * host holding a phone in a dark room, and useless to a search engine, which
 * can only rank text it can read. This section sits under the CTAs so it never
 * costs the host a tap, and gives crawlers something real: what the app does,
 * how the game works, and answers to the questions people actually search for.
 *
 * The Q&A here intentionally mirrors faqJsonLd() in src/lib/seo.ts — Google
 * expects structured data to match visible content, and penalises FAQ markup
 * that has no on-page equivalent.
 */
function AboutContent() {
  const faqs: [string, string][] = [
    [
      'How many players do you need for Werewolf?',
      'Between 5 and 20. It is best with 8 to 15 — below 8 there is not enough discussion for deduction to work, and above 18 the conversation gets hard to hold together.',
    ],
    [
      'What is the night order in Werewolf?',
      'The fixed sequence in which roles act each night. Project Remus runs it for you: one-time roles like Cupid first, then protective roles such as the Doctor and Bodyguard, then the Seer, then the Werewolves, then the Witch. Getting this order wrong is the single most common hosting mistake.',
    ],
    [
      'Do you need a moderator to play Werewolf?',
      'Traditionally yes — and that person never gets to play. Project Remus takes over the bookkeeping, so the host only has to perform.',
    ],
    [
      'What is the difference between Mafia and Werewolf?',
      'The same game with different names. Mafia is the 1986 original, Werewolf the 1997 retheme. Both are included here, and the rules underneath are identical.',
    ],
  ]

  return (
    <section className="mt-24 border-t border-[var(--border-subtle)] pt-10">
      <h2 className="display glow-sm text-2xl">A werewolf moderator that never sits out</h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
        Hosting social deduction games is miserable: ten minutes shuffling role cards, somebody
        always sees one, and the moderator holds twelve secret identities in their head while
        googling whether the Seer sees the Lycan as a wolf. Project Remus is a free, installable web
        app that does all of that for you — it deals the roles, walks the night order, resolves
        protection and kills, checks the win conditions, and tells you exactly what to say out loud
        at every beat.
      </p>

      <h3 className="display glow-sm mt-8 text-lg">How a game runs</h3>
      <ol className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        <li>
          <strong className="text-[var(--text-primary)]">Set up.</strong> Pick your player count,
          choose a world, balance the roles, name everyone, and pass the phone around to deal.
        </li>
        <li>
          <strong className="text-[var(--text-primary)]">Night.</strong> The app calls each role in
          the correct order and records who they picked — nothing resolves until the night ends.
        </li>
        <li>
          <strong className="text-[var(--text-primary)]">Dawn.</strong> One deterministic pass works
          out who actually died, including protections, potions and revenge kills.
        </li>
        <li>
          <strong className="text-[var(--text-primary)]">Day and vote.</strong> Discuss, accuse,
          count the votes, execute. Then night falls again.
        </li>
      </ol>

      <h3 className="display glow-sm mt-8 text-lg">Roles and themes</h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
        Twenty-one roles across three tiers — Werewolf, Seer, Doctor, Witch, Hunter, Bodyguard,
        Vigilante, Mayor, Cupid, Jester, Serial Killer and more. Seven built-in themes reskin every
        word and colour: folk horror in Millers Hollow, noir crime in Cosa Nostra, anime, Greek
        myth, sci-fi horror, Salem 1692, and dark fantasy. Signed-in hosts can write their own
        theme and rewrite every line of the script.
      </p>

      <h3 className="display glow-sm mt-8 text-lg">Common questions</h3>
      <dl className="mt-3 space-y-4">
        {faqs.map(([q, a]) => (
          <div key={q}>
            <dt className="text-sm font-medium text-[var(--text-primary)]">{q}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{a}</dd>
          </div>
        ))}
      </dl>

      <p className="caption mt-10 text-[var(--text-muted)]">
        Free · no account needed to play · works offline once loaded
      </p>
    </section>
  )
}
