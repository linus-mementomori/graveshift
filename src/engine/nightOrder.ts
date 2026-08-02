/**
 * The night order table — GAME_DESIGN.md §4.1.
 * The engine walks these in ascending order, skipping beats with no living actor.
 */

import type { BeatId, CueId, RoleId } from './types'

export interface BeatDef {
  id: BeatId
  order: number
  roleId: RoleId
  cueId?: CueId
  firstNightOnly?: boolean
  /** Whether the beat produces private information the host must not show the table. */
  secret?: boolean
}

// NOTE: the BeatDef[] annotation only gives contextual typing (so each `id`
// stays a BeatId literal instead of widening to `string`) when it's applied
// directly to this array literal. Chaining `.sort()` onto the literal breaks
// that — the annotation would apply to the sort *call's* result, not to the
// literal itself — so the array is declared first and sorted as a second,
// separate (mutating) statement.
export const NIGHT_ORDER: BeatDef[] = [
  { id: 'cupid_link', order: 1, roleId: 'cupid', firstNightOnly: true },
  { id: 'lovers_wake', order: 2, roleId: 'cupid', firstNightOnly: true, secret: true },
  { id: 'executioner_target', order: 3, roleId: 'executioner', firstNightOnly: true, secret: true },
  { id: 'minion_sees', order: 5, roleId: 'minion', firstNightOnly: true, secret: true },
  { id: 'wolves_recognise', order: 6, roleId: 'werewolf', firstNightOnly: true },
  { id: 'blackmailer_silence', order: 10, roleId: 'blackmailer' },
  { id: 'doctor_protect', order: 20, roleId: 'doctor', cueId: 'DOCTOR_WAKE' },
  { id: 'bodyguard_guard', order: 21, roleId: 'bodyguard' },
  { id: 'priest_bless', order: 22, roleId: 'priest' },
  { id: 'seer_investigate', order: 25, roleId: 'seer', cueId: 'SEER_WAKE', secret: true },
  { id: 'wolves_kill', order: 30, roleId: 'werewolf', cueId: 'WOLVES_WAKE' },
  { id: 'sk_kill', order: 35, roleId: 'serialKiller' },
  { id: 'vigilante_shoot', order: 40, roleId: 'vigilante' },
  { id: 'witch_act', order: 50, roleId: 'witch', cueId: 'WITCH_WAKE', secret: true },
  { id: 'gravedigger_exhume', order: 60, roleId: 'gravedigger', secret: true },
  { id: 'sleepwalker_stir', order: 65, roleId: 'sleepwalker', secret: true },
]
NIGHT_ORDER.sort((a, b) => a.order - b.order)

export const beatById = (id: BeatId): BeatDef | undefined => NIGHT_ORDER.find((b) => b.id === id)
