# GAME_DESIGN.md — Project Remus

The complete rules specification. This document is **normative**: the engine implements exactly
what is written here, and any ambiguity found in play is resolved by amending this file first.

**Contents**
1. Core loop
2. Factions & win conditions
3. Role catalogue
4. Night order & resolution
5. Balance tables (5–20 players)
6. Phase-by-phase host script
7. The cue system (audio & theatre)
8. Theme packs
9. Edge cases & rulings
10. Balance theory & the scenario simulator
11. Sources

---

## 1. Core loop

```
        SETUP
          │
          ▼
   ┌──▶ NIGHT ──▶ DAWN ──▶ DAY ──▶ VOTE ──▶ DUSK ──┐
   │   (secret    (deaths  (talk)  (accuse  (last   │
   │    actions)  reveal)          + hang)  words)  │
   └───────────────── win check ◀─────────────────┘
                          │
                          ▼
                         END
```

A **win check** runs after *every* death, not just at phase end. If a check passes mid-phase the
game jumps straight to END.

**Phase durations** are host-controlled by default. Optional timers: Day 3/5/8 min, Vote 60/90 s,
Last Words 30 s. Timers are advisory — the host can always extend.

**Night 0** (optional, default **on** for ≤ 9 players). A first night in which all kills fail —
information roles act, killers do not. It hands the village one extra day of discussion and one
extra execution before anyone dies. It is the single cleanest lever for tilting a setup toward the
village without adding a role, and the app offers it as a one-tap balance fix during setup.

---

## 2. Factions & win conditions

| Faction | Members | Wins when |
|---|---|---|
| **Village** | Villager + all village power roles | Every Mafia and every Neutral Killer is dead. |
| **Mafia** | Werewolves, Alpha, Minion, Blackmailer | Mafia count ≥ number of living non-Mafia, **and** no living Neutral Killer. |
| **Neutral** | Each neutral wins on its own terms (below) | Evaluated individually, can win *with* or *instead of* another faction. |

**Neutral win conditions**

- **Jester** — wins the instant they are executed by daytime vote. The game **ends immediately**;
  everyone else loses. (Dying at night does *not* count — the Jester must be voted out.)
- **Serial Killer** — wins when they are the last player alive, or the only player alive besides a
  single non-killer they can finish. Blocks a Mafia parity win while alive.
- **Lovers** (created by Cupid) — if exactly the two Lovers remain alive, they win together and
  override all other conditions, even across factions.
- **Executioner** — wins if their assigned target is executed by vote while the Executioner lives.
  Does not end the game; they simply score a win. If their target dies at night, they become a
  plain Villager.

**Parity rule detail.** Mafia parity is checked as `mafia >= others`, where *others* counts every
living non-Mafia seat including neutrals. This is the standard "wolves can no longer be outvoted"
condition. With a living Serial Killer, Mafia cannot win — the SK is an unresolved threat.

---

## 3. Role catalogue

Roles are grouped in **tiers**. New hosts get Core only by default.

### Tier 1 — Core (always available)

| Role | Faction | Night | Ability |
|---|---|---|---|
| **Villager** | Village | — | None. Votes, talks, lies convincingly about nothing. |
| **Werewolf** | Mafia | 30 | Collectively choose one seat to kill each night. Knows the other wolves. |
| **Seer** | Village | 25 | Each night, learn one seat's **faction** (Mafia or Not-Mafia). |
| **Doctor** | Village | 20 | Each night, protect one seat from death. **May not protect the same seat twice in a row.** May self-protect (limit: twice per game). |

### Tier 2 — Standard

