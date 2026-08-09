/**
 * Dealing. Turn a setup config into a starting GameState.
 * Pure: the same (config, seed) always produces the same table.
 */

import { makeRng, shuffle } from './rng'
import { ROLES } from './roles'
import type { Composition } from './balance'
import type { GameSettings, GameState, RoleId, Seat } from './types'

export interface DealConfig {
  names: string[]
  composition: Composition
  themeId: string
  settings: GameSettings
  /** Injected by the store. The engine never invents randomness (D7). */
  seed: string
}

/** Starting charges per role. Absent = the role has no consumable resource. */
function startingCharges(roleId: RoleId): Seat['charges'] {
  switch (roleId) {
    case 'witch':
      return { life: 1, death: 1 }
    case 'vigilante':
      return { snipe: 2 }
    case 'alpha':
      return { rampage: 1 }
    case 'priest':
      return { bless: 1 }
    case 'prince':
      // Spent to survive the first execution.
      return { protect: 1 }
    case 'doctor':
      return { selfHeal: 1 }
    default:
      return {}
  }
}

/** Flatten a composition into one role id per seat. */
export function roleBag(composition: Composition): RoleId[] {
  const bag: RoleId[] = []
  for (const [roleId, count] of Object.entries(composition)) {
    for (let i = 0; i < (count ?? 0); i++) bag.push(roleId as RoleId)
  }
  return bag
}

export function deal(config: DealConfig): GameState {
  const rng = makeRng(config.seed)
  const dealt = shuffle(roleBag(config.composition), rng)

  const seats: Seat[] = config.names.map((name, i) => {
    const roleId = dealt[i] ?? 'villager'
    return {
      id: `s${i}`,
      name: name.trim() || `Player ${i + 1}`,
      roleId,
      alive: true,
      marks: [],
      charges: startingCharges(roleId),
    }
  })

  // The Executioner's mark is assigned now, not chosen: their beat only SHOWS
  // it to the host. Always a village-aligned seat, so the mark is someone the
  // town would plausibly hang.
  const executioner = seats.find((s) => s.roleId === 'executioner')
  if (executioner) {
    const candidates = seats.filter(
      (s) => s.id !== executioner.id && ROLES[s.roleId].faction === 'village',
    )
    const mark = candidates[Math.floor(rng() * candidates.length)]
    if (mark) executioner.execTargetId = mark.id
  }

  return {
    version: 2,
    seed: config.seed,
    themeId: config.themeId,
    phase: 'night',
    // Night 0 is an opening night with no kills; it is numbered 1 either way so
    // the host never reads "Night 0" aloud.
    dayNumber: 1,
    seats,
    intents: [],
    beatIndex: 0,
    log: [{ day: 0, phase: 'setup', text: `Roles dealt to ${seats.length} players.` }],
    settings: config.settings,
  }
}

/** Same players, same roles, freshly shuffled. */
export function rematch(prev: GameState, seed: string): GameState {
  return deal({
    names: prev.seats.map((s) => s.name),
    composition: prev.seats.reduce<Composition>((acc, s) => {
      acc[s.roleId] = (acc[s.roleId] ?? 0) + 1
      return acc
    }, {}),
    themeId: prev.themeId,
    settings: prev.settings,
    seed,
  })
}
