/**
 * Night resolution. The deterministic pass that turns a night's INTENTS into
 * deaths (GAME_DESIGN §4.2).
 *
 * Why intents rather than immediate mutation: the host taps "wolves kill Ana" at
 * beat 30 and the Witch may revive her at beat 50. Applying the kill immediately
 * would mean un-killing her later, retconning the Seer's beat-25 result, and
 * making Back a nightmare. Instead nothing happens until the night ends, then
 * ONE ordered pass computes the whole outcome. Back is just intents.pop().
 */

import { ROLES } from './roles'
import type { Death, DeathReason, GameState, Intent, Seat } from './types'

/** Shaped to drop straight into a hold-to-reveal panel (DESIGN §5.4). */
export interface InfoResult {
  beatId: string
  /** The seat who learns it. */
  seatId: string
  targetSeatId?: string
  label: string
  detail?: string
}

export interface NightOutcome {
  info: InfoResult[]
  /** Hunters who died tonight and still owe the table a shot. */
  pendingHunterIds: string[]
}

interface Attack {
  targetId: string
  reason: DeathReason
  /** Alpha's Rampage. Beats the Doctor and the Bodyguard; a Blessing still stops it. */
  ignoresProtection: boolean
}

const find = (seats: Seat[], id: string | null | undefined) =>
  id ? seats.find((s) => s.id === id) : undefined

const intentsFor = (intents: Intent[], beatId: string) =>
  intents.filter((i) => i.beatId === beatId)

/** What the Seer sees. Lycan is village but reads guilty. That's the whole point of it. */
export const readsAsMafia = (seat: Seat): boolean =>
  ROLES[seat.roleId].faction === 'mafia' || seat.roleId === 'lycan'

/** Night 0: information happens, killing does not. */
const isNightZero = (state: GameState) => state.settings.nightZero && state.dayNumber === 1

/**
 * Compute who dies tonight, without touching state.
 *
 * `ignoreWitch` powers the Witch's own beat: she is shown tonight's dying
 * BEFORE spending a potion, which would otherwise be circular.
 */
function computeAttacks(state: GameState, ignoreWitch: boolean): Attack[] {
  const attacks: Attack[] = []
  if (isNightZero(state)) return attacks

  const seats = state.seats

  for (const i of intentsFor(state.intents, 'wolves_kill')) {
    if (i.targetSeatId) {
      attacks.push({
        targetId: i.targetSeatId,
        reason: 'mafia_kill',
        ignoresProtection: i.variant === 'rampage',
      })
    }
  }

  for (const i of intentsFor(state.intents, 'sk_kill')) {
    if (i.targetSeatId) {
      attacks.push({ targetId: i.targetSeatId, reason: 'serial_killer', ignoresProtection: false })
    }
  }

  for (const i of intentsFor(state.intents, 'vigilante_shoot')) {
    const vig = find(seats, i.sourceSeatId)
    if (i.targetSeatId && (vig?.charges.snipe ?? 0) > 0) {
      attacks.push({ targetId: i.targetSeatId, reason: 'vigilante', ignoresProtection: false })
    }
  }

  if (!ignoreWitch) {
    for (const i of intentsFor(state.intents, 'witch_act')) {
      const witch = find(seats, i.sourceSeatId)
      if (i.variant === 'death' && i.targetSeatId && (witch?.charges.death ?? 0) > 0) {
        attacks.push({ targetId: i.targetSeatId, reason: 'witch_poison', ignoresProtection: false })
      }
    }
  }

  return attacks
}

/** Protection sets for tonight. */
function computeProtection(state: GameState) {
  const protectedIds = new Set<string>()
  const blessedIds = new Set<string>()
  const guardedBy = new Map<string, string>()

  for (const i of intentsFor(state.intents, 'doctor_protect')) {
    if (i.targetSeatId) protectedIds.add(i.targetSeatId)
  }
  for (const i of intentsFor(state.intents, 'bodyguard_guard')) {
    if (i.targetSeatId && i.sourceSeatId) guardedBy.set(i.targetSeatId, i.sourceSeatId)
  }
  for (const i of intentsFor(state.intents, 'priest_bless')) {
    const priest = find(state.seats, i.sourceSeatId)
    if (i.targetSeatId && (priest?.charges.bless ?? 0) > 0) blessedIds.add(i.targetSeatId)
  }

  return { protectedIds, blessedIds, guardedBy }
}