| Role | Faction | Night | Ability |
|---|---|---|---|
| **Bodyguard** | Village | 21 | Protect a seat. If that seat is attacked, the Bodyguard dies instead and the attack is absorbed. Cannot guard self. |
| **Hunter** | Village | — | On death (any cause), immediately choose a seat; that seat dies too. Triggers before the next phase. |
| **Witch** | Village | 50 | Two one-shot potions: **Life** (revive tonight's victim) and **Death** (kill any seat). Is shown who is about to die. May use both on the same night. |
| **Vigilante** | Village | 40 | Two one-shot night kills. If a shot kills a Village member, the Vigilante dies of guilt the following night. |
| **Mayor** | Village | — | May reveal at any time during Day. Once revealed, their vote counts **twice** for the rest of the game and they can never be a Seer's "not-mafia" surprise. Cannot be un-revealed. |
| **Lycan** | Village | — | A true villager who reads as **Mafia** to the Seer. |
| **Minion** | Mafia | 5 | Knows the Werewolves. The Werewolves do **not** know the Minion. No night kill. |
| **Alpha Wolf** | Mafia | 30 | Once per game, declares a **Rampage**: that night's Mafia kill ignores all protection. |
| **Cupid** | Village | 1 (first night only) | Links two seats as **Lovers**. If one dies, the other dies of grief. Lovers learn each other's identity. |

### Tier 3 — Advanced

| Role | Faction | Night | Ability |
|---|---|---|---|
| **Jester** | Neutral | — | Wants to be executed. See §2. |
| **Serial Killer** | Neutral | 35 | Kills one seat each night. Immune to the Mafia's night kill (they fight back). Wins alone. |
| **Executioner** | Neutral | — | Assigned a random living Village target at setup. See §2. |
| **Blackmailer** | Mafia | 10 | Silences one seat: that player may not speak or vote during the following Day. |
| **Prince** | Village | — | The first time the Prince would be executed by vote, they reveal instead and survive. The vote is spent. |
| **Gravedigger** | Village | 60 | Each night, learn the exact **role** of one dead seat. |
| **Priest** | Village | 22 | One-shot: bless a seat. That seat is immune to *all* death for one full cycle (night + day execution). |
| **Sleepwalker** | Village | 65 | Learns whether *anyone* died last night before the rest of the table does — but not who. Flavour role for early information. |

**Reserved for later:** Sorcerer, Arsonist, Cult Leader, Fool. Not in v1.

---

## 4. Night order & resolution

### 4.1 Order

Each role has an integer `nightOrder`. The engine walks the living, awake roles in ascending order,
skipping any whose ability is spent or blocked. Ties never occur — the table is unique.

| # | Beat | Notes |
|---|---|---|
| 1 | **Cupid links Lovers** | First night only |
| 2 | **Lovers wake and see each other** | First night only |
| 3 | **Executioner learns their target** | First night only, silent card-show |
| 5 | **Minion sees the Werewolves** | First night only |
| 6 | **Werewolves recognise each other** | First night only |
| 10 | **Blackmailer silences** | |
| 20 | **Doctor protects** | |
| 21 | **Bodyguard guards** | |
| 22 | **Priest blesses** | One-shot |
| 25 | **Seer investigates** | Resolved against *pre-death* state |
| 30 | **Werewolves kill** | Alpha may declare Rampage here |
| 35 | **Serial Killer kills** | |
| 40 | **Vigilante shoots** | |
| 50 | **Witch acts** | Shown the pending victim list first |
| 60 | **Gravedigger exhumes** | |
| 65 | **Sleepwalker stirs** | Last beat of the night |

### 4.2 Resolution algorithm

Night actions do **not** resolve as they are entered. They are collected as *intents*, then resolved
in one pure pass at the end of the night. This is what makes edge cases deterministic.

```
resolveNight(state, intents) →
  1. SILENCE      apply Blackmailer  → seat.marks += 'silenced'
  2. PROTECT      apply Doctor, Bodyguard, Priest → seat.marks += 'protected' | 'guarded' | 'blessed'
  3. ATTACK       collect every kill intent as { source, target, piercing? }
                    - Mafia kill      (piercing if Alpha Rampage)
                    - Serial Killer   (never piercing; SK is immune to mafia attacks)
                    - Vigilante
                    - Witch: Death
  4. ABSORB       for each attack on a 'guarded' seat → Bodyguard dies instead, attack consumed
  5. NEGATE       drop attacks on 'protected' or 'blessed' seats, unless piercing
                  drop mafia attacks on the Serial Killer
  6. REVIVE       Witch: Life removes one seat from the pending-death set
  7. COMMIT       everyone still in the death set dies
  8. CASCADE      repeat until stable:
                    - Lover of a dead Lover dies of grief
                    - Hunter death → host prompted for a revenge target → that seat dies
  9. INFORM       compute Seer / Gravedigger / Sleepwalker results from the correct snapshot
 10. CHECK        evaluate win conditions
```

**Snapshot rule.** Investigative results are computed against the state **before** step 7. A Seer
who checks a player who dies that same night still gets a correct answer.

**Determinism rule.** If two effects could contradict, the order above decides — always. There is
no "host discretion" in resolution.

### 4.3 Death reasons (used in Dawn narration)

`mafia_kill` · `serial_killer` · `vigilante` · `witch_poison` · `bodyguard_sacrifice` ·
`lover_grief` · `hunter_revenge` · `execution` · `vigilante_guilt`

Each theme supplies its own flavour line per reason (see §8).

---

## 5. Balance tables (5–20 players)

The app ships one **recommended preset** per player count, plus the ability to add/remove roles
manually with a live warning if the balance drifts.

### 5.1 Recommended presets

| Players | Mafia | Village power | Neutral | Plain villagers | Suggested composition |
|---:|---:|---:|---:|---:|---|
| 5 | 1 | 1 | 0 | 3 | Wolf, Seer |
| 6 | 1 | 2 | 0 | 3 | Wolf, Seer, Doctor |
| 7 | 2 | 2 | 0 | 3 | 2 Wolf, Seer, Doctor |
| 8 | 2 | 3 | 0 | 3 | 2 Wolf, Seer, Doctor, Hunter |
| 9 | 2 | 3 | 0 | 4 | 2 Wolf, Seer, Doctor, Hunter |
| 10 | 2 | 4 | 0 | 4 | 2 Wolf, Seer, Doctor, Hunter, Witch |
| 11 | 3 | 4 | 0 | 4 | 3 Wolf, Seer, Doctor, Hunter, Witch |
| 12 | 3 | 4 | 1 | 4 | 3 Wolf, Seer, Doctor, Hunter, Witch, **Jester** |
| 13 | 3 | 4 | 1 | 5 | 3 Wolf, Seer, Doctor, Hunter, Witch, Jester |
| 14 | 4 | 4 | 1 | 5 | 2 Wolf + Alpha + Minion, Seer, Doctor, Hunter, Bodyguard, Jester |
| 15 | 4 | 5 | 1 | 5 | 3 Wolf + Alpha, Seer, Doctor, Hunter, Witch, Bodyguard, Jester |
| 16 | 4 | 6 | 1 | 5 | + Mayor |
| 17 | 4 | 6 | 2 | 5 | + Serial Killer |
| 18 | 5 | 6 | 2 | 5 | + Blackmailer (mafia) |
| 19 | 5 | 6 | 2 | 6 | Cupid replaces Mayor |
| 20 | 5 | 7 | 2 | 6 | + Prince |

> These sixteen rows are checked against the §5.2 rules programmatically, not by eye. Four of them
> failed on the first pass — 13, 14, 19 and 20 all exceeded the power-role density cap — and the
> numbers above are the corrected set. The check is what the balance test suite (ARCHITECTURE §8)
> automates.

### 5.2 Balance rules the engine enforces

1. **Mafia ratio** must sit between **20 % and 30 %** of the table, **from 7 players up**. Below
   20 % the village steamrolls; above 30 % the wolves win before information accumulates.
   `mafiaCount = clamp(round(players * 0.26), 1, floor((players - 1) / 3))`
   At 5–6 players the floor is waived, because rule 2 binds harder — a second wolf at 6 would start
   the game one death from parity.
2. **Never let Mafia start at parity-minus-one.** A 5- or 6-player game has exactly 1 wolf, never 2.
3. **Power role density ≤ 55 %** of the village. If almost everyone has a power, no one is bluffing
   and the social game dies.
4. **Killing power cap.** Total non-mafia night-kill sources (Vigilante, Witch-Death, Serial Killer)
   ≤ `floor(players / 6)`. Too many killers turns Night into a bloodbath and the day into nothing.
5. **Cupid requires ≥ 9 players.** With fewer, the Lovers win condition is trivially reachable.
6. **Jester requires ≥ 10 players.** In small games an instant Jester win feels like a coin flip.
7. **Serial Killer requires ≥ 15 players** and forces at least 3 Mafia (it needs a crowded board).
8. **Alpha Wolf requires ≥ 12 players** (its Rampage invalidates the Doctor, which is brutal early).
9. **Opening vote margin.** If *every* evil player voted as a bloc on Day 1, they must still fall
   short of a majority by at least 2 votes — and they must still fall short after one mislynch
   and one full night of kills. This is the "can evil steal the execution?" check, and it is the
   most load-bearing balance test in the whole table. It is what actually stops a setup from being
   broken by design.
10. **Vote-altering roles are counted as evil votes.** A Blackmailer silencing a villager is worth
    the same as a wolf voting. Rule 9 is evaluated with those effects applied, not ignored.
11. **The village always gets an inspector.** Every legal setup contains at least one investigative
    role (Seer or Gravedigger). A village with no information isn't playing a deduction game, it's
    playing a lottery.
12. **The village gets a protector at ≥ 8 players.** Doctor or Bodyguard. Below 8, protection makes
    the wolves' job impossible.
13. **Village kill power must be strictly harder to use than evil kill power.** The Vigilante is
    ammo-limited *and* punished for misfires; the Witch's Death is one-shot. Evil kills are
    unlimited and free. This asymmetry is deliberate and non-negotiable — an unrestricted village
    vigilante is just a second mafia with better PR.
14. **No evil execution-immunity.** The Prince (execution save) is village-only. No Mafia or Neutral
    role may be immune to execution or block a vote outright. Evil survivability is earned by
    lying, not granted by the setup.
15. **Neutral win conditions must be directional.** Every neutral must want a *specific* faction to
    win or lose — never merely "survive." A survive-to-win neutral has no incentive to act, drifts
    to whoever is nicest to them, and turns the endgame into a kingmaker coin-flip. Jester (wants
    to be executed), Executioner (wants a named target executed), and Serial Killer (wants everyone
    dead) all pass this test.

### 5.3 The "difficulty read"

During setup the app shows an at-a-glance balance meter derived from a simple heuristic score, so
the host understands the game they just built without needing theory:

```
villageEdge =  (villagePowerRoles * 1.0)
             + (investigators     * 0.6)
             + (protectors        * 0.5)
             - (mafiaCount        * 1.4)
             - (mafiaSpecials     * 0.7)
             - (neutralKillers    * 1.1)
```

| Score | Label shown | Copy |
|---|---|---|
| ≥ +2.0 | 🟢 Village favoured | "Good for new groups. The wolves will have to work." |
| −1.0 … +2.0 | 🟡 Balanced | "A fair fight. This is the sweet spot." |
| < −1.0 | 🔴 Mafia favoured | "Brutal. Expect a short, tense game." |

This is a **read**, not a lock. The host can play whatever they want.

---

## 6. Phase-by-phase host script

Every beat below is what the app shows. `«...»` is **read aloud verbatim**.
`▸` is a host action. `♪` is a cue (see §7).

### SETUP

**S1 · Table size** — "How many are playing?" Big stepper, 5–20. Live preview of the composition.

**S2 · Choose a world** — Theme grid. Selecting one re-skins the whole app instantly.

**S3 · Roles** — Recommended preset shown pre-filled, with the difficulty read. Host can tap any
role to add/remove; violations of §5.2 show an inline warning but never hard-block.

**S4 · Seats** — Enter names, or accept auto-names (`Player 1…n`) and rename later. Drag to reorder
to match the physical circle — this matters, because the host reads the app left-to-right.

**S5 · The deal** — Roles are shuffled and assigned. Then, one seat at a time:

> «*[Name]*, take the phone. Don't let anyone see.»
> ▸ Hand device to player → they tap **Reveal** → hold to see role + flavour → tap **Hide** →
> hand back.
> Guard rail: a 3-second "cover the screen" countdown before each reveal, and the screen never
> shows the role and the next player's name at the same time.

**S6 · Ready** — Recap: *N players · Theme · Night 1 begins.* One giant button: **Begin.**

### NIGHT

♪ **Cue: NIGHT_FALL** — *"Start your night music now. Lower the lights."*

> «Night falls on *[place]*. Everyone — close your eyes.»
> «Heads down. No peeking, no sounds, no smiles.»

Then, for each beat in night order, the app shows a **card** with three zones:

```
┌─────────────────────────────────┐
│ ♪  play a low drone             │  ← cue strip
├─────────────────────────────────┤
│ «Werewolves, open your eyes.    │  ← read aloud (large)
│  Choose your prey.»             │
├─────────────────────────────────┤
│ [ Ana ] [ Ben ] [ Cai ] [ Dee ] │  ← tap the target
│ ── or ──   [ No target ]        │
└─────────────────────────────────┘
```

- Only **valid targets** are tappable (dead seats greyed, illegal targets disabled with a reason).
- **Info roles** (Seer, Gravedigger) show the answer on a **hold-to-reveal** panel so a shoulder-surfer
  can't catch it, then the host relays it silently by pointing / thumbs.
- Every card has **↺ Repeat line** and **← Back** (back un-does the intent, since nothing has
  resolved yet).
- Closing line each beat: «*[Role]*, close your eyes.»

♪ **Cue: NIGHT_END** — *"Fade the music out."*

### DAWN

♪ **Cue: DAWN** — *"Cut the music. Two seconds of silence — then speak."*

> «The sun rises over *[place]*.»
> — if deaths: «*[Name]* did not survive the night.» + theme-specific death flavour by reason.
> — if none: «Somehow, everyone is still breathing. That should worry you.»

The app reveals the dead seat's role only if the theme/settings say roles are revealed on death
(**Reveal on death: ON by default** — it's better for new groups; OFF is the expert setting).

Hunter died? → immediate «*[Name]*, you have one shot left. Who goes with you?» card.

### DAY

♪ **Cue: DAY** — *"Bring up bright, busy music at low volume. Let them argue over it."*

> «You have *[N]* minutes. Find the *[mafia-term]* among you.»

Screen shows: living seats, day number, optional timer, silenced players flagged, and a
**quick-note** field per seat so the host can jot claims. Mayor reveal button lives here.

### VOTE

♪ **Cue: VOTE** — *"Kill the music. Total silence for the count."*

> «Time's up. Nominations.»
> ▸ Tap each nominated seat → tap vote counts → app tallies (Mayor = 2, silenced = 0).

Outcomes:
- **Majority** → execution.
- **Tie** → theme-flavoured runoff, then if still tied: **no execution** (default) or *sudden death*
  re-vote (setting).
- **No majority / skip** → «The town cannot decide. The night comes anyway.»

### DUSK (execution)

♪ **Cue: EXECUTION** — *"One heavy hit — a stomp, a clap, a drum. Then nothing."*

> «*[Name]*. The town has chosen you. Last words.»
> ▸ 30-second last-words timer.
> Then the reveal: «*[Name]* was… *[role]*.»
> Prince alive? → they reveal and survive instead; the vote is spent.
> Jester executed? → 🎉 immediate END with the Jester victory screen.

→ back to NIGHT.

### END

♪ **Cue: VICTORY_VILLAGE / VICTORY_MAFIA / VICTORY_NEUTRAL** — each theme names a specific mood.

Screen shows: winning faction banner, **full role reveal for every seat**, a scrollable night-by-night
log ("Night 2 — Doctor saved Ben from the wolves"), and two buttons: **Rematch, same roles** and
**New game**.

The log is the real payoff — it's what the table argues about for the next ten minutes.

---

## 7. The cue system (audio & theatre)

**Principle (Decision D2):** the app never plays licensed music. It tells the **host** what to
perform or play. The host is the instrument.

### 7.1 Anatomy of a cue

```ts
type Cue = {
  id: CueId
  kind: 'music' | 'sfx' | 'voice' | 'light' | 'action'
  text: string          // shown to the host, e.g. "play a low drone"
  urgency: 'ambient' | 'accent' | 'hit'
  synth?: SynthPatch    // optional generated fallback (Web Audio)
}
```

### 7.2 Cue points

| Cue | Kind | Default instruction |
|---|---|---|
| `NIGHT_FALL` | music | Start a slow, low ambient track. Dim the lights. |
| `WOLVES_WAKE` | sfx | A low growl, or scrape your nails on the table. |
| `SEER_WAKE` | sfx | A single soft chime — a glass tap works. |
| `DOCTOR_WAKE` | sfx | Two quiet taps, like a heartbeat. |
| `WITCH_WAKE` | sfx | A bubbling hiss, or blow across a bottle. |
| `NIGHT_END` | music | Fade out. Let silence sit for two seconds. |
| `DAWN` | music | Nothing. Silence is the cue. Then speak. |
| `DEATH_REVEAL` | voice | Drop your voice. Say the name slowly. Pause. |
| `NO_DEATH` | voice | Sound *confused*. Sell it. |
| `DAY` | music | Bright, busy, low volume — a floor under the arguing. |
| `VOTE` | music | Cut everything. Dead air makes people nervous. |
| `EXECUTION` | sfx | One heavy hit: stomp, clap, or a drum. Then nothing. |
| `LAST_WORDS` | light | If you can, put a light on them. Everyone else goes quiet. |
| `VICTORY_VILLAGE` | music | Something warm and triumphant. Loud. |
| `VICTORY_MAFIA` | music | Something cold and smug. Let it play under the reveal. |
| `VICTORY_NEUTRAL` | music | Something *wrong*. Off-kilter. Uncomfortable. |

### 7.3 Theming a cue

Each theme overrides `text` for whatever cues it wants a distinct flavour on:

| Cue | Folk-horror theme | Noir Mafia theme | Sci-fi horror theme |
|---|---|---|---|
| `NIGHT_FALL` | "Wind and distant howling." | "A slow upright bass. Rain on glass." | "A reactor hum. Barely there." |
| `WOLVES_WAKE` | "Scrape your nails on the table." | "Tap a ring on the table twice." | "A wet click. Like something breathing wrong." |
| `EXECUTION` | "One heavy stomp." | "A single gunshot clap." | "An airlock cycling." |

### 7.4 Optional generated audio

For hosts who don't want to DJ, the app can synthesise cues with the Web Audio API — no files, no
licensing:

- **Night drone** — two detuned sine oscillators at 55 Hz / 55.3 Hz through a slow lowpass sweep.
- **Chime** — a plucked sine with a 1.5 s exponential decay.
- **Heartbeat** — two filtered noise thuds at 62 BPM.
- **Hit** — a fast pitch-drop sine plus a short noise burst.
- **Vote tick** — a click every second in the final 10 seconds.

This is **off by default** and framed as a fallback: *"No music? I'll handle it."*

### 7.5 Host performance coaching

Sprinkled through the flow, one short tip at a time (dismissible, never repeats in a session):

- "Pause after a name. Silence does the work."
- "Don't rush the night. Slow is scary."
- "If nobody died, look worried."
- "Never laugh during the reveal. Even when it's funny."
- "Say the dead player's role like it costs you something."

---

## 8. Theme packs

A theme is **pure data**. Adding one is a new file and zero engine changes (Decision D4).

### 8.1 Shape

```ts
type Theme = {
  id: string
  name: string                 // "Werewolves of Millers Hollow"
  tagline: string              // "Something is wrong in the woods."
  category: 'horror' | 'crime' | 'anime' | 'myth' | 'scifi' | 'history' | 'fantasy'
  place: string                // "the village"        → used in narration
  palette: PaletteTokens       // see DESIGN.md §3
  roleSkins: Record<RoleId, { name: string; flavour: string; icon: string }>
  factionNames: { village: string; mafia: string; neutral: string }
  narration: Record<BeatId, string>
  deathFlavour: Record<DeathReason, string>
  cueOverrides: Partial<Record<CueId, string>>
  victory: { village: string; mafia: string; neutral: string }
}
```

### 8.2 Launch themes

| Theme | Category | Village / Mafia | Wolf → | Seer → | Doctor → | Mood |
|---|---|---|---|---|---|---|
| **Millers Hollow** | horror | Villagers / Werewolves | Werewolf | Seer | Healer | Folk horror, woodsmoke, wind |
| **Cosa Nostra** | crime | Citizens / The Family | Made Man | Private Eye | Surgeon | Noir, rain, brass |
| **Hunter × Demon** | anime | Corps / Demons | Demon | Oracle | Medic | Shonen night-arc, neon |
| **Olympus Betrayed** | myth | Mortals / Titan-blooded | Titan-blooded | Oracle of Delphi | Asclepius | Marble, gold, thunder |
| **Signal Lost** | scifi | Crew / The Anomaly | Assimilated | Bio-scanner | Med-officer | Cold blue, reactor hum |
| **Salem, 1692** | history | Townsfolk / The Coven | Witch | Reverend | Midwife | Candlelight, paranoia |
| **The Long Court** | fantasy | The Court / The Winter Pact | Winter-sworn | Seer of Ash | Hedge-witch | Dark fae, frost, cruelty |

### 8.3 Sample narration (Millers Hollow vs Cosa Nostra)

| Beat | Millers Hollow | Cosa Nostra |
|---|---|---|
| `NIGHT_FALL` | «Night falls on the village. Close your eyes.» | «The city goes quiet. Everybody, eyes down.» |
| `WOLVES_WAKE` | «Werewolves, open your eyes. Choose your prey.» | «The Family, wake up. Who doesn't see morning?» |
| `SEER_WAKE` | «Seer, awaken. Whose soul will you read?» | «Detective. One file. Who are we looking at?» |
| `DAWN` | «The sun rises. The village wakes.» | «Morning. The papers are already printing.» |
| `DEATH_REVEAL` | «*[Name]* was found at the treeline.» | «*[Name]* didn't come home last night.» |
| `EXECUTION` | «The village has spoken. To the square.» | «The vote's in. Nothing personal.» |
| `VICTORY_VILLAGE` | «The woods are quiet. The village survives.» | «The city cleans itself up. For now.» |
| `VICTORY_MAFIA` | «The howling stops. There's no one left to hear it.» | «The Family owns this town. It always did.» |

### 8.4 Adding a theme (author checklist)

1. Copy `src/themes/_template.ts`.
2. Fill **every** `roleSkins` entry for the roles you support (missing keys fall back to the
   canonical English name — allowed, but it looks lazy).
3. Write narration for all beats. **Hard cap: 35 words per line.**
4. Pick a palette that passes **4.5:1** contrast on body text (see DESIGN.md §3.4).
5. Add at least **three** `cueOverrides` — otherwise the theme doesn't *sound* like anything.
6. Register in `src/themes/index.ts`. The schema validator runs at build; a broken theme fails CI,
   not the party.

---

## 9. Edge cases & rulings

These are decided. The engine implements them; the host never adjudicates.

| Situation | Ruling |
|---|---|
| Doctor protects the Serial Killer's target | Protection works normally. SK is not piercing. |
| Alpha Rampage vs Doctor **and** Bodyguard | Rampage pierces protection but the Bodyguard still absorbs — a body is a body. |
| Bodyguard guards a seat attacked twice in one night | Absorbs **one** attack. The second lands. |
| Witch revives a seat the Vigilante also shot | Life removes the seat from the death set entirely, regardless of source count. |
| Vigilante kills the Jester | Jester does **not** win — only execution counts. |
| Hunter is executed by vote | Revenge shot fires **after** last words, before Night. |
| Hunter's revenge kills a Lover | Cascade continues: the other Lover dies too. Repeat until stable. |
| Both Lovers are the last two alive | Lovers win, overriding Village and Mafia. |
| Seer checks the Lycan | Result: **Mafia**. That's the whole role. |
| Seer checks the Minion | Result: **Mafia**. |
| Seer checks the Serial Killer | Result: **Not Mafia**. The SK is not Mafia. This is intended and cruel. |
| Blackmailed player is nominated | They may not speak, including last words. Their vote counts 0. |
| All Mafia die on the same night | Village wins immediately at the mid-phase win check. |
| Mafia and Serial Killer reach 1-vs-1 | Play continues into the night; the SK kills or is killed. |
| Last Mafia member is the Minion (no killers left) | No night kill occurs. Village wins on the next check — the Minion cannot win alone. |
| Doctor self-protects a third time | Blocked at input. The button is disabled with a reason. |
| Prince executed twice | The second execution kills. The save is one-shot. |
| Host taps the wrong target | **← Back** un-does any intent before the night resolves. After resolution, an "undo last phase" restores the previous snapshot. |

---

## 10. Balance theory & the scenario simulator

The presets in §5 are not vibes. They come from the standard forum-mafia design method: **write
out how the game actually plays, turn by turn, and see who runs out of bodies first.** This section
records the method, so future contributors can add roles without breaking the table.

### 10.1 The scenario walkthrough

Take a composition, assume plausible-but-not-lucky play, and trace it. Notation is
`village / mafia / neutral`, with the majority threshold noted each day.

**Worked example — the 15-player preset**
(10 village-aligned: Seer, Doctor, Bodyguard, Hunter, Witch + 5 plain · 4 Mafia incl. Alpha · 1 Jester)

```
Night 1   10 / 4 / 1   (15 alive)
   Mafia kill a plain villager. Doctor guessed elsewhere. Seer checks a villager → Not Mafia.
Day 1      9 / 4 / 1   (14 alive, majority 8)
   Village mislynches a plain villager. Seer stays quiet.
Night 2    8 / 4 / 1   (13 alive)
   Mafia target the Seer. Bodyguard is on the Seer → Bodyguard dies instead, Seer lives.
Day 2      7 / 4 / 1   (12 alive, majority 7)
   Seer has a confirmed wolf and claims. Village executes a Mafia.
Night 3    7 / 3 / 1   (11 alive)
   Mafia kill the Seer. Witch spends Life → nobody dies.
Day 3      7 / 3 / 1   (11 alive, majority 6)
   Village executes a Mafia off the Seer's second check.
Night 4    7 / 2 / 1   (10 alive)
   Alpha declares Rampage; the kill pierces the Doctor. A villager dies.
Day 4      6 / 2 / 1   (9 alive, majority 5)
   Village mislynches. Witch is now the only unspent power.
Night 5    5 / 2 / 1   (8 alive)
   Mafia kill the Hunter → Hunter's revenge shot takes a Mafia with them.
Day 5      4 / 1 / 1   (6 alive, majority 4)
   Village executes the last Mafia. → VILLAGE WINS
```

That trace contains **two village mislynches, one Rampage, and a dead Seer** — a distinctly
unlucky village — and the village still wins on turn five with the Hunter doing the closing work.
That tells us the 15-player preset is, if anything, mildly village-favoured, which is correct for a
default. A host who wants it harder removes the Bodyguard; the app's balance meter reflects that
instantly.

**Read the trace for these three things:**

1. **Did either side run out of decisions before running out of players?** If the village's last
   three days are coin flips, add information. If the mafia are dead by Day 2 in every trace, they
   need a body or an ability.
2. **When does parity arrive?** Mafia parity should be *reachable* around 60–70 % of the way
   through the trace, not on Day 2 and not never.
3. **Who ends the game?** A trace that ends with a power role doing something decisive is a good
   sign. A trace that ends with a 50/50 guess between two claimed Seers means the setup produced
   noise instead of information.

### 10.2 The opening vote-margin check

This is §5.2 rule 9, stated as arithmetic, and it's the fastest way to catch a setup that is broken
*by design* rather than by luck:

```
evilBloc      = mafiaCount + voteAlteringAdvantage   // silences count double: −1 village, effectively
majority(n)   = floor(n / 2) + 1

check A (day 1):        evilBloc + 2  ≤  majority(players)
check B (after one mislynch and one full night of kills):
                        evilBloc + 1  ≤  majority(players - 1 - killsPerNight)
```

If **check B** fails, the mafia can simply vote as a bloc and steal an execution before the village
has any information at all. That is not a tense game; that is a broken one. The app runs both
checks live during setup and flags failures in `--warn`.

### 10.3 Crossfire, and why a third killer changes everything

Once a second hostile faction exists (Serial Killer at 15+, per §5.2 rule 7), some night kills land
on *other evil players* instead of the village. This is **crossfire**, and it is a real, quantifiable
gift to the village — the mafia's expected kill rate against villagers drops, and the SK is
strictly worse at guessing than the mafia because the mafia have three known-safe teammates to
exclude and the SK has one.

Rough per-night probability that a lone killer with no information hits a village-aligned player:

```
P(hit village) = villageAlive / (alive - 1 - knownTeammates)
```

At 17 players with 4 mafia and 1 SK, the mafia hit a villager ~`12/12` of the time early (they
exclude each other), while the SK hits a villager ~`12/16` ≈ 75 % — meaning **one night in four**,
the SK does the village's work for it. This is why the balance table can afford *more* mafia at 17+
than the flat 26 % ratio would suggest.

### 10.4 Kingmakers, and how we avoid them

A **kingmaker scenario** is an endgame where a player who cannot possibly win chooses which of two
other factions does. Classic case: one plain villager, one wolf, one Serial Killer, daytime, all
votes equal. The villager cannot win. Whoever they vote for loses. They are, functionally, a
referee — and they will make that call for social reasons, not game reasons.

Kingmaker endings are *tolerable evidence of a balanced setup* (they only occur when the numbers
stayed close), but they are **bad play experiences** and we design against them:

- Rule 15's directional neutrals mean neutrals always have a stake, so fewer players are ever truly
  eliminated from winning.
- The Serial Killer floor of 15 players keeps three-way endgames rare.
- The end-of-game log explicitly labels a kingmaker finish when one occurs, so the table understands
  what happened instead of blaming the person who cast the vote.

### 10.5 The scenario simulator (planned feature)

Because the resolution engine is a **pure function** (§4.2), we can run the whole game headlessly.
This is the automated version of "get a co-host to sanity-check your setup."

```ts
simulate(composition, { runs: 10_000, policy: 'baseline' }) → {
  villageWinRate: number
  mafiaWinRate:   number
  neutralWinRate: Record<NeutralRoleId, number>
  medianDays:     number
  parityDay:      number      // median day mafia parity became reachable
  kingmakerRate:  number
  voteMarginPass: boolean
}
```

**Agent policy (`baseline`)** — deliberately mediocre, because we're testing the *setup*, not the
players:

- Village votes weighted by a crude suspicion score: didn't-vote-with-consensus, claimed late,
  contradicted a confirmed check.
- Confirmed Seer claims are believed 70 % of the time (the other 30 % models a counter-claim).
- Mafia kill known power roles first, otherwise the loudest villager.
- Doctor protects the loudest claimed power role, respecting the no-repeat rule.
- Neutrals pursue their directional condition.

**Acceptance band: village win rate 45–55 %** over 10 000 runs. Any shipped preset outside that band
is a bug in the table, not a taste difference.

**Where it runs:** in a Web Worker, debounced 400 ms after the host changes a role during setup. It
never blocks the UI, and if it hasn't finished, the setup screen falls back to the cheap
`villageEdge` heuristic (§5.3). Results for a given composition hash are cached in `localStorage` —
most hosts play the same handful of setups.

### 10.6 Knowing when the game is over

A game should end **the moment only one outcome remains possible**, not when the last body drops.
Dragging a decided game through three more nights is the most common way a great session ends
badly.

The engine detects *forced* outcomes beyond the strict win conditions in §2:

- Remaining village players have no kill and no protection ability, and mafia ≥ village. → Mafia
  cannot lose. Offer to end.
- Only a Minion remains on the mafia side (no kill source anywhere). → Village cannot lose.
- Every living player's win condition is unreachable except one faction's.

When a forced outcome is detected the app does **not** end the game unilaterally — it surfaces a
quiet prompt: *"This is decided. Call it?"* with the projected winner. The host keeps the gavel.

### 10.7 The postgame

The end-screen log (§6, END) is the app's version of a written postgame, and it's what turns a
finished game into a rematch. It reconstructs, night by night: who acted, who was targeted, what
was saved, what the Seer learned and when, and — crucially — **the moment the game was actually
decided**, highlighted.

Vote history and night targets alone are a thin postgame. The richer part of any mafia game is what
people *believed*, and the app can't see that. So the log leaves room for it: each day has a
free-text slot fed by the host's quick-notes from the Day screen (§7.9), so claims and reads land
in the recap next to the actions that contradicted them.

---

## 11. Sources

- Mekkah, **"Designing and Hosting a Mafia Game,"** *The Smog* Issue 8, Smogon University.
  <https://www.smogon.com/smog/issue8/mafia> — the scenario-walkthrough method (§10.1), the
  vote-margin reasoning (§10.2), crossfire probability (§10.3), the kingmaker analysis (§10.4),
  directional neutral win conditions (§5.2 rule 15), the village-needs-inspection-and-a-bodyguard
  floor (rules 11–12), the restricted-vigilante principle (rule 13), the no-evil-lynchproof
  principle (rule 14), Night 0 as a village balance lever (§1), and the end-early and postgame
  guidance (§10.6–10.7).
- Standard Werewolf / *Les Loups-garous de Thiercelieux* and *Mafia* (Dimitry Davidoff, 1986) role
  canon, as the baseline for §3.
