/**
 * The role catalogue — GAME_DESIGN.md §3.
 * Roles are theme-agnostic rules. Themes supply the *names* (see src/themes).
 */

import type { Role, RoleId } from './types'

export const ROLES: Record<RoleId, Role> = {
  // ── Tier 1 · Core ─────────────────────────────────────────────────────────
  villager: {
    id: 'villager',
    faction: 'village',
    tier: 1,
    summary: 'No ability. Votes, talks, and lies convincingly about nothing.',
  },
  werewolf: {
    id: 'werewolf',
    faction: 'mafia',
    tier: 1,
    nightOrder: 30,
    ability: 'kill',
    beatId: 'wolves_kill',
    summary: 'Each night the pack collectively chooses one player to kill.',
  },
  seer: {
    id: 'seer',
    faction: 'village',
    tier: 1,
    nightOrder: 25,
    ability: 'investigate',
    beatId: 'seer_investigate',
    summary: "Each night, learn whether one player is Mafia.",
  },
  doctor: {
    id: 'doctor',
    faction: 'village',
    tier: 1,
    nightOrder: 20,
    ability: 'protect',
    beatId: 'doctor_protect',
    summary: 'Protect one player from death. Never the same player twice in a row.',
  },

  // ── Tier 2 · Standard ─────────────────────────────────────────────────────
  bodyguard: {
    id: 'bodyguard',
    faction: 'village',
    tier: 2,
    nightOrder: 21,
    ability: 'guard',
    beatId: 'bodyguard_guard',
    summary: 'Dies in place of the player they guard. Absorbs one attack.',
  },
  hunter: {
    id: 'hunter',
    faction: 'village',
    tier: 2,
    summary: 'On death, immediately takes one other player with them.',
  },
  witch: {
    id: 'witch',
    faction: 'village',
    tier: 2,
    nightOrder: 50,
    ability: 'potion',
    beatId: 'witch_act',
    summary: 'One Life potion, one Death potion. Sees who is about to die.',
  },
  vigilante: {
    id: 'vigilante',
    faction: 'village',
    tier: 2,
    nightOrder: 40,
    ability: 'snipe',
    beatId: 'vigilante_shoot',
    summary: 'Two night kills. Dies of guilt if a shot hits the village.',
  },
  mayor: {
    id: 'mayor',
    faction: 'village',
    tier: 2,
    summary: 'May reveal during the day; their vote then counts twice.',
  },
  lycan: {
    id: 'lycan',
    faction: 'village',
    tier: 2,
    summary: 'A true villager who reads as Mafia to the Seer.',
  },
  minion: {
    id: 'minion',
    faction: 'mafia',
    tier: 2,
    nightOrder: 5,
    firstNightOnly: true,
    beatId: 'minion_sees',
    summary: 'Knows the wolves. The wolves do not know them. No kill.',
  },
  alpha: {
    id: 'alpha',
    faction: 'mafia',
    tier: 2,
    nightOrder: 30,
    ability: 'kill',
    beatId: 'wolves_kill',
    minPlayers: 12,
    summary: 'Once per game, a Rampage kill that ignores all protection.',
  },
  cupid: {
    id: 'cupid',
    faction: 'village',
    tier: 2,
    nightOrder: 1,
    firstNightOnly: true,
    ability: 'link',
    beatId: 'cupid_link',
    minPlayers: 9,
    summary: 'Links two players as Lovers. If one dies, the other dies of grief.',
  },

  // ── Tier 3 · Advanced ─────────────────────────────────────────────────────
  jester: {
    id: 'jester',
    faction: 'neutral',
    tier: 3,
    minPlayers: 10,
    summary: 'Wins instantly if executed by daytime vote. Night deaths do not count.',
  },
  serialKiller: {
    id: 'serialKiller',
    faction: 'neutral',
    tier: 3,
    nightOrder: 35,
    ability: 'kill',
    beatId: 'sk_kill',
    minPlayers: 15,
    summary: 'Kills each night, immune to the Mafia kill, and wins alone.',
  },
  executioner: {
    id: 'executioner',
    faction: 'neutral',
    tier: 3,
    nightOrder: 3,
    firstNightOnly: true,
    beatId: 'executioner_target',
    minPlayers: 12,
    summary: 'Wins if their assigned target is executed by vote.',
  },
  blackmailer: {
    id: 'blackmailer',
    faction: 'mafia',
    tier: 3,
    nightOrder: 10,
    ability: 'silence',
    beatId: 'blackmailer_silence',
    minPlayers: 14,
    summary: 'Silences one player: no speaking and no vote the following day.',
  },
  prince: {
    id: 'prince',
    faction: 'village',
    tier: 3,
    summary: 'Survives the first execution by revealing. The vote is spent.',
  },
  gravedigger: {
    id: 'gravedigger',
    faction: 'village',
    tier: 3,
    nightOrder: 60,
    ability: 'exhume',
    beatId: 'gravedigger_exhume',
    summary: 'Each night, learn the exact role of one dead player.',
  },
  priest: {
    id: 'priest',
    faction: 'village',
    tier: 3,
    nightOrder: 22,
    ability: 'bless',
    beatId: 'priest_bless',
    summary: 'One-shot: makes a player immune to all death for a full cycle.',
  },
  sleepwalker: {
    id: 'sleepwalker',
    faction: 'village',
    tier: 3,
    nightOrder: 65,
    ability: 'sense',
    beatId: 'sleepwalker_stir',
    summary: 'Learns whether anyone died last night — but not who.',
  },
}

export const ROLE_LIST: Role[] = Object.values(ROLES)

export const rolesByTier = (tier: 1 | 2 | 3) => ROLE_LIST.filter((r) => r.tier === tier)

export const rolesByFaction = (faction: Role['faction']) =>
  ROLE_LIST.filter((r) => r.faction === faction)

/** Village-aligned roles that are not plain villagers. */
export const isPowerRole = (id: RoleId) =>
  ROLES[id].faction === 'village' && id !== 'villager' && id !== 'lycan'

/** Roles that can produce a night kill — used by the balance caps (§5.2 rule 4). */
export const isKiller = (id: RoleId) =>
  ROLES[id].ability === 'kill' || id === 'vigilante' || id === 'witch'
