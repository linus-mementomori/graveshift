/**
 * Balance, GAME_DESIGN.md §5 and §10.
 *
 * Presets, the rule checks, the villageEdge heuristic, and the opening
 * vote-margin arithmetic. All pure; the setup screen calls this on every change.
 */

import { ROLES, isPowerRole } from './roles'
import type { RoleId } from './types'

export type Composition = Partial<Record<RoleId, number>>

/** Recommended presets, 5–20 players (GAME_DESIGN §5.1). */
export const PRESETS: Record<number, Composition> = {
  5: { werewolf: 1, seer: 1, villager: 3 },
  6: { werewolf: 1, seer: 1, doctor: 1, villager: 3 },
  7: { werewolf: 2, seer: 1, doctor: 1, villager: 3 },
  8: { werewolf: 2, seer: 1, doctor: 1, hunter: 1, villager: 3 },
  9: { werewolf: 2, seer: 1, doctor: 1, hunter: 1, villager: 4 },
  10: { werewolf: 2, seer: 1, doctor: 1, hunter: 1, witch: 1, villager: 4 },
  11: { werewolf: 3, seer: 1, doctor: 1, hunter: 1, witch: 1, villager: 4 },
  12: { werewolf: 3, seer: 1, doctor: 1, hunter: 1, witch: 1, jester: 1, villager: 4 },
  13: { werewolf: 3, seer: 1, doctor: 1, hunter: 1, witch: 1, jester: 1, villager: 5 },
  14: {
    werewolf: 2, minion: 1, alpha: 1, seer: 1, doctor: 1, hunter: 1,
    bodyguard: 1, jester: 1, villager: 5,
  },
  15: {
    werewolf: 3, alpha: 1, seer: 1, doctor: 1, hunter: 1, witch: 1, bodyguard: 1,
    jester: 1, villager: 5,
  },
  16: {
    werewolf: 3, alpha: 1, seer: 1, doctor: 1, hunter: 1, witch: 1, bodyguard: 1,
    mayor: 1, jester: 1, villager: 5,
  },
  17: {
    werewolf: 3, alpha: 1, seer: 1, doctor: 1, hunter: 1, witch: 1, bodyguard: 1,
    mayor: 1, jester: 1, serialKiller: 1, villager: 5,
  },
  18: {
    werewolf: 3, alpha: 1, blackmailer: 1, seer: 1, doctor: 1, hunter: 1, witch: 1,
    bodyguard: 1, mayor: 1, jester: 1, serialKiller: 1, villager: 5,
  },
  19: {
    werewolf: 3, alpha: 1, blackmailer: 1, seer: 1, doctor: 1, hunter: 1, witch: 1,
    bodyguard: 1, cupid: 1, jester: 1, serialKiller: 1, villager: 6,
  },
  20: {
    werewolf: 3, alpha: 1, blackmailer: 1, seer: 1, doctor: 1, hunter: 1, witch: 1,
    bodyguard: 1, cupid: 1, prince: 1, jester: 1, serialKiller: 1, villager: 6,
  },
}

export const totalPlayers = (c: Composition) =>
  Object.values(c).reduce<number>((n, v) => n + (v ?? 0), 0)

export const countByFaction = (c: Composition) => {
  let village = 0
  let mafia = 0
  let neutral = 0
  for (const [id, n] of Object.entries(c) as [RoleId, number][]) {
    const f = ROLES[id].faction
    if (f === 'mafia') mafia += n
    else if (f === 'neutral') neutral += n
    else village += n
  }
  return { village, mafia, neutral }
}

/** GAME_DESIGN §5.2 rule 1. The target mafia count for a table size. */
export const recommendedMafia = (players: number) =>
  Math.max(1, Math.min(Math.round(players * 0.26), Math.floor((players - 1) / 3)))

export const majority = (alive: number) => Math.floor(alive / 2) + 1

/**
 * The opening vote-margin check, GAME_DESIGN §10.2.
 * This is the single most load-bearing balance test: can evil simply out-vote
 * the town before any information exists?
 */
