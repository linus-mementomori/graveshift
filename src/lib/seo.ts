/**
 * SEO constants and structured data.
 *
 * One honest note before anyone tunes this: search engines rank *pages people
 * find useful*, and this app is one screen plus a game engine. The realistic
 * win here is ranking for specific, low-competition intent — "werewolf game
 * master app", "mafia night order", "how to host werewolf" — not for the head
 * term "werewolf", which belongs to a film franchise and always will.
 *
 * Stuffing broad trendy keywords is actively counter-productive: Google has
 * penalised keyword stuffing since 2011, and irrelevant traffic that bounces in
 * three seconds teaches the ranking system the page is bad. See docs/SEO.md.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://graveshift.1stplaybook.com'

export const SITE_NAME = 'Graveshift'

export const SITE_TAGLINE = 'The game master in your pocket'

export const SITE_DESCRIPTION =
  'Free Werewolf and Mafia moderator app. Deals roles, runs the night order, settles the rules, and tells you exactly what to say. 5–20 players, works offline, no sign-up needed.'

/**
 * Terms real people actually type when they have this problem. Chosen for
 * intent, not volume.
 *
 * NOTE: the `keywords` meta tag itself has been ignored by Google since 2009 —
 * it is included only because Bing and some smaller engines still read it, and
 * it costs nothing. The words that actually matter are the ones in the visible
 * headings and body copy.
 */
export const SITE_KEYWORDS = [
  'werewolf game moderator',
  'mafia game host app',
  'werewolf night order',
  'how to host werewolf',
  'mafia party game rules',
  'werewolf role generator',
  'social deduction game app',
  'werewolf card game online',
  'mafia moderator tool',
  'party game for large groups',
]

/**
 * JSON-LD. This is the part that genuinely moves the needle — it is how you get
 * rich results rather than a plain blue link, and unlike meta keywords, Google
 * documents and uses it.
 */
export function softwareAppJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any — installable web app (iOS, Android, desktop)',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Deals hidden roles to 5–20 players',
      'Runs the werewolf night order automatically',
      'Resolves protection, kills and win conditions',
      'Seven themes, plus custom themes you write yourself',
      'Works fully offline',
    ],
    browserRequirements: 'Requires JavaScript.',
  }
}

/** Answers the questions people literally type into Google. */
export function faqJsonLd() {
  const qa: [string, string][] = [
    [
      'How many players do you need for Werewolf?',
      'Between 5 and 20. The game is best with 8 to 15 — below 8 there is not enough discussion for deduction to work, and above 18 the conversation gets hard to manage.',
    ],
    [
      'What is the night order in Werewolf?',
      'The fixed sequence in which roles act each night. Graveshift runs it for you: Cupid and one-time roles first, then protective roles like the Doctor and Bodyguard, then the Seer, then the Werewolves, then the Witch. Getting this order wrong is the most common hosting mistake.',
    ],
    [
      'Do you need a moderator to play Werewolf?',
      'Traditionally yes, and that person never gets to play. Graveshift takes over the bookkeeping — who is alive, who was protected, who wins — so the host only has to perform, or so a player can host and still take part.',
    ],
    [
      'Is Graveshift free?',
      'Yes. It is free, needs no account to play, and works offline once loaded.',
    ],
    [
      'What is the difference between Mafia and Werewolf?',
      'They are the same game with different names. Mafia is the 1986 original; Werewolf is the 1997 retheme. Graveshift ships both, plus five other settings, and the rules underneath are identical.',
    ],
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}
