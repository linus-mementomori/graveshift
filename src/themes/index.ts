import type { Theme } from './types'
import type { RoleId } from '@/engine/types'
import { ROLES } from '@/engine/roles'

import { millersHollow } from './millersHollow'
import { cosaNostra } from './cosaNostra'
import { hunterDemon } from './hunterDemon'
import { olympus } from './olympus'
import { signalLost } from './signalLost'
import { salem } from './salem'
import { longCourt } from './longCourt'

export const THEMES: Theme[] = [
  millersHollow,
  cosaNostra,
  hunterDemon,
  olympus,
  signalLost,
  salem,
  longCourt,
]

export const THEMES_BY_ID: Record<string, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
)

export const DEFAULT_THEME_ID = millersHollow.id

export const getTheme = (id: string): Theme => THEMES_BY_ID[id] ?? millersHollow

/** Themed role name, falling back to the canonical English name. */
export const roleName = (theme: Theme, roleId: RoleId): string =>
  theme.roleSkins[roleId]?.name ??
  roleId.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())

export const roleFlavour = (theme: Theme, roleId: RoleId): string =>
  theme.roleSkins[roleId]?.flavour ?? ROLES[roleId].summary

export type { Theme } from './types'
