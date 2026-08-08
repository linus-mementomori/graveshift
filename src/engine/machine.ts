/**
 * The phase machine — the ONLY place `phase` changes.
 *
 * Every function is (state, input) => newState (or a small result object).
 * Nothing here touches the DOM, the clock, or randomness beyond the seed
 * already sitting in state.
 */

import { NIGHT_ORDER, type BeatDef } from './nightOrder'
import { ROLES } from './roles'
import { resolveNight, applyDeaths, type NightOutcome } from './resolve'
import { checkWin } from './winCheck'
import type { Beat, BeatId, Death, GameState, Intent, Seat, WinResult } from './types'

/**
 * Beats where the host shows something rather than choosing something. These
 * advance without a target — the picker is hidden entirely.
 */
export const INFORMATIONAL: Set<string> = new Set([
  'wolves_recognise',
  'minion_sees',
  'lovers_wake',
  'executioner_target',
  'sleepwalker_stir',
])

const clone = (state: GameState): GameState => ({
  ...state,
  seats: state.seats.map((s) => ({ ...s, marks: [...s.marks], charges: { ...s.charges } })),
  intents: [...state.intents],
  log: [...state.log],
})

const find = (state: GameState, id: string | null | undefined) =>
  id ? state.seats.find((s) => s.id === id) : undefined

export const livingSeats = (state: GameState): Seat[] => state.seats.filter((s) => s.alive)

/** The very first night — where the once-only beats (Cupid, Minion…) live. */
export const isFirstNight = (state: GameState): boolean => state.dayNumber === 1

/** Night 0 is the opening night with no kills. Information only. */
const isNightZero = (state: GameState) => state.settings.nightZero && state.dayNumber === 1

const KILL_BEATS = new Set<string>(['wolves_kill', 'sk_kill', 'vigilante_shoot', 'witch_act'])

/** Seats that could act on a beat: alive, and holding a role bound to it. */
function actorsFor(state: GameState, beat: BeatDef): Seat[] {
  return state.seats.filter((s) => {
    if (!s.alive) return false
    if (beat.id === 'wolves_kill') {
      return ROLES[s.roleId].faction === 'mafia' && ROLES[s.roleId].ability === 'kill'
    }
    if (beat.id === 'wolves_recognise') return ROLES[s.roleId].faction === 'mafia'
    if (beat.id === 'lovers_wake') return Boolean(s.loverId)
    return ROLES[s.roleId].beatId === beat.id
  })
}

/** The beats to walk tonight, in order, with dead-role beats already dropped. */
export function beatsForNight(state: GameState): Beat[] {
  const first = isFirstNight(state)
  const zero = isNightZero(state)

  return NIGHT_ORDER.filter((b) => {
    if (b.firstNightOnly && !first) return false
    if (zero && KILL_BEATS.has(b.id)) return false
    return actorsFor(state, b).length > 0
  }).map((b) => ({
    id: b.id,
    roleId: b.roleId,
    cueId: b.cueId,
    actors: actorsFor(state, b),
  }))
}

export interface TargetOption {
  seat: Seat
  disabled?: boolean
  /** Never a dead button with no explanation (DESIGN §5.8). */
  reason?: string
}

/** Who this beat may legally point at, and why anyone greyed out is greyed out. */
export function legalTargets(
  state: GameState,
  beat: Beat,
  witchMode?: 'life' | 'death',
): TargetOption[] {
  const actorIds = new Set(beat.actors.map((a) => a.id))

  // The Gravedigger is the only beat that targets the dead.
  if (beat.id === 'gravedigger_exhume') {
    return state.seats.filter((s) => !s.alive).map((seat) => ({ seat }))
  }

  const block = (seat: Seat, reason: string): TargetOption => ({ seat, disabled: true, reason })

  return livingSeats(state).map((seat) => {
    if (beat.id === 'wolves_kill' && ROLES[seat.roleId].faction === 'mafia') {
      return block(seat, 'Wolves do not eat their own.')
    }
    if (beat.id === 'seer_investigate' && actorIds.has(seat.id)) {
      return block(seat, 'You already know what you are.')
    }
    if (beat.id === 'sk_kill' && actorIds.has(seat.id)) {
      return block(seat, 'Not yourself.')
    }
    if (beat.id === 'cupid_link' && actorIds.has(seat.id)) {
      return block(seat, 'Cupid cannot link themselves.')
    }
    if (beat.id === 'doctor_protect') {
      const doc = beat.actors[0]
      if (doc?.lastProtectedId === seat.id) {
        return block(seat, 'Protected last night — never twice in a row.')
      }
      if (actorIds.has(seat.id) && (doc?.charges.selfHeal ?? 0) <= 0) {
        return block(seat, 'Self-heal already used.')
      }
    }
    if (beat.id === 'witch_act' && witchMode === 'death' && actorIds.has(seat.id)) {
      return block(seat, 'The Witch does not poison herself.')
    }
    return { seat }
  })
}

