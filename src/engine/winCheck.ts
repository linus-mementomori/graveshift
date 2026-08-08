/**
 * Win conditions — GAME_DESIGN §2.
 *
 * Evaluated after every death. Neutral roles that win on a *specific event*
 * (Jester executed, Executioner's mark executed) are decided at the moment of
 * execution in machine.ts — this file answers the standing question "given who
 * is alive, is it over?".
 */

import { ROLES } from './roles'
import type { GameState, Seat, WinResult } from './types'

const isMafia = (s: Seat) => ROLES[s.roleId].faction === 'mafia'
const isSerialKiller = (s: Seat) => s.roleId === 'serialKiller'

export function checkWin(state: GameState): WinResult | null {
  const alive = state.seats.filter((s) => s.alive)
  if (alive.length === 0) {
    return { faction: 'village', kingmaker: false, message: 'Everyone is dead. Nobody wins.' }
  }

  const mafia = alive.filter(isMafia)
  const sk = alive.filter(isSerialKiller)
  const others = alive.filter((s) => !isMafia(s) && !isSerialKiller(s))

  // Serial Killer wins alone — only once literally nobody else is left.
  if (sk.length > 0 && mafia.length === 0 && others.length === 0) {
    return {
      faction: 'neutral',
      roleId: 'serialKiller',
      kingmaker: false,
      message: 'The Serial Killer is the last one breathing.',
    }
  }

  if (mafia.length === 0 && sk.length === 0) {
    return {
      faction: 'village',
      kingmaker: false,
      message: 'Every threat is dead. The village survives.',
    }
  }

  // The wolves equal or outnumber everyone who could vote against them.
  // A living Serial Killer is still a rival, so they count as opposition.
  if (mafia.length > 0 && mafia.length >= others.length + sk.length) {
    return {
      faction: 'mafia',
      kingmaker: false,
      message: 'The wolves equal the living. The village falls.',
    }
  }

  return null
}

/**
 * "This is decided — call it?" (GAME_DESIGN §10.6)
 *
 * A game can be arithmetically over while still requiring several joyless
 * rounds to finish. This spots the common case: even executing a wolf every
 * single day, the town can no longer get ahead.
 */
export function forcedOutcome(state: GameState): WinResult | null {
  if (checkWin(state)) return null

  const alive = state.seats.filter((s) => s.alive)
  const mafia = alive.filter(isMafia).length
  const rest = alive.length - mafia

  if (mafia > 0 && rest - 1 <= mafia) {
    return {
      faction: 'mafia',
      kingmaker: false,
      message: 'The wolves cannot be out-voted from here.',
    }
  }

  return null
}

/**
 * Did someone who could not themselves win decide the finish?
 *
 * The classic case is a last living neutral (or a Hunter's dying bullet)
 * choosing which side takes it. Worth labelling in the end log, because
 * "who actually decided this" is the most argued question after a game.
 */
export function isKingmakerFinish(state: GameState, winner: WinResult): boolean {
  if (winner.kingmaker) return true

  // A neutral event-win (Jester, Executioner) is by definition someone outside
  // the two factions deciding the outcome.
  if (winner.faction === 'neutral' && winner.roleId !== 'serialKiller') return true

  // A Hunter's revenge shot as the final death.
  const last = [...state.log].reverse().find((e) => e.decisive)
  if (last?.text.includes('took') && last.text.includes('with them')) return true

  return false
}
