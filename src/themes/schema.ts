/**
 * Theme validation, CONTEXT.md D11.
 *
 * Built-in themes are checked by TypeScript. Custom themes arrive as `jsonb`
 * from a database, authored by a user, and TypeScript cannot help with that at
 * all. This module is the wall between "someone typed something odd into a form"
 * and "the play screen breaks at 1 a.m. in front of twelve people".
 *
 * Hand-rolled rather than Zod on purpose: the shape is fixed and ours, and the
 * app committed to a ≤120 kB first-load budget (ARCHITECTURE §9). This costs
 * about 2 kB; Zod would cost ~13 kB for the same certainty.
 */

import type { Theme, ThemeCategory } from './types'
import type { CueId, DeathReason, RoleId } from '@/engine/types'

export const THEME_CATEGORIES: ThemeCategory[] = [
  'horror',
  'crime',
  'anime',
  'myth',
  'scifi',
  'history',
  'fantasy',
]

export const NARRATION_KEYS = [
  'nightFall',
  'wolvesWake',
  'seerWake',
  'doctorWake',
  'dawn',
  'noDeath',
  'day',
  'vote',
  'execution',
] as const

export type NarrationKey = (typeof NARRATION_KEYS)[number]

/** Human labels for the editor. */
export const NARRATION_LABELS: Record<NarrationKey, string> = {
  nightFall: 'Night falls',
  wolvesWake: 'Wolves wake',
  seerWake: 'Seer wakes',
  doctorWake: 'Doctor wakes',
  dawn: 'Dawn breaks',
  noDeath: 'Nobody died',
  day: 'Day begins',
  vote: 'Call the vote',
  execution: 'After an execution',
}

/**
 * GAME_DESIGN §8.4. A read-aloud line must be speakable in one breath and must
 * fit on a 360 px screen without truncating or scrolling (DESIGN §4.3). Past
 * ~35 words neither is true.
 */
export const MAX_NARRATION_WORDS = 35

export const LIMITS = {
  name: 60,
  tagline: 140,
  place: 40,
  factionName: 40,
  roleName: 40,
  roleFlavour: 200,
  line: 400,
  /** Ceiling on death-flavour variants, so a pasted theme can't be unbounded. */
  deathVariants: 6,
} as const

export const wordCount = (s: string): number =>
  s.trim().split(/\s+/).filter(Boolean).length

