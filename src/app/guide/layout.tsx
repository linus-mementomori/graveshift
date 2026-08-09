import type { Metadata } from 'next'

/**
 * Client pages cannot export `metadata`, so public routes that we want indexed
 * get a thin server layout beside them purely to carry it.
 */
export const metadata: Metadata = {
  title: 'How to host Werewolf: night order, roles and rules',
  description:
    'A moderator guide to hosting Werewolf and Mafia: the night order, what every role does, how to deliver the script, and how to keep a table of 5–20 players moving.',
  alternates: { canonical: '/guide/' },
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children
}
