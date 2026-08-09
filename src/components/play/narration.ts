import type { Theme } from '@/themes'
import type { BeatId } from '@/engine/types'

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

/** Death flavour, falling back to a plain statement if the theme is silent. */
export function deathLine(theme: Theme, reason: string, name: string): string {
  const flavour = theme.deathFlavour[reason as keyof typeof theme.deathFlavour]
  return flavour ? `${name}, ${flavour}` : `${name} did not survive the night.`
}