/** Run attacks through protection. Shared by the real resolution and the preview. */
function landAttacks(state: GameState, attacks: Attack[]): Death[] {
  const { protectedIds, blessedIds, guardedBy } = computeProtection(state)
  const deaths: Death[] = []
  const spentGuards = new Set<string>()

  const kill = (seatId: string, reason: DeathReason) => {
    if (!deaths.some((d) => d.seatId === seatId)) deaths.push({ seatId, reason })
  }

  for (const attack of attacks) {
    const target = find(state.seats, attack.targetId)
    if (!target?.alive) continue

    // A Blessing stops everything, including a Rampage. One-shot.
    if (blessedIds.has(target.id)) continue

    // The Serial Killer shrugs off the wolves specifically.
    if (target.roleId === 'serialKiller' && attack.reason === 'mafia_kill') continue

    if (!attack.ignoresProtection) {
      if (protectedIds.has(target.id)) continue

      const guardId = guardedBy.get(target.id)
      if (guardId && !spentGuards.has(guardId) && find(state.seats, guardId)?.alive) {
        spentGuards.add(guardId)
        kill(guardId, 'bodyguard_sacrifice')
        continue
      }
    }

    kill(target.id, attack.reason)
  }

  return deaths
}

/**
 * Who is currently dying tonight. Shown to the Witch before she chooses.
 * Excludes her own potions so the answer doesn't depend on itself.
 */
export function pendingVictims(state: GameState): Seat[] {
  const deaths = landAttacks(state, computeAttacks(state, true))
  return deaths
    .map((d) => find(state.seats, d.seatId))
    .filter((s): s is Seat => Boolean(s))
}

/** The answer to a Seer / Gravedigger look, formatted for the reveal panel. */
export function investigate(
  state: GameState,
  beatId: string,
  targetSeatId: string,
): { label: string; detail?: string } | null {
  const target = find(state.seats, targetSeatId)
  if (!target) return null

  if (beatId === 'seer_investigate') {
    // Explicit words, never colour alone (DESIGN §8 colourblind rule).
    return {
      label: readsAsMafia(target) ? 'MAFIA' : 'NOT MAFIA',
      detail: target.name,
    }
  }

  if (beatId === 'gravedigger_exhume') {
    return { label: ROLES[target.roleId].id, detail: `${target.name} was this role.` }
  }

  return null
}

export interface ResolveResult {
  state: GameState
  deaths: Death[]
  outcome: NightOutcome
}

