/**
 * Themes are PURE DATA (CONTEXT.md decision D4).
 * A theme changes names, flavour, narration, colour and cue text — never the rules.
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
  deathFlavour: Partial<Record<DeathReason, string>>
  cueOverrides: Partial<Record<CueId, string>>
  victory: { village: string; mafia: string; neutral: string }
}