/** Record a tap. Nothing resolves — see resolve.ts for why. */
export function recordIntent(state: GameState, intent: Intent): GameState {
  const next = clone(state)
  // One intent per (beat, source): re-tapping replaces rather than stacks.
  next.intents = next.intents.filter(
    (i) => !(i.beatId === intent.beatId && i.sourceSeatId === intent.sourceSeatId),
  )
  next.intents.push(intent)

  if (intent.beatId === 'executioner_target' && intent.targetSeatId && intent.sourceSeatId) {
    const exec = find(next, intent.sourceSeatId)
    if (exec) exec.execTargetId = intent.targetSeatId
  }

  return next
}

/**
 * Cupid picks TWO, and toggling matters — so this is its own entry point rather
 * than a variant of recordIntent. Linking is structural, not an attack: the
 * Lovers must exist for every later beat and for grief cascades, so it applies
 * to the seats immediately.
 */
export function recordCupidPick(state: GameState, seatId: string): GameState {
  const next = clone(state)
  const picks = next.intents.filter((i) => i.beatId === 'cupid_link')
  const already = picks.find((i) => i.targetSeatId === seatId)

  if (already) {
    next.intents = next.intents.filter((i) => i !== already)
  } else if (picks.length < 2) {
    const cupid = next.seats.find((s) => s.alive && s.roleId === 'cupid')
    next.intents.push({
      beatId: 'cupid_link',
      sourceSeatId: cupid?.id ?? null,
      targetSeatId: seatId,
    })
  }

  // Re-derive the link from scratch so unpicking cleanly undoes it.
  for (const seat of next.seats) seat.loverId = undefined
  const pair = next.intents.filter((i) => i.beatId === 'cupid_link')
  if (pair.length === 2) {
    const a = find(next, pair[0].targetSeatId)
    const b = find(next, pair[1].targetSeatId)
    if (a && b && a.id !== b.id) {
      a.loverId = b.id
      b.loverId = a.id
    }
  }

  return next
}

export function clearIntentsFor(state: GameState, beatId: string): GameState {
  const next = clone(state)
  next.intents = next.intents.filter((i) => i.beatId !== beatId)
  if (beatId === 'cupid_link') for (const seat of next.seats) seat.loverId = undefined
  return next
}

export function nextBeat(state: GameState): GameState {
  const next = clone(state)
  next.beatIndex = Math.min(next.beatIndex + 1, beatsForNight(state).length)
  return next
}

export function prevBeat(state: GameState): GameState {
  const next = clone(state)
  next.beatIndex = Math.max(0, next.beatIndex - 1)
  return next
}

export interface EndNightResult {
  state: GameState
  deaths: Death[]
  outcome: NightOutcome
}

/** End the night: resolve everything at once, then reveal at dawn. */
export function endNight(state: GameState): EndNightResult {
  const { state: resolved, deaths, outcome } = resolveNight(state)
  const next = clone(resolved)
  next.phase = 'dawn'
  next.beatIndex = 0

  // A Hunter still owing a shot can change who wins, so hold the win check.
  return {
    state: outcome.pendingHunterIds.length > 0 ? next : withWinCheck(next),
    deaths,
    outcome,
  }
}

export interface RevengeResult {
  state: GameState
  deaths: Death[]
  pendingHunterIds: string[]
}

/** The Hunter's owed shot. A Hunter can kill a Hunter, hence the returned list. */
export function hunterRevenge(
  state: GameState,
  hunterId: string,
  targetSeatId: string | null,
): RevengeResult {
  const next = clone(state)
  const hunter = find(next, hunterId)

  if (!targetSeatId) {
    next.log.push({
      day: next.dayNumber,
      phase: next.phase,
      text: `${hunter?.name ?? 'The Hunter'} fired into the dark.`,
    })
    return { state: withWinCheck(next), deaths: [], pendingHunterIds: [] }
  }

  const { deaths, pendingHunterIds } = applyDeaths(next, [
    { seatId: targetSeatId, reason: 'hunter_revenge' },
  ])
  next.log.push({
    day: next.dayNumber,
    phase: next.phase,
    text: `${hunter?.name ?? 'The Hunter'} took ${find(next, targetSeatId)?.name} with them.`,
    decisive: true,
  })

  return {
    state: pendingHunterIds.length > 0 ? next : withWinCheck(next),
    deaths,
    pendingHunterIds,
  }
}

export function toDay(state: GameState): GameState {
  const next = clone(state)
  next.phase = 'day'
  return next
}

export function toVote(state: GameState): GameState {
  const next = clone(state)
  next.phase = 'vote'
  return next
}

export function revealMayor(state: GameState, seatId: string): GameState {
  const next = clone(state)
  next.mayorRevealedId = seatId
  next.log.push({
    day: next.dayNumber,
    phase: 'day',
    text: `${find(next, seatId)?.name} revealed as the Mayor.`,
  })
  return next
}

/** Total votes available — a revealed Mayor is worth two. */
export function voterWeight(state: GameState): number {
  const alive = livingSeats(state)
  const mayorAlive = alive.some((s) => s.id === state.mayorRevealedId)
  // Silenced players lose their vote for the day.
  const voting = alive.filter((s) => !s.marks.includes('silenced')).length
  return voting + (mayorAlive ? 1 : 0)
}

