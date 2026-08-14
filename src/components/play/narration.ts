import type { Theme } from '@/themes'
import type { BeatId, DeathReason, GameState } from '@/engine/types'
import { makeRng, shuffle } from '@/engine/rng'

/**
 * The line the host reads aloud for a beat.
 *
 * Themes supply narration for the common beats (GAME_DESIGN §8.1); anything a
 * theme doesn't name falls back to a generic line built from the themed role
 * name, so a new theme is never *broken*. Only less flavourful.
 */
export function beatNarration(theme: Theme, beatId: BeatId, themedRole: string): string {
  switch (beatId) {
    case 'wolves_kill':
      return theme.narration.wolvesWake
    case 'seer_investigate':
      return theme.narration.seerWake
    case 'doctor_protect':
      return theme.narration.doctorWake
    case 'cupid_link':
      return `${themedRole}, open your eyes. Choose two to bind together.`
    case 'lovers_wake':
      return 'Lovers, open your eyes and see each other. Then close them.'
    case 'executioner_target':
      return `${themedRole}, open your eyes. This is your mark.`
    case 'minion_sees':
      return `${themedRole}, open your eyes. These are the ones you serve.`
    case 'wolves_recognise':
      return `${themedRole}, open your eyes and know each other.`
    case 'blackmailer_silence':
      return `${themedRole}, open your eyes. Who will not speak tomorrow?`
    case 'bodyguard_guard':
      return `${themedRole}, open your eyes. Who do you stand in front of?`
    case 'priest_bless':
      return `${themedRole}, open your eyes. Who receives your blessing?`
    case 'sk_kill':
      return `${themedRole}, open your eyes. Choose.`
    case 'vigilante_shoot':
      return `${themedRole}, open your eyes. Do you fire tonight?`
    case 'witch_act':
      return `${themedRole}, open your eyes. Here is tonight's dying.`
    case 'gravedigger_exhume':
      return `${themedRole}, open your eyes. Whose grave do you open?`
    case 'sleepwalker_stir':
      return `${themedRole}, you stir. Listen.`
    default:
      return `${themedRole}, open your eyes.`
  }
}

export const closingLine = (themedRole: string) => `${themedRole}, close your eyes.`

/**
 * The line the host reads over a death.
 *
 * Returns only the phrase completing "<name> …", because every screen that
 * calls this already shows the name in display type directly above it. Flavour
 * lines are written as verb phrases ("was found at the treeline…"), not
 * sentences.
 *
 * **A reason never repeats a line until it has spent all of them.** Picking
 * independently per death would repeat roughly a third of the time with three
 * variants, and by the fourth wolf kill the host sounds like they are reading a
 * spreadsheet. Instead the variants are shuffled once per game per reason and
 * dealt out in order: the 1st, 2nd and 3rd wolf kill are always three different
 * lines. Past three the deck reshuffles for the next lap.
 *
 * Everything derives from the seed, so a replay narrates identically and no
 * Math.random() reaches the narration (D7).
 */
export function deathLine(
  theme: Theme,
  game: GameState,
  seatId: string,
  reason: DeathReason,
): string {
  const entry = theme.deathFlavour[reason]
  const variants = (Array.isArray(entry) ? entry : entry ? [entry] : []).filter(Boolean)

  if (variants.length === 0) {
    return reason === 'execution'
      ? 'was executed in front of everyone.'
      : 'did not survive the night.'
  }
  if (variants.length === 1) return variants[0]

  const seat = game.seats.find((s) => s.id === seatId)

  // Games saved before deathOrder existed cannot say what came before, so they
  // fall back to an independent (still seeded) pick rather than always dealing
  // the same first card.
  if (seat?.deathOrder === undefined) {
    const i = Math.floor(makeRng(`${game.seed}:${seatId}:${reason}`)() * variants.length)
    return variants[i] ?? variants[0]
  }

  // How many deaths of this same reason already happened this game.
  const spent = game.seats.filter(
    (s) => s.deathReason === reason && s.deathOrder !== undefined && s.deathOrder < seat.deathOrder!,
  ).length

  const lap = Math.floor(spent / variants.length)
  const pos = spent % variants.length
  return deckForLap(variants, game.seed, reason, lap)[pos] ?? variants[0]
}

/**
 * The shuffled order this reason's lines are dealt in for a given lap.
 *
 * Exhausting a deck only happens in a long game (six wolf kills before any line
 * can come round again). When it does, the reshuffled deck must not open with
 * the line the previous deck closed on, since a back-to-back repeat is the one
 * a listener actually notices. Swapping the first two entries fixes that
 * without breaking the "every line once per lap" property; returning a
 * different index would instead collide with the following draw.
 *
 * Laps are walked from the start because each one depends on the last, and
 * there are only ever a handful.
 */
function deckForLap(variants: string[], seed: string, reason: string, lap: number): string[] {
  let deck: string[] = []
  let previous: string[] | null = null

  for (let l = 0; l <= lap; l++) {
    deck = shuffle(variants, makeRng(`${seed}:${reason}:${l}`))
    if (previous && deck.length > 1 && deck[0] === previous[previous.length - 1]) {
      ;[deck[0], deck[1]] = [deck[1], deck[0]]
    }
    previous = deck
  }
  return deck
}
