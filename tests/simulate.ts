/**
 * A headless game driver.
 *
 * D7 makes the engine a pure function of { seed, intents }, and D8 says balance
 * is measured rather than asserted. That is only checkable if a whole game can
 * be played with no UI, which is exactly what this does: it plays every beat of
 * every night, votes, executes, and reports who won.
 *
 * The policies below are deliberately simple. They are not good players; they
 * are *average* players, which is what a balance number should be measured
 * against. Anything cleverer would measure the bot, not the setup.
 */
import {
  beatsForNight, legalTargets, recordIntent, recordCupidPick, endNight,
  hunterRevenge, toDay, toVote, tallyVote, execute, skipExecution, toNight,
  livingSeats,
} from '@/engine/machine'
import { deal } from '@/engine/deal'
import { totalPlayers } from '@/engine/balance'
import { checkWin } from '@/engine/winCheck'
import { ROLES } from '@/engine/roles'
import { makeRng } from '@/engine/rng'
import type { GameState, GameSettings, Seat, Intent } from '@/engine/types'
import type { Composition } from '@/engine/balance'

export interface SimResult {
  winner: string
  days: number
  seed: string
  /** Set when the game hit the day cap without resolving. */
  stalled?: boolean
}

const DEFAULT_SETTINGS: GameSettings = {
  nightZero: false,
  revealRoleOnDeath: true,
  generatedAudio: false,
  dayTimerSeconds: null,
}

const pick = <T>(xs: T[], rng: () => number): T | undefined =>
  xs.length ? xs[Math.floor(rng() * xs.length)] : undefined

export function simulate(
  composition: Composition,
  seed: string,
  settings: Partial<GameSettings> = {},
  maxDays = 30,
): SimResult {
  const rng = makeRng(`sim:${seed}`)
  const n = totalPlayers(composition)

  /** Seats the Seer has read as guilty. Shared with the table, as tables do. */
  const guiltyReads = new Set<string>()

  let state: GameState = deal({
    names: Array.from({ length: n }, (_, i) => `P${i + 1}`),
    composition,
    themeId: 'remusVale',
    settings: { ...DEFAULT_SETTINGS, ...settings },
    seed,
  })

  for (let day = 0; day < maxDays; day++) {
    if (state.winner) break

    // ---- NIGHT --------------------------------------------------------
    for (const beat of beatsForNight(state)) {
      const actor = beat.actors[0]
      if (!actor) continue

      if (beat.id === 'cupid_link') {
        const options = legalTargets(state, beat).filter((o) => !o.disabled)
        const shuffled = [...options].sort(() => rng() - 0.5).slice(0, 2)
        for (const o of shuffled) state = recordCupidPick(state, o.seat.id)
        continue
      }

      const mode = beat.id === 'witch_act' ? (rng() < 0.5 ? 'life' : 'death') : undefined
      const options = legalTargets(state, beat, mode as 'life' | 'death' | undefined)
        .filter((o) => !o.disabled)
      if (options.length === 0) continue

      // Informational beats record no target; some optional beats pass.
      const optional = beat.id === 'vigilante_shoot' || beat.id === 'witch_act'
      if (optional && rng() < 0.55) continue

      const target = pick(options, rng)
      const intent: Intent = {
        beatId: beat.id,
        sourceSeatId: actor.id,
        targetSeatId: target?.seat.id ?? null,
        ...(mode ? { variant: mode } : {}),
      }
      state = recordIntent(state, intent)
    }

    const ended = endNight(state)
    state = ended.state

    // Harvest what the Seer learned. investigate() returns the literal label
    // 'MAFIA' or 'NOT MAFIA' (DESIGN §8: words, never colour alone), so this
    // reads it exactly rather than guessing at the phrasing.
    for (const info of ended.outcome.info) {
      if (info.beatId !== 'seer_investigate' || !info.targetSeatId) continue
      if (info.label === 'MAFIA') guiltyReads.add(info.targetSeatId)
    }

    for (const hid of ended.outcome.pendingHunterIds) {
      const alive = livingSeats(state).filter((s) => s.id !== hid)
      state = hunterRevenge(state, hid, pick(alive, rng)?.id ?? null).state
    }
    if (state.winner || checkWin(state)) break

    // ---- DAY + VOTE ---------------------------------------------------
    state = toVote(toDay(state))
    const alive = livingSeats(state)
    if (alive.length === 0) break

    // The village CONVERGES on one nominee rather than each member voting at
    // random. This matters enormously and is the difference between modelling
    // a table and modelling noise: if the village splits while the mafia bloc
    // votes, the mafia win nearly every setup regardless of composition, which
    // measures the bot instead of the balance.
    //
    // If the Seer has produced a guilty read on someone still alive, the
    // village uses it. That is the single piece of information real tables
    // reliably act on.
    const votes: Record<string, number> = {}
    const nonMafia = alive.filter((s) => ROLES[s.roleId].faction !== 'mafia')
    const mafiaTarget = pick(nonMafia, rng)

    const knownGuiltyAlive = alive.filter((s) => guiltyReads.has(s.id))
    const villageNominee =
      pick(knownGuiltyAlive, rng) ?? pick(alive, rng)

    for (const voter of alive) {
      if (voter.marks.includes('silenced')) continue
      const isMafia = ROLES[voter.roleId].faction === 'mafia'
      const choice: Seat | undefined =
        isMafia && mafiaTarget && mafiaTarget.id !== voter.id
          ? mafiaTarget
          : villageNominee && villageNominee.id !== voter.id
            ? villageNominee
            : pick(alive.filter((s) => s.id !== voter.id), rng)
      if (choice) votes[choice.id] = (votes[choice.id] ?? 0) + 1
    }

    const tally = tallyVote(state, votes)
    if (tally.executedId) {
      const res = execute(state, tally.executedId)
      state = res.state
      // A Hunter executed by the town still owes a shot, exactly as one killed
      // at night does. Skipping this understates village firepower and would
      // quietly bias every balance number produced here.
      for (const hid of res.pendingHunterIds) {
        const targets = livingSeats(state).filter((s) => s.id !== hid)
        state = hunterRevenge(state, hid, pick(targets, rng)?.id ?? null).state
      }
    } else {
      state = skipExecution(state)
    }

    if (state.winner || checkWin(state)) break

    state = toNight(state)
  }

  const winner = state.winner ?? checkWin(state)
  return {
    winner: winner ? (winner.roleId ?? winner.faction) : 'none',
    days: state.dayNumber,
    seed,
    stalled: !winner,
  }
}

export function runMany(composition: Composition, games: number, prefix = 'g') {
  const tally: Record<string, number> = {}
  let stalled = 0
  for (let i = 0; i < games; i++) {
    const r = simulate(composition, `${prefix}-${i}`)
    tally[r.winner] = (tally[r.winner] ?? 0) + 1
    if (r.stalled) stalled++
  }
  const village = tally.village ?? 0
  const decided = games - (tally.none ?? 0)
  return {
    tally,
    stalled,
    games,
    villageWinRate: decided ? village / decided : 0,
  }
}