export function voteMarginCheck(c: Composition) {
  const players = totalPlayers(c)
  const { mafia } = countByFaction(c)
  const silencers = c.blackmailer ?? 0
  const evilBloc = mafia + silencers // a silenced villager is a vote removed
  const killsPerNight = mafia > 0 ? 1 : 0

  const dayOne = evilBloc + 2 <= majority(players)
  const afterOne = evilBloc + 1 <= majority(Math.max(3, players - 1 - killsPerNight))

  return { dayOne, afterOne, pass: dayOne && afterOne, evilBloc, majority: majority(players) }
}

/** Structural legality, GAME_DESIGN §5.2 rules 5–8, 11–12. */
export function ruleViolations(c: Composition): string[] {
  const players = totalPlayers(c)
  const { village, mafia } = countByFaction(c)
  const out: string[] = []

  for (const [id, n] of Object.entries(c) as [RoleId, number][]) {
    const min = ROLES[id].minPlayers
    if (n > 0 && min && players < min) {
      out.push(`${ROLES[id].id} needs at least ${min} players.`)
    }
  }

  // The 20–30% ratio floor only applies from 7 players up. At 5–6 the stronger
  // rule binds first: a second wolf would start the game at parity-minus-one.
  const ratio = players > 0 ? mafia / players : 0
  if (players >= 7 && ratio < 0.2) out.push('Too few mafia. The village will steamroll this.')
  if (ratio > 0.3) out.push('Too many mafia. They win before anyone learns anything.')

  const investigators = (c.seer ?? 0) + (c.gravedigger ?? 0)
  if (investigators === 0) out.push('No investigative role. This is a lottery, not a deduction game.')

  const protectors = (c.doctor ?? 0) + (c.bodyguard ?? 0) + (c.priest ?? 0)
  if (players >= 8 && protectors === 0) out.push('No protective role at this table size.')

  const powerRoles = (Object.entries(c) as [RoleId, number][])
    .filter(([id]) => isPowerRole(id))
    .reduce((n, [, v]) => n + v, 0)
  if (village > 0 && powerRoles / village > 0.55) {
    out.push('Almost everyone has a power. Nobody can bluff, and the social game dies.')
  }

  const villageKillers = (c.vigilante ?? 0) + (c.witch ?? 0) + (c.serialKiller ?? 0)
  if (villageKillers > Math.floor(players / 6)) {
    out.push('Too many night killers. The day stops mattering.')
  }

  if (!voteMarginCheck(c).afterOne) {
    out.push('The wolves can out-vote the town before the village learns anything.')
  }

  return out
}

/** The quick heuristic read shown before the simulator returns (§5.3). */
export function villageEdge(c: Composition): number {
  const powerRoles = (Object.entries(c) as [RoleId, number][])
    .filter(([id]) => isPowerRole(id))
    .reduce((n, [, v]) => n + v, 0)
  const investigators = (c.seer ?? 0) + (c.gravedigger ?? 0)
  const protectors = (c.doctor ?? 0) + (c.bodyguard ?? 0) + (c.priest ?? 0)
  const { mafia } = countByFaction(c)
  const mafiaSpecials = (c.alpha ?? 0) + (c.blackmailer ?? 0) + (c.minion ?? 0)
  const neutralKillers = c.serialKiller ?? 0

  return (
    powerRoles * 1.0 +
    investigators * 0.6 +
    protectors * 0.5 -
    mafia * 1.4 -
    mafiaSpecials * 0.7 -
    neutralKillers * 1.1
  )
}

export type BalanceLabel = 'village' | 'balanced' | 'mafia'

export function balanceRead(c: Composition): { label: BalanceLabel; copy: string; score: number } {
  const score = villageEdge(c)
  if (score >= 2) {
    return { label: 'village', score, copy: 'Good for new groups. The wolves will have to work.' }
  }
  if (score >= -1) {
    return { label: 'balanced', score, copy: 'A fair fight. This is the sweet spot.' }
  }
  return { label: 'mafia', score, copy: 'Brutal. Expect a short, tense game.' }
}

/** Night 0 defaults on for small tables, where the village needs the extra day. */
export const defaultNightZero = (players: number) => players <= 9
