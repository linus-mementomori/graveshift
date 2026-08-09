import type { Theme } from './types'

/**
 * WIDOW'S BAY. The shared premise of Fear Street (2021) and Widow's Bay (2026).
 *
 * Both turn on the same bargain: a founding family made a pact underground, and
 * every generation an heir goes back down and gives up a name. The named person
 * is taken. The family and their side of the water stay rich.
 *
 * From Fear Street: Solomon Goode's deal, the caverns beneath the house, a new
 * name added each generation, prosperous Sunnyvale against ruined Shadyside,
 * and Sarah Fier hanged as a witch for a curse she never cast.
 *
 * From Widow's Bay: a New England island, a 1700s founder granted eternal life
 * and buried rather than dead, the curse holding as long as one of his blood
 * remains on the island, and islanders who die if they ever leave.
 *
 * The mafia here are not monsters. They are neighbours with a mortgage. That's
 * the horror.
 */
export const widowsBay: Theme = {
  id: 'widowsBay',
  name: "Widow's Bay",
  tagline: 'Somebody went down to the cave again, and somebody up here got rich.',
  category: 'horror',
  place: 'the island',
  factionNames: { village: 'The Townsfolk', mafia: 'The Bloodline', neutral: 'The Unclaimed' },
  roleSkins: {
    villager: {
      name: 'Islander',
      flavour: 'Born here, so you die here. The water takes anyone who leaves. No gift. One vote.',
    },
    werewolf: {
      name: 'The Bloodline',
      flavour: 'Go down, put a name on the wall, come up. The town thrives and it costs you nothing yet.',
    },
    seer: {
      name: 'The Vicar',
      flavour: 'You feel it come off them like damp off stone. One soul a night, and you are never wrong.',
    },
    doctor: {
      name: 'The Doctor',
      flavour: 'One house call a night. Sit with them till morning and nothing gets in. Never the same house twice running.',
    },
    bodyguard: {
      name: 'The Sheriff',
      flavour: 'You park outside their door all night. Whatever was coming for them finds you first.',
    },
    hunter: {
      name: 'The Whaler',
      flavour: 'Forty years on the boats. The harpoon goes out as you go down, and it takes somebody.',
    },
    witch: {
      name: 'The Herbalist',
      flavour: 'Two jars off the bog. One brings a body back from the edge. One walks it over.',
    },
    vigilante: {
      name: 'The Widow',
      flavour: 'Two shells and no warrant. Put one in a neighbour and you will not see the week out.',
    },
    mayor: {
      name: 'The Mayor',
      flavour: 'Stand up at the meeting and say it. From then on the room counts you twice.',
    },
    lycan: {
      name: 'Born Wrong',
      flavour: 'Clean as anyone, and the Vicar will still name you. Something on the island marked you at birth.',
    },
    minion: {
      name: 'The Notary',
      flavour: 'You keep the family ledgers, so you know exactly whose blood it is. They have no idea about you.',
    },
    alpha: {
      name: 'The Founder',
      flavour: 'Three hundred years in a box under the church, and not once dead. Rise, and no salt or prayer holds.',
    },
    cupid: {
      name: 'The Binder',
      flavour: 'You tie two people at the wrist in front of witnesses. The cave takes one, it takes both.',
    },
    jester: {
      name: 'The Accused',
      flavour: 'They already decided it was you. Let the town hang you for it and you have won.',
    },
    serialKiller: {
      name: 'The Cursed',
      flavour: 'Your name went on that wall years ago. You are not theirs and not ours. One a night.',
    },
    executioner: {
      name: 'The Zealot',
      flavour: 'One name, and it must be the town that does it. Your own hands stay clean.',
    },
    blackmailer: {
      name: 'The Confessor',
      flavour: 'You know what they did in ninety-four. They will not say a word tomorrow.',
    },
    prince: {
      name: 'The Magistrate',
      flavour: 'Produce the seal once and the rope is put away. Only once.',
    },
    gravedigger: {
      name: 'The Sexton',
      flavour: 'You dug every plot on this island. Open one and you learn exactly what they were.',
    },
    priest: {
      name: 'The Saltcaster',
      flavour: 'One unbroken line of salt at one threshold. For a day and a night, nothing crosses it.',
    },
    sleepwalker: {
      name: 'The Lighthouse Keeper',
      flavour: 'You are awake at three, watching the water. You know if it took anyone. Never who.',
    },
  },
  narration: {
    nightFall: 'Lights out across the island. The tide is going out. Everyone, close your eyes.',
    wolvesWake: 'Bloodline, wake. Whose name goes on the wall tonight?',
    seerWake: 'Vicar. One soul. Tell me what you feel in them.',
    doctorWake: 'Doctor. Whose door are you sitting behind tonight?',
    dawn: 'Low fog off the bay. The town counts itself.',
    noDeath: 'Everybody made it to morning. The cave went hungry, and it does not forget.',
    day: 'Town meeting. Somebody here has been down those stairs.',
    vote: 'The town has to put a name to it. Now.',
    execution: 'The town has decided. Take them out to the point.',
  },
  deathFlavour: {
    mafia_kill: 'was found at the low-tide line, name freshly cut into wet stone below.',
    serial_killer: 'was opened up by something the town stopped naming years ago.',
    vigilante: 'took a shell from a gun nobody on this island will own to.',
    witch_poison: 'was given something for the pain and never came round.',
    bodyguard_sacrifice: 'was parked outside somebody else’s house, and it found that car first.',
    lover_grief: 'went into the water after them before the fog lifted.',
    hunter_revenge: 'caught a harpoon thrown by a man already going down.',
    execution: 'was walked out to the point by their own neighbours.',
    vigilante_guilt: 'was found in the boathouse, having settled it themselves.',
  },
  cueOverrides: {
    NIGHT_FALL: 'Slow surf and a buoy bell, far out. Kill the lights.',
    WOLVES_WAKE: 'Drag a fingernail across stone or a table edge.',
    SEER_WAKE: 'One low note on a wet glass rim.',
    DOCTOR_WAKE: 'Two soft knocks on wood.',
    DAWN: 'A gull, once. Then nothing.',
    DEATH_REVEAL: 'Say the name flat. Do not soften it.',
    EXECUTION: 'A rope going taut.',
    VICTORY_MAFIA: 'Let the surf run under the silence. Nobody speaks.',
  },
  victory: {
    village: 'The stairs are filled in and the ledger is burned. The bay is just a bay.',
    mafia: 'Another name on the wall, another good year. The town never even looks down.',
    neutral: 'Something got paid tonight, and it was not the family and it was not the town.',
  },
}