/**
 * Votes needed to execute — HOUSE RULE.
 *
 * This is a PLURALITY rule, not a majority one: whoever has the most votes is
 * executed, provided they have more than one. A single accusing voice is never
 * enough to hang someone, but the town does not have to agree as a body.
 *
 * Kept as a named constant because it is the single most balance-sensitive
 * number in the game — see the note in `tallyVote`.
 */
export const MIN_VOTES_TO_EXECUTE = 2

/** Retained for the balance checks, which still reason in terms of a majority. */
export const majorityOf = (weight: number): number => Math.floor(weight / 2) + 1

export function tallyVote(
  _state: GameState,
  votes: Record<string, number>,
): { executedId?: string; tie: boolean } {
  const entries = Object.entries(votes).filter(([, n]) => n > 0)
  if (entries.length === 0) return { tie: false }

  const sorted = [...entries].sort((a, b) => b[1] - a[1])
  const [topId, topCount] = sorted[0]
  const tie = sorted.length > 1 && sorted[1][1] === topCount

  // A tie saves EVERYONE involved — nobody is executed, both walk away.
  // Deliberate: it makes a split town a real defensive outcome rather than a
  // coin-flip, and gives a cornered player something to actually play for.
  if (tie) return { tie: true }

  if (topCount < MIN_VOTES_TO_EXECUTE) return { tie: false }

  return { executedId: topId, tie: false }
}

export interface ExecuteResult {
  state: GameState
  /** True when the Prince revealed and walked away from the rope. */
  survived: boolean
  pendingHunterIds: string[]
}

/**
 * Execute a seat. This is where the two event-driven neutral wins live: the
 * Jester only wins by *vote*, and the Executioner only wins if the town does
 * their work for them.
 */
export function execute(state: GameState, seatId: string): ExecuteResult {
  const next = clone(state)
  const target = find(next, seatId)
  if (!target?.alive) return { state: next, survived: false, pendingHunterIds: [] }

  // The Prince reveals and survives; the vote is spent.
  if (target.roleId === 'prince' && (target.charges.protect ?? 0) > 0) {
    target.charges.protect = 0
    target.marks.push('revealed')
    next.phase = 'dusk'
    next.log.push({
      day: next.dayNumber,
      phase: 'vote',
      text: `${target.name} revealed as the Prince and survived the vote.`,
    })
    return { state: next, survived: true, pendingHunterIds: [] }
  }

  const { pendingHunterIds } = applyDeaths(next, [{ seatId, reason: 'execution' }])
  next.log.push({
    day: next.dayNumber,
    phase: 'vote',
    text: `${target.name} was executed.`,
    decisive: true,
  })
  next.phase = 'dusk'

  if (target.roleId === 'jester') {
    next.winner = {
      faction: 'neutral',
      roleId: 'jester',
      kingmaker: true,
      message: `${target.name} was the Jester — and you did exactly what they wanted.`,
    }
    next.phase = 'end'
    return { state: next, survived: false, pendingHunterIds: [] }
  }

  const exec = next.seats.find(
    (s) => s.alive && s.roleId === 'executioner' && s.execTargetId === seatId,
  )
  if (exec) {
    next.winner = {
      faction: 'neutral',
      roleId: 'executioner',
      kingmaker: true,
      message: `${exec.name} is the Executioner. ${target.name} was their mark.`,
    }
    next.phase = 'end'
    return { state: next, survived: false, pendingHunterIds: [] }
  }

  return {
    state: pendingHunterIds.length > 0 ? next : withWinCheck(next),
    survived: false,
    pendingHunterIds,
  }
}

/** The town declined to hang anyone. */
export function skipExecution(state: GameState): GameState {
  const next = clone(state)
  next.phase = 'dusk'
  next.log.push({ day: next.dayNumber, phase: 'vote', text: 'No execution today.' })
  return next
}

export function toNight(state: GameState): GameState {
  const next = clone(state)
  next.phase = 'night'
  next.dayNumber += 1
  next.beatIndex = 0
  next.intents = []
  // Silences last exactly one day.
  for (const seat of next.seats) seat.marks = seat.marks.filter((m) => m !== 'silenced')
  return next
}

/** Host accepted a forced outcome rather than playing it out (GAME_DESIGN §10.6). */
export function callIt(state: GameState, winner: WinResult): GameState {
  const next = clone(state)
  next.winner = winner
  next.phase = 'end'
  next.log.push({ day: next.dayNumber, phase: 'end', text: winner.message, decisive: true })
  return next
}

/** Stamp a winner onto the state if there is one. */
export function withWinCheck(state: GameState): GameState {
  if (state.winner) return state
  const win = checkWin(state)
  if (!win) return state

  const next = clone(state)
  next.winner = win
  next.phase = 'end'
  next.log.push({ day: next.dayNumber, phase: 'end', text: win.message, decisive: true })
  return next
}

export type { BeatId }