export interface ValidationResult {
  ok: boolean
  errors: string[]
  /** Present only when ok. */
  theme?: Theme
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/**
 * Validate an untrusted object into a Theme.
 *
 * Deliberately strict about the things that would break a game (missing
 * narration, over-long read-aloud lines) and forgiving about the things that
 * degrade gracefully (a missing role skin falls back to the canonical name).
 */
export function validateTheme(input: unknown): ValidationResult {
  const errors: string[] = []

  if (!isRecord(input)) {
    return { ok: false, errors: ['Theme is not an object.'] }
  }

  const name = str(input.name).trim()
  if (!name) errors.push('Name is required.')
  if (name.length > LIMITS.name) errors.push(`Name must be ${LIMITS.name} characters or fewer.`)

  const tagline = str(input.tagline).trim()
  if (tagline.length > LIMITS.tagline) {
    errors.push(`Tagline must be ${LIMITS.tagline} characters or fewer.`)
  }

  const category = str(input.category) as ThemeCategory
  if (!THEME_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${THEME_CATEGORIES.join(', ')}.`)
  }

  const place = str(input.place).trim() || 'the village'
  if (place.length > LIMITS.place) errors.push(`Place must be ${LIMITS.place} characters or fewer.`)

  // ── factions ──────────────────────────────────────────────────────────────
  const rawFactions = isRecord(input.factionNames) ? input.factionNames : {}
  const factionNames = {
    village: str(rawFactions.village).trim() || 'the village',
    mafia: str(rawFactions.mafia).trim() || 'the wolves',
    neutral: str(rawFactions.neutral).trim() || 'the outsiders',
  }
  for (const [k, v] of Object.entries(factionNames)) {
    if (v.length > LIMITS.factionName) errors.push(`Faction name "${k}" is too long.`)
  }

  // ── narration. The part that must not be wrong ───────────────────────────
  const rawNarration = isRecord(input.narration) ? input.narration : {}
  const narration = {} as Theme['narration']
  for (const key of NARRATION_KEYS) {
    const line = str(rawNarration[key]).trim()
    if (!line) {
      errors.push(`Narration "${NARRATION_LABELS[key]}" is required.`)
      continue
    }
    if (wordCount(line) > MAX_NARRATION_WORDS) {
      errors.push(
        `"${NARRATION_LABELS[key]}" is ${wordCount(line)} words. Keep it to ${MAX_NARRATION_WORDS} or fewer so it fits on one screen.`,
      )
    }
    if (line.length > LIMITS.line) errors.push(`"${NARRATION_LABELS[key]}" is too long.`)
    narration[key] = line
  }

  // ── victory ───────────────────────────────────────────────────────────────
  const rawVictory = isRecord(input.victory) ? input.victory : {}
  const victory = {
    village: str(rawVictory.village).trim() || 'The village survives.',
    mafia: str(rawVictory.mafia).trim() || 'The wolves take everything.',
    neutral: str(rawVictory.neutral).trim() || 'Someone else wins entirely.',
  }
  for (const [k, v] of Object.entries(victory)) {
    if (wordCount(v) > MAX_NARRATION_WORDS) errors.push(`Victory line "${k}" is too long to read aloud.`)
  }

  // ── optional maps. Degrade gracefully, never fatal ───────────────────────
  const roleSkins: Theme['roleSkins'] = {}
  if (isRecord(input.roleSkins)) {
    for (const [roleId, value] of Object.entries(input.roleSkins)) {
      if (!isRecord(value)) continue
      const skinName = str(value.name).trim()
      const flavour = str(value.flavour).trim()
      if (!skinName) continue
      roleSkins[roleId as RoleId] = {
        name: skinName.slice(0, LIMITS.roleName),
        flavour: flavour.slice(0, LIMITS.roleFlavour),
      }
    }
  }

  const deathFlavour: Theme['deathFlavour'] = {}
  if (isRecord(input.deathFlavour)) {
    for (const [k, v] of Object.entries(input.deathFlavour)) {
      // Either shape is accepted: a bare string (how every custom theme already
      // in Supabase was written) or several variants to pick between.
      if (Array.isArray(v)) {
        const lines = v
          .map((x) => str(x).trim())
          .filter(Boolean)
          .slice(0, LIMITS.deathVariants)
          .map((x) => x.slice(0, LIMITS.line))
        if (lines.length) deathFlavour[k as DeathReason] = lines
      } else {
        const line = str(v).trim()
        if (line) deathFlavour[k as DeathReason] = line.slice(0, LIMITS.line)
      }
    }
  }

  const cueOverrides: Theme['cueOverrides'] = {}
  if (isRecord(input.cueOverrides)) {
    for (const [k, v] of Object.entries(input.cueOverrides)) {
      const line = str(v).trim()
      if (line) cueOverrides[k as CueId] = line.slice(0, LIMITS.line)
    }
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    errors: [],
    theme: {
      id: str(input.id) || `custom-${Date.now()}`,
      name,
      tagline,
      category,
      place,
      factionNames,
      roleSkins,
      narration,
      deathFlavour,
      cueOverrides,
      victory,
    },
  }
}

/**
 * Fail closed. An invalid custom theme falls back to a known-good one rather
 * than reaching a play screen half-rendered. A broken theme should cost the
 * host a costume, never a game.
 */
export function safeTheme(input: unknown, fallback: Theme): Theme {
  const result = validateTheme(input)
  return result.ok && result.theme ? result.theme : fallback
}

/** Seed an editor from an existing theme. A costume, not a fork of the rules. */
export function draftFrom(base: Theme, name: string): Theme {
  return {
    ...base,
    id: `custom-${Date.now()}`,
    name,
    roleSkins: { ...base.roleSkins },
    narration: { ...base.narration },
    // Copy the variant arrays too. A spread alone would hand the draft the
    // built-in theme's own arrays, so editing the draft would edit the original.
    deathFlavour: Object.fromEntries(
      Object.entries(base.deathFlavour).map(([k, v]) => [k, Array.isArray(v) ? [...v] : v]),
    ) as Theme['deathFlavour'],
    cueOverrides: { ...base.cueOverrides },
    factionNames: { ...base.factionNames },
    victory: { ...base.victory },
  }
}
