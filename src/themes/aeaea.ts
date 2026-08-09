import type { Theme } from './types'

/**
 * AEAEA, Circe's island, from Book 10 of the Odyssey.
 *
 * Replaces the old "Olympus Betrayed", which was generic Greek pantheon
 * wallpaper. This one commits to a single story, which gives the whole theme a
 * spine: Odysseus's crew make landfall, Circe feeds them a drugged kykeon and
 * drives them to the sty as swine. Eurylochus hangs back and sees it. Hermes
 * gives Odysseus *moly*, the herb that breaks the charm.
 *
 * The good rewrite here is DEATH: nobody dies, they are turned. Same mechanics,
 * far better table talk, "Ana is in the sty" lands differently to "Ana is dead".
 */
export const aeaea: Theme = {
  id: 'aeaea',
  name: 'The Isle of Aeaea',
  tagline: 'One of us keeps a cup, and the sty keeps filling.',
  category: 'myth',
  place: 'the isle',
  factionNames: { village: 'The Crew', mafia: 'The Enchantresses', neutral: 'The Unbound' },
  roleSkins: {
    villager: { name: 'Oarsman', flavour: 'You pulled an oar for ten years. No gift, no charm, one vote.' },
    werewolf: {
      name: 'Enchantress',
      flavour: 'Cheese, barley, honey, wine, and the drug beneath. Choose who drinks.',
    },
    seer: { name: 'Tiresias', flavour: 'You were shown one thing each night. It is always true.' },
    doctor: {
      name: 'Moly-Bearer',
      flavour: 'Hermes gave you the black root and white flower. It breaks any draught but your own twice.',
    },
    bodyguard: { name: 'Shield-Bearer', flavour: 'You drink what was poured for them, and you go to the sty instead.' },
    hunter: { name: 'The Bowman', flavour: 'The great bow is strung as you fall. Someone goes with you.' },
    witch: {
      name: 'Herb-Wife',
      flavour: 'Two vials off the same hillside. One brings them back. One finishes it.',
    },
    vigilante: {
      name: 'Spear of Ithaca',
      flavour: 'Two casts, no council. Strike a shipmate and the guilt takes you by morning.',
    },
    mayor: { name: 'Odysseus', flavour: 'Name yourself captain and the crew counts your voice twice.' },
    lycan: { name: 'Swine-Marked', flavour: 'You smell of the sty and you have never touched a cup. Tiresias will call you guilty.' },
    minion: { name: 'Handmaid', flavour: 'You carry her water and know her face. She has never once learned yours.' },
    alpha: { name: 'Circe', flavour: 'Daughter of Helios. Once, you raise the wand and no herb on earth answers.' },
    cupid: { name: "Eros' Arrow", flavour: 'Two hearts bound at the wrist. The sty takes one, it takes both.' },
    jester: { name: 'Elpenor', flavour: 'Youngest, drunkest, least missed. Have the crew condemn you and you win.' },
    serialKiller: { name: 'Scylla', flavour: 'Six mouths in the rock. No cup, no crew, no side but your own.' },
    executioner: { name: 'The Fury', flavour: 'One name. You do not touch them. The crew must.' },
    blackmailer: { name: 'Lotus-Eater', flavour: 'They taste the flower and forget how to argue. Silent all day.' },
    prince: { name: 'Herald of Ithaca', flavour: 'Show the captain’s seal once and the crew stays its hand.' },
    gravedigger: { name: 'Shade-Caller', flavour: 'Blood in the trench, and the sty gives up what someone truly was.' },
    priest: { name: 'Athena-Favoured', flavour: 'One prayer, answered once. Nothing touches them for a day and a night.' },
    sleepwalker: { name: 'The Watchman', flavour: 'You slept badly on deck. You know if the sty took anyone. Never who.' },
  },
  narration: {
    nightFall: 'Night on Aeaea. Smoke from the hall, and something singing at a loom. Close your eyes.',
    wolvesWake: 'Enchantresses, wake. Whose cup do you fill tonight?',
    seerWake: 'Tiresias. One name, and the truth of them.',
    doctorWake: 'Moly-Bearer. Who carries the herb tonight?',
    dawn: 'Grey light off the water. Count the crew.',
    noDeath: 'Every hand answered the roll. The sty is quiet. That will not last.',
    day: 'Ashore, in daylight. Find her before the next cup is poured.',
    vote: 'Name her. The crew decides now.',
    execution: 'The crew has spoken. Take them.',
  },
  deathFlavour: {
    mafia_kill: 'drank, and went to the sty on four legs, still with a human eye.',
    serial_killer: 'was taken off the rocks by something with too many mouths.',
    vigilante: 'was found with a spear no shipmate will admit to casting.',
    witch_poison: 'took a vial meant as mercy and did not wake.',
    bodyguard_sacrifice: 'drank what was poured for another, and went in their place.',
    lover_grief: 'followed their bound heart to the sty before the hour turned.',
    hunter_revenge: 'was taken by the last arrow off a falling bow.',
    execution: 'was condemned by the crew on the shingle, in full daylight.',
    vigilante_guilt: 'walked into the surf before dawn and did not come back.',
  },
  cueOverrides: {
    NIGHT_FALL: 'A woman humming at a loom, low and unhurried. Dim everything.',
    WOLVES_WAKE: 'Pour something into a cup, slowly, near the table.',
    SEER_WAKE: 'One struck note, let ring out.',
    DEATH_REVEAL: 'A snort, a squeal, cut short.',
    EXECUTION: 'A single heavy stone dropped flat.',
    VICTORY_VILLAGE: 'Oars, and open water. Something with strings.',
  },
  victory: {
    village: 'The wand is broken and the sty is empty. The crew puts to sea.',
    mafia: 'The hall is quiet and the pens are full. She goes back to her loom.',
    neutral: 'Nobody sails. Something else on this island got what it came for.',
  },
}
