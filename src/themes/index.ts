import type { Theme } from './types'
import type { RoleId } from '@/engine/types'
import { ROLES } from '@/engine/roles'

import { millersHollow } from './millersHollow'
import { cosaNostra } from './cosaNostra'
import { hunterDemon } from './hunterDemon'
import { aeaea } from './aeaea'
import { widowsBay } from './widowsBay'
import { signalLost } from './signalLost'
import { salem } from './salem'
import { longCourt } from './longCourt'

export const THEMES: Theme[] = [
  millersHollow,
  cosaNostra,
  hunterDemon,
  aeaea,
  widowsBay,
  signalLost,
  salem,
  longCourt,
]

export const THEMES_BY_ID: Record<string, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
)

export const DEFAULT_THEME_ID = millersHollow.id

/**
 * Custom themes registered at runtime, keyed by their database row id.
 *
 * Kept in a separate map so `THEMES` stays exactly the seven built-ins (the
 * setup grid, the docs and the tests all assume that), while `getTheme()` keeps
 * working unchanged for every component during play. None of them need to know
 * whether the host picked a shipped costume or one they wrote themselves.
 */
const CUSTOM_THEMES: Record<string, Theme> = {}

export function registerCustomTheme(theme: Theme): void {
  CUSTOM_THEMES[theme.id] = theme
}

export function clearCustomThemes(): void {
  for (const key of Object.keys(CUSTOM_THEMES)) delete CUSTOM_THEMES[key]
}

export const isCustomThemeId = (id: string): boolean => id in CUSTOM_THEMES

export const getTheme = (id: string): Theme =>
  THEMES_BY_ID[id] ?? CUSTOM_THEMES[id] ?? millersHollow

/** Themed role name, falling back to the canonical English name. */
export const roleName = (theme: Theme, roleId: RoleId): string =>
  theme.roleSkins[roleId]?.name ??
  roleId.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())

export const roleFlavour = (theme: Theme, roleId: RoleId): string =>
  theme.roleSkins[roleId]?.flavour ?? ROLES[roleId].summary

export type { Theme } from './types'
