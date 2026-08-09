/**
 * GRAVESHIFT ENGINE. Types
 *
 * ⚠ ARCHITECTURAL RULE: nothing in src/engine may import from outside src/engine.
 * The engine is pure (CONTEXT.md D7) so it can run in a Worker, in Node, and in tests.
 * No React. No browser APIs. No Date.now(). No Math.random().
 */

export type Faction = 'village' | 'mafia' | 'neutral'

export type Phase = 'setup' | 'night' | 'dawn' | 'day' | 'vote' | 'dusk' | 'end'

export type RoleId =
  // Tier 1, Core
  | 'villager'
  | 'werewolf'
  | 'seer'
  | 'doctor'
  // Tier 2, Standard
  | 'bodyguard'
  | 'hunter'
  | 'witch'
  | 'vigilante'
  | 'mayor'
  | 'lycan'
  | 'minion'
  | 'alpha'
  | 'cupid'
  // Tier 3, Advanced
  | 'jester'
  | 'serialKiller'
  | 'executioner'
  | 'blackmailer'
  | 'prince'
  | 'gravedigger'
  | 'priest'
  | 'sleepwalker'

export type AbilityId =
  | 'kill'
  | 'investigate'
  | 'protect'
  | 'guard'
  | 'bless'
  | 'silence'
  | 'potion'
  | 'snipe'
  | 'link'
  | 'exhume'
  | 'sense'

export type Mark = 'protected' | 'guarded' | 'blessed' | 'silenced' | 'targeted' | 'revealed'

export type DeathReason =
  | 'mafia_kill'
  | 'serial_killer'
  | 'vigilante'
  | 'witch_poison'
  | 'bodyguard_sacrifice'
  | 'lover_grief'
  | 'hunter_revenge'
  | 'execution'
  | 'vigilante_guilt'

export type CueId =
  | 'NIGHT_FALL'
  | 'WOLVES_WAKE'
  | 'SEER_WAKE'
  | 'DOCTOR_WAKE'
  | 'WITCH_WAKE'
  | 'NIGHT_END'
  | 'DAWN'
  | 'DEATH_REVEAL'
  | 'NO_DEATH'
  | 'DAY'
  | 'VOTE'
  | 'EXECUTION'
  | 'LAST_WORDS'
  | 'VICTORY_VILLAGE'
  | 'VICTORY_MAFIA'
  | 'VICTORY_NEUTRAL'

export type BeatId =
  | 'cupid_link'
  | 'lovers_wake'
  | 'executioner_target'
  | 'minion_sees'
  | 'wolves_recognise'
  | 'blackmailer_silence'
  | 'doctor_protect'
  | 'bodyguard_guard'
  | 'priest_bless'
  | 'seer_investigate'
  | 'wolves_kill'
  | 'sk_kill'
  | 'vigilante_shoot'
  | 'witch_act'
  | 'gravedigger_exhume'
  | 'sleepwalker_stir'

/** A player position. We say "seat" in code, "player" in the UI. */
export interface Seat {
  id: string
  name: string
  roleId: RoleId
  alive: boolean
  marks: Mark[]
  /**
   * Remaining uses: witch potions, vigilante ammo, doctor self-heals, one-shots.
   * `guilt` is a pending flag, not a resource: set when a Vigilante shoots the
   * village, spent when they die of it the following night (GAME_DESIGN §3).
   */
  charges: Partial<
    Record<AbilityId | 'selfHeal' | 'life' | 'death' | 'rampage' | 'guilt', number>
  >
  loverId?: string
  execTargetId?: string
  lastProtectedId?: string
  notes?: string
}

export interface Role {
  id: RoleId
  faction: Faction
  tier: 1 | 2 | 3
  /** Lower acts first. Undefined = no night action. See GAME_DESIGN §4.1. */
  nightOrder?: number
  firstNightOnly?: boolean
  ability?: AbilityId
  beatId?: BeatId
  /** Minimum table size this role is legal at (GAME_DESIGN §5.2). */
  minPlayers?: number
  /** One-line summary shown in setup. */
  summary: string
}

/**
 * A recorded night action. Intents are collected, NOT applied. The whole night
 * resolves in one deterministic pass at dawn (GAME_DESIGN §4.2). This is what
 * makes "Back" trivial and edge cases decidable.
 */
export interface Intent {
  beatId: BeatId
  sourceSeatId: string | null
  targetSeatId: string | null
  variant?: 'life' | 'death' | 'rampage'
}

export interface Death {
  seatId: string
  reason: DeathReason
}

export interface LogEntry {
  day: number
  phase: Phase
  text: string
  /** Set on the entry the engine judges to have decided the game. */
  decisive?: boolean
}

export interface GameSettings {
  nightZero: boolean
  revealRoleOnDeath: boolean
  generatedAudio: boolean
  dayTimerSeconds: number | null
}

export interface WinResult {
  faction: Faction
  roleId?: RoleId
  /** True when the finish was decided by a player who could not themselves win. */
  kingmaker: boolean
  message: string
}

export interface GameState {
  version: 2
  seed: string
  themeId: string
  phase: Phase
  dayNumber: number
  seats: Seat[]
  intents: Intent[]
  beatIndex: number
  log: LogEntry[]
  settings: GameSettings
  winner?: WinResult
  /**
   * Mayor has revealed; their vote counts double from here on.
   *
   * Transient per-cycle results (deaths, night info, owed Hunter shots, the
   * live vote tally) deliberately live in the STORE, not here. They belong to
   * one phase, not to the game.
   */
  mayorRevealedId?: string
}

/** A single host instruction inside a phase. */
export interface Beat {
  id: BeatId
  roleId: RoleId
  cueId?: CueId
  /** Seats that may act on this beat. Empty = beat is skipped. */
  actors: Seat[]
}