export function resolveNight(prev: GameState): ResolveResult {
  const state: GameState = {
    ...prev,
    seats: prev.seats.map((s) => ({ ...s, marks: [...s.marks], charges: { ...s.charges } })),
    intents: [...prev.intents],
    log: [...prev.log],
  }
  const seats = state.seats

  // ── Spend charges and record persistent side effects ─────────────────────
  for (const i of intentsFor(state.intents, 'doctor_protect')) {
    const doc = find(seats, i.sourceSeatId)
    if (doc && i.targetSeatId) {
      if (doc.id === i.targetSeatId) doc.charges.selfHeal = 0
      doc.lastProtectedId = i.targetSeatId
    }
  }
  for (const i of intentsFor(state.intents, 'priest_bless')) {
    const priest = find(seats, i.sourceSeatId)
    if (priest && (priest.charges.bless ?? 0) > 0) priest.charges.bless = 0
  }
  for (const i of intentsFor(state.intents, 'wolves_kill')) {
    if (i.variant === 'rampage') {
      const alpha = seats.find((s) => s.alive && s.roleId === 'alpha')
      if (alpha) alpha.charges.rampage = 0
    }
  }
  for (const i of intentsFor(state.intents, 'vigilante_shoot')) {
    const vig = find(seats, i.sourceSeatId)
    if (vig && (vig.charges.snipe ?? 0) > 0) vig.charges.snipe = (vig.charges.snipe ?? 1) - 1
  }

  let witchSaveId: string | null = null
  for (const i of intentsFor(state.intents, 'witch_act')) {
    const witch = find(seats, i.sourceSeatId)
    if (!witch || !i.targetSeatId) continue
    if (i.variant === 'death' && (witch.charges.death ?? 0) > 0) witch.charges.death = 0
    if (i.variant === 'life' && (witch.charges.life ?? 0) > 0) {
      witch.charges.life = 0
      witchSaveId = i.targetSeatId
    }
  }

  // Blackmail persists into tomorrow's day, and is not a death.
  for (const i of intentsFor(state.intents, 'blackmailer_silence')) {
    const target = find(seats, i.targetSeatId)
    if (target?.alive && !target.marks.includes('silenced')) target.marks.push('silenced')
  }

  // ── Deaths ────────────────────────────────────────────────────────────────
  const landed = landAttacks(state, computeAttacks(state, false))
  const surviving = landed.filter((d) => d.seatId !== witchSaveId)

  // Vigilante guilt: shooting the village costs you your own life, next night.
  for (const i of intentsFor(state.intents, 'vigilante_shoot')) {
    const victim = find(seats, i.targetSeatId)
    const vig = find(seats, i.sourceSeatId)
    const hit = surviving.some((d) => d.seatId === i.targetSeatId && d.reason === 'vigilante')
    if (vig && victim && hit && ROLES[victim.roleId].faction === 'village') vig.charges.guilt = 1
  }
  for (const seat of seats) {
    if (seat.alive && seat.charges.guilt === 1 && !surviving.some((d) => d.seatId === seat.id)) {
      seat.charges.guilt = 0
      surviving.push({ seatId: seat.id, reason: 'vigilante_guilt' })
    }
  }

  const { deaths, pendingHunterIds } = applyDeaths(state, surviving)

  // ── Information ───────────────────────────────────────────────────────────
  const info: InfoResult[] = []

  for (const i of intentsFor(state.intents, 'seer_investigate')) {
    const target = find(seats, i.targetSeatId)
    if (i.sourceSeatId && target) {
      info.push({
        beatId: 'seer_investigate',
        seatId: i.sourceSeatId,
        targetSeatId: target.id,
        label: readsAsMafia(target) ? 'MAFIA' : 'NOT MAFIA',
        detail: target.name,
      })
    }
  }

  for (const i of intentsFor(state.intents, 'gravedigger_exhume')) {
    const target = find(seats, i.targetSeatId)
    if (i.sourceSeatId && target) {
      info.push({
        beatId: 'gravedigger_exhume',
        seatId: i.sourceSeatId,
        targetSeatId: target.id,
        label: target.roleId,
        detail: `${target.name} was this role.`,
      })
    }
  }

  for (const seat of seats.filter((s) => s.roleId === 'sleepwalker' && s.alive)) {
    info.push({
      beatId: 'sleepwalker_stir',
      seatId: seat.id,
      label: deaths.length > 0 ? 'Someone died' : 'Nobody died',
      detail: 'You do not learn who.',
    })
  }

  state.intents = []
  state.log.push({
    day: state.dayNumber,
    phase: 'night',
    text:
      deaths.length === 0
        ? `Night ${state.dayNumber}: nobody died.`
        : `Night ${state.dayNumber}: ${deaths
            .map((d) => `${find(seats, d.seatId)?.name} (${d.reason})`)
            .join(', ')}.`,
  })

  return { state, deaths, outcome: { info, pendingHunterIds } }
}

/**
 * Kill everyone listed, then keep going while those deaths cause more: Lovers
 * die of grief. A dying Hunter is NOT resolved here. The host must aim that
 * shot, so it comes back as a pending id.
 */
export function applyDeaths(
  state: GameState,
  deaths: Death[],
): { deaths: Death[]; pendingHunterIds: string[] } {
  const all: Death[] = []
  const hunters: string[] = []
  let queue = [...deaths]

  while (queue.length > 0) {
    const next: Death[] = []

    for (const death of queue) {
      const seat = find(state.seats, death.seatId)
      if (!seat?.alive) continue

      seat.alive = false
      all.push(death)

      if (seat.loverId) {
        const lover = find(state.seats, seat.loverId)
        if (lover?.alive) next.push({ seatId: lover.id, reason: 'lover_grief' })
      }

      if (seat.roleId === 'hunter') hunters.push(seat.id)
    }

    queue = next
  }

  return { deaths: all, pendingHunterIds: hunters }
}
