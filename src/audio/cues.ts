/**
 * The cue system (GAME_DESIGN.md §7).
 *
 * DECISION D2: the app never ships or plays licensed music. It tells the HOST
 * what to play or perform. The host is the instrument. An optional Web Audio
 * synth layer exists as a fallback for hosts who don't want to DJ.
 */

import type { CueId } from '@/engine/types'

export type CueKind = 'music' | 'sfx' | 'voice' | 'light' | 'action'
export type CueUrgency = 'ambient' | 'accent' | 'hit'

export interface Cue {
  id: CueId
  kind: CueKind
  urgency: CueUrgency
  /** Default instruction. Themes may override (theme.cueOverrides). */
  text: string
  /** Name of the generated Web Audio patch, if one exists. */
  synth?: 'drone' | 'chime' | 'heartbeat' | 'hit' | 'tick' | 'howl'
}

export const CUES: Record<CueId, Cue> = {
  NIGHT_FALL: {
    id: 'NIGHT_FALL',
    kind: 'music',
    urgency: 'ambient',
    text: 'Start a slow, low ambient track. Dim the lights.',
    synth: 'drone',
  },
  WOLVES_WAKE: {
    id: 'WOLVES_WAKE',
    kind: 'sfx',
    urgency: 'accent',
    text: 'A low growl, or scrape your nails on the table.',
    synth: 'howl',
  },
  SEER_WAKE: {
    id: 'SEER_WAKE',
    kind: 'sfx',
    urgency: 'accent',
    text: 'A single soft chime. A glass tap works.',
    synth: 'chime',
  },
  DOCTOR_WAKE: {
    id: 'DOCTOR_WAKE',
    kind: 'sfx',
    urgency: 'accent',
    text: 'Two quiet taps, like a heartbeat.',
    synth: 'heartbeat',
  },
  WITCH_WAKE: {
    id: 'WITCH_WAKE',
    kind: 'sfx',
    urgency: 'accent',
    text: 'A bubbling hiss, or blow across a bottle.',
    synth: 'chime',
  },
  NIGHT_END: {
    id: 'NIGHT_END',
    kind: 'music',
    urgency: 'ambient',
    text: 'Fade out. Let silence sit for two seconds.',
    synth: 'drone',
  },
  DAWN: {
    id: 'DAWN',
    kind: 'music',
    urgency: 'hit',
    text: 'Nothing. Silence is the cue. Then speak.',
    synth: 'chime',
  },
  DEATH_REVEAL: {
    id: 'DEATH_REVEAL',
    kind: 'voice',
    urgency: 'hit',
    text: 'Drop your voice. Say the name slowly. Pause.',
    synth: 'hit',
  },
  NO_DEATH: {
    id: 'NO_DEATH',
    kind: 'voice',
    urgency: 'accent',
    text: 'Sound confused. Sell it.',
    synth: 'tick',
  },
  DAY: {
    id: 'DAY',
    kind: 'music',
    urgency: 'ambient',
    text: 'Bright, busy, low volume. A floor under the arguing.',
    synth: 'chime',
  },
  VOTE: {
    id: 'VOTE',
    kind: 'music',
    urgency: 'hit',
    text: 'Cut everything. Dead air makes people nervous.',
    synth: 'tick',
  },
  EXECUTION: {
    id: 'EXECUTION',
    kind: 'sfx',
    urgency: 'hit',
    text: 'One heavy hit: stomp, clap, or a drum. Then nothing.',
    synth: 'hit',
  },
  LAST_WORDS: {
    id: 'LAST_WORDS',
    kind: 'light',
    urgency: 'accent',
    text: 'Put a light on them if you can. Everyone else goes quiet.',
    synth: 'heartbeat',
  },
  VICTORY_VILLAGE: {
    id: 'VICTORY_VILLAGE',
    kind: 'music',
    urgency: 'hit',
    text: 'Something warm and triumphant. Loud.',
    synth: 'chime',
  },
  VICTORY_MAFIA: {
    id: 'VICTORY_MAFIA',
    kind: 'music',
    urgency: 'hit',
    text: 'Something cold and smug. Let it play under the reveal.',
    synth: 'howl',
  },
  VICTORY_NEUTRAL: {
    id: 'VICTORY_NEUTRAL',
    kind: 'music',
    urgency: 'hit',
    text: 'Something wrong. Off-kilter. Uncomfortable.',
    synth: 'hit',
  },
}

/** Host performance coaching. Surfaced one at a time, never repeated in a session. */
export const HOST_TIPS: string[] = [
  'Pause after a name. Silence does the work.',
  "Don't rush the night. Slow is scary.",
  'If nobody died, look worried.',
  'Never laugh during the reveal. Even when it is funny.',
  'Say the dead player’s role like it costs you something.',
  'Read the line, then look up. Do not read and talk at once.',
  'When a player protests, let them finish. It is better theatre.',
]
