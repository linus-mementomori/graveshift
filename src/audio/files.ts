/**
 * Audio file manifest.
 *
 * Drop an MP3 into `public/audio/` with the matching filename and it is used
 * automatically. Leave one out and that cue falls back to the generated synth
 * patch — so a half-filled folder is a perfectly valid state, and the app never
 * goes silent waiting for you to finish.
 *
 * Keep clips SHORT (2–4 s) and compressed (mono, 96 kbps). ARCHITECTURE §9 caps
 * total installed size at 2 MB; ~20–40 kB per clip keeps the whole set well
 * inside that.
 *
 * Record where every file came from in public/audio/CREDITS.md.
 */

import type { CueId } from '@/engine/types'

/** CueId → filename in /public/audio/. */
export const CUE_FILES: Partial<Record<CueId, string>> = {
  NIGHT_FALL: 'night-fall.mp3',
  WOLVES_WAKE: 'wolves-wake.mp3',
  SEER_WAKE: 'seer-wake.mp3',
  DOCTOR_WAKE: 'doctor-wake.mp3',
  WITCH_WAKE: 'witch-wake.mp3',
  NIGHT_END: 'night-end.mp3',
  DAWN: 'dawn.mp3',
  DEATH_REVEAL: 'death-reveal.mp3',
  NO_DEATH: 'no-death.mp3',
  DAY: 'day.mp3',
  VOTE: 'vote.mp3',
  EXECUTION: 'execution.mp3',
  LAST_WORDS: 'last-words.mp3',
  VICTORY_VILLAGE: 'victory-village.mp3',
  VICTORY_MAFIA: 'victory-mafia.mp3',
  VICTORY_NEUTRAL: 'victory-neutral.mp3',
}

export interface ExtraSound {
  id: string
  /** Shown on the soundboard button. */
  label: string
  file: string
  /** One line on when to use it — the host is scanning this in the dark. */
  hint: string
}

/**
 * The host soundboard: sounds with no fixed place in the night order, fired
 * whenever the room needs it. This is where a sarcastic sting belongs — it is
 * a performance choice, not a game beat.
 */
export const EXTRA_SOUNDS: ExtraSound[] = [
  {
    id: 'good-luck-sleeping',
    label: 'Good luck sleeping',
    file: 'good-luck-sleeping.mp3',
    hint: 'Sarcastic sign-off. Land it right as they close their eyes.',
  },
  {
    id: 'scream',
    label: 'Scream',
    file: 'scream.mp3',
    hint: 'A death that deserves more than an announcement.',
  },
  {
    id: 'suspense',
    label: 'Suspense',
    file: 'suspense.mp3',
    hint: 'Hold under a vote that is about to go badly.',
  },
  {
    id: 'laugh',
    label: 'Laugh',
    file: 'laugh.mp3',
    hint: 'For when the village executes a villager. Again.',
  },
  {
    id: 'heartbeat-long',
    label: 'Heartbeat',
    file: 'heartbeat-long.mp3',
    hint: 'Run it under the final accusation.',
  },
  {
    id: 'door-creak',
    label: 'Door creak',
    file: 'door-creak.mp3',
    hint: 'Nothing is at the door. Let them wonder.',
  },
]

export const audioUrl = (file: string) => `/audio/${file}`
