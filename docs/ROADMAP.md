# ROADMAP.md — Project Remus

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

## ✅ Phase 1 — A game you can actually host *(done)*

Shipped past the original Tier-1-only scope: the engine implements **every role in §3**, not just
the core four.

- [x] `rng.ts` — seeded mulberry32 + Fisher–Yates, so a deal is replayable from its seed
- [x] `deal.ts` — seeded shuffle, role assignment, starting charges, Executioner target
- [x] `RevealPanel` — hold-to-reveal, cover-the-screen countdown, no-DOM-until-held, 8s auto-hide
- [x] `machine.ts` — beat walking, legal targets with reasons, Back/Clear, phase transitions
- [x] `resolve.ts` — the full 10-step pipeline, all tiers
- [x] Dawn reveal, Day, vote tally → execute, Dusk
- [x] `winCheck.ts` — village, mafia parity, all four neutral conditions, forced-outcome detection
- [x] Persist on every action; **Resume** from Home
- [x] End screen with full role reveal + night-by-night log

**Verified:** 46 engine assertions covering the §9 edge-case table (rampage vs bodyguard, seer
snapshot rule, jester-by-night, SK mafia-immunity, lover cascade, prince double-execution), plus a
full 6-player game driven start→finish in the browser.

**Still open from §9:** the Blackmailer's silence is applied and blocks voting weight, but "may not
speak" is a table convention the app only flags.

---

## Phase 2 — Depth *(mostly done alongside Phase 1)*

- [x] Tier 2 roles: Bodyguard, Hunter, Witch, Vigilante, Mayor, Lycan, Minion, Alpha, Cupid
- [x] Tier 3 roles: Jester, Serial Killer, Executioner, Blackmailer, Prince, Gravedigger, Priest, Sleepwalker
- [x] Cascade resolution (Lovers grief, Hunter revenge) until stable
- [x] Charges system (potions, ammo, self-heal limit, one-shots)
- [x] `balance.ts` — presets 5–20, the §5.2 rule set, `villageEdge`, vote-margin checks
- [x] `BalanceMeter` with the plain-language read
- [x] Night 0 toggle
- [x] Reveal-on-death setting
- [ ] Move the §9 edge-case assertions into a real runner (Vitest) instead of a scratch script

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
