/**
 * Themes are PURE DATA (CONTEXT.md decision D4).
 * A theme changes names, flavour, narration, colour and cue text. Never the rules.
 * Adding a theme is one file and zero engine changes.
 */

import type { CueId, DeathReason, RoleId } from '@/engine/types'

export type ThemeCategory =
  | 'horror'
  | 'crime'
  | 'anime'
  | 'myth'
  | 'scifi'
  | 'history'
  | 'fantasy'

export interface RoleSkin {
  name: string
  flavour: string
}

export interface Theme {
  id: string
  name: string
  tagline: string
  category: ThemeCategory
  /** Substituted into narration, e.g. "the village", "the city". */
  place: string
  factionNames: { village: string; mafia: string; neutral: string }
  roleSkins: Partial<Record<RoleId, RoleSkin>>
  narration: {
    nightFall: string
    wolvesWake: string
    seerWake: string
    doctorWake: string
    dawn: string
    noDeath: string
    day: string
    vote: string
    execution: string
  }
  /**
   * One line, or several to pick between. Built-in themes supply several so a
   * five-night game doesn't repeat itself. A bare string stays valid, because
   * every custom theme already saved to Supabase was written that way.
   *
   * Lines are verb phrases completing "<name> …", never full sentences.
   */
  deathFlavour: Partial<Record<DeathReason, string | string[]>>
  cueOverrides: Partial<Record<CueId, string>>
  victory: { village: string; mafia: string; neutral: string }
}
