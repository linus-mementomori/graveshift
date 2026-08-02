# ROADMAP.md — Nightfall

Build order. Each phase ends in something you could actually put in front of a table.

---

## ✅ Phase 0 — Foundations *(done)*

- `CONTEXT.md`, `DESIGN.md`, `GAME_DESIGN.md`, `ARCHITECTURE.md`, this file
- Next.js App Router + TypeScript + Tailwind scaffold
- Theme token system with all 7 palettes wired to `data-theme`
- PWA manifest + service worker + offline shell
- Routing skeleton and stub screens for every step of the flow
- Engine **types** and the role catalogue as data (no resolution logic yet)

**Exit:** `npm run dev` boots, you can click through the whole flow, and switching theme visibly
re-skins the app.

---

## Phase 1 — A game you can actually host *(the milestone that matters)*

Core roles only: Villager, Werewolf, Seer, Doctor. One theme: Millers Hollow.

- [ ] `deal.ts` — seeded shuffle, role assignment
- [ ] `RevealPanel` — hold-to-reveal, 3-second cover countdown, no-DOM-until-held
- [ ] `nightOrder.ts` + `BeatCard` — beat walking, legal targets, Back/Repeat
- [ ] `resolve.ts` — the 10-step pipeline for the Tier-1 subset
- [ ] Dawn reveal, Day, nominate → tally → execute
- [ ] `winCheck.ts` — village and mafia conditions
- [ ] Persist on every action; Resume from Home
- [ ] End screen with full role reveal

**Exit criteria:** host a real 8-player game start to finish, on a phone, without touching a
rulebook or reaching for a second device.

---

## Phase 2 — Depth

- [ ] Tier 2 roles: Bodyguard, Hunter, Witch, Vigilante, Mayor, Lycan, Minion, Alpha, Cupid
- [ ] Cascade resolution (Lovers grief, Hunter revenge) until stable
- [ ] Charges system (potions, ammo, self-heal limit, one-shots)
- [ ] `balance.ts` — presets 5–20, the §5.2 rule set, `villageEdge`, vote-margin checks
- [ ] `BalanceMeter` with the plain-language read
- [ ] Night 0 toggle
- [ ] Reveal-on-death setting
- [ ] Every GAME_DESIGN §9 edge case covered by a named test

**Exit:** a 12–15 player game with a full role board resolves correctly, including the nasty
interactions (Rampage vs Bodyguard, Witch reviving a double-target, Hunter killing a Lover).

---

## Phase 3 — Theatre

This is the phase that makes it *fun* rather than merely correct.

- [ ] All 7 themes with full narration, role skins, and cue overrides
- [ ] Theme schema validation in CI (word caps, contrast, missing keys)
- [ ] `CueStrip` with urgency treatments
- [ ] Optional Web Audio synth layer (drone, chime, heartbeat, hit, vote tick)
- [ ] `PhaseTransition` and the death-reveal choreography
- [ ] Host performance coaching tips
- [ ] Wake lock, haptics, install prompt on the End screen

**Exit:** a first-time host reads the app's lines out loud and the table reacts to the *delivery*,
not just the information.

---

## Phase 4 — Rigour

- [ ] `sim/` — baseline agent policy + headless driver
- [ ] `sim.worker.ts` and live simulated win rates in setup
- [ ] Balance test suite: every preset in the 45–55 % band, gating CI
- [ ] Preset retuning wherever the simulator disagrees with the hand-built table
- [ ] Forced-outcome detection → *"This is decided. Call it?"*
- [ ] Kingmaker labelling in the end log
- [ ] Full night-by-night postgame log with the decisive-moment highlight

**Exit:** the balance table is measured rather than asserted, and a decided game ends promptly.

---

## Phase 5 — Polish

- [ ] Tier 3 roles: Jester, Serial Killer, Executioner, Blackmailer, Prince, Gravedigger, Priest, Sleepwalker
- [ ] Guide screen: how to host, role reference, first-timer walkthrough
- [ ] Custom setups: save and name your own compositions
- [ ] Rematch with the same roles, reshuffled
- [ ] Accessibility pass (axe clean, 200 % text scaling, reduced motion)
- [ ] Playwright e2e: full game, refresh-mid-night recovery, undo integrity

---

## Backlog *(not scheduled, not promised)*

- Theme authoring UI (import/export a theme JSON)
- Timer presets per phase with the vote-tick audio
- Print-and-cut physical role cards generated from the current setup
- Additional themes: heist, western, cyberpunk, school-mystery
- Localisation (the narration layer is already data, so this is mostly translation)

## Explicitly rejected

Anything from CONTEXT §5. In particular: online play, room codes, accounts, licensed audio, and
user-scripted rules. If one of these starts to look necessary, that's a signal to re-read
CONTEXT.md, not to open a PR.
