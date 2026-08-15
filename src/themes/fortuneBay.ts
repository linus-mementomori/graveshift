import type { Theme } from './types'

/**
 * FORTUNE BAY. A coastal town whose luck was bought, and is still being paid for.
 *
 * Built from two folk-horror archetypes much older than any film that uses
 * them: the Faustian bargain, where prosperity is granted now against a soul
 * collected later, and the scapegoat town, where everyone's comfort rests on a
 * victim the community has agreed not to discuss.
 *
 * The local shape of it: a founding family struck a deal in a cave under the
 * headland. Every generation an heir goes back down and gives up a name. The
 * named person is taken, the tide leaves that name cut into wet stone, and this
 * side of the water stays rich. Nobody who leaves the island lives long.
 *
 * The mafia here are not monsters. They are neighbours with a mortgage. That's
 * the horror.
 */
export const fortuneBay: Theme = {
  id: 'fortuneBay',
  name: 'Fortune Bay',
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
    opening:
      'The island. One bridge, one road, and the tide going out. The families on the north side have new boats and new roofs and nobody asks how. Under the headland there is a cave, and after every visit a fresh name shows up cut into the wet stone.',
    intro:
      'Round the room. Your name, which side of the water you were born on, and who your people are. Everyone here knows already. Say it anyway.',
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
    mafia_kill: [
      'was found at the low-tide line, name freshly cut into wet stone below.',
      'was found where the water turns back, with a new name in the rock beside them.',
      'did not come up from the shore road. The tide had already been and gone.',
      'was found under the pier, where the stone is soft enough to cut.',
      'was found face-up in six inches of water, well above the tide line.',
      'did not come back from the shore. There is fresh cutting on the rock.',
    ],
    serial_killer: [
      'was opened up by something the town stopped naming years ago.',
      'was found in a state the town has agreed not to describe out loud.',
      'was killed by a hand, not a curse, which is somehow worse here.',
      'was killed with a blade, which is not how the debt gets collected here.',
      'was found in a state the coroner has written up very briefly.',
      'was killed by somebody who wanted it to look like the cave.',
    ],
    vigilante: [
      'took a shell from a gun nobody on this island will own to.',
      'was shot by a neighbour who had made their own mind up about the cave.',
      'took a shell fired by somebody who is very quiet down at the dock today.',
    ],
    witch_poison: [
      'was given something for the pain and never came round.',
      'was given something to help them sleep, and it helped completely.',
      'went under and did not surface. No wound, and no water in the lungs.',
    ],
    bodyguard_sacrifice: [
      "was parked outside somebody else's house, and it found that car first.",
      'put themselves between the door and the dark, and it took the nearer one.',
      "was standing in somebody else's place when it came, and it did not check.",
    ],
    lover_grief: [
      'went into the water after them before the fog lifted.',
      'walked into the bay after them and did not turn around.',
      'was found at the tide line beside them, which surprised nobody here.',
    ],
    hunter_revenge: [
      'caught a harpoon thrown by a man already going down.',
      'was taken along by somebody with nothing left to lose and good aim.',
      'caught the last thing thrown by a dying hand.',
    ],
    execution: [
      'was walked out to the point by their own neighbours.',
      'was taken out to the point by people who had eaten at their table.',
      'was walked down to the water by the whole town, and only the town walked back.',
      'was walked out past the boathouse by people who had known them since school.',
      'was taken to the point by the whole town, and the town has stopped mentioning it.',
      'was walked down to the water. Half the island voted, and all of it watched.',
    ],
    vigilante_guilt: [
      'was found in the boathouse, having settled it themselves.',
      'went down to the boathouse alone and finished it there.',
      "could not carry the shot, and took it out of the town's hands.",
    ],
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
