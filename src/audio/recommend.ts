'use client'

import { beatsForNight } from '@/engine/machine'
import type { CueId, GameState } from '@/engine/types'

/**
 * Which cue the host most likely wants *right now*.
 *
 * The soundboard lists everything, but a host mid-night should not have to scan
 * sixteen buttons to find the one for the beat they're on. This picks it out so
 * the common case is one tap.
 *
 * Returns null when nothing is obviously right, which is better than guessing —
 * a wrong "recommended" is worse than none.
 */
export function recommendedCue(game: GameState | null): CueId | null {
  if (!game) return null

  switch (game.phase) {
    case 'night': {
      const beats = beatsForNight(game)
      const beat = beats[game.beatIndex]
      if (beat?.cueId) return beat.cueId
      // Ran past the last beat — the night is closing.
      if (game.beatIndex >= beats.length) return 'NIGHT_END'
      // A beat with no cue of its own still sits inside the night.
      return 'NIGHT_FALL'
    }

    case 'dawn':
      // Dawn is the reveal, so the death sting beats the generic dawn tone
      // whenever there is actually a body to announce.
      return game.seats.some((s) => !s.alive) ? 'DEATH_REVEAL' : 'NO_DEATH'

    case 'day':
      return 'DAY'

    case 'vote':
      return 'VOTE'

    case 'dusk':
      return 'EXECUTION'

    case 'end':
      if (game.winner?.faction === 'mafia') return 'VICTORY_MAFIA'
      if (game.winner?.faction === 'neutral') return 'VICTORY_NEUTRAL'
      return 'VICTORY_VILLAGE'

    default:
      return null
  }
}
