# ARCHITECTURE.md — Project Remus

How the app is built. Assumes CONTEXT.md's locked decisions (especially **D1** single-device,
**D3** full state machine, **D5** offline PWA, **D7** pure engine).

**Contents**
1. Stack
2. File tree
3. The engine
4. State & persistence
5. Theming
6. PWA & offline
7. Audio
8. Testing
9. Performance budget
10. Deployment

---

## 1. Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15, App Router, TypeScript** | Routing, `next/font` self-hosting, static export. |
| Rendering | **Static (`output: 'export'`)** | No server exists (D1). Deploy anywhere, cache everything. |
| Styling | **Tailwind CSS 4** + CSS custom properties | Utility speed, but all color goes through theme tokens (DESIGN §3.1). |
| State | **Zustand** + `persist` middleware | ~1 kB, no provider tree, trivially serialisable. |
| Engine | **Plain TypeScript, zero deps** | Pure functions (D7) — runnable in a Worker, in Node, in a test. |
| Audio | **Web Audio API**, generated only | No files, no licensing (D2). |
| Icons | **lucide-react** + custom SVG role glyphs | One stroke weight, tree-shakeable. |
| Testing | **Vitest** (engine) + **Playwright** (flows) | Engine is pure → unit tests are fast and total. |

**Deliberately absent:** database, API routes, auth, tRPC/GraphQL, i18n runtime, analytics, error
reporting SaaS, any package that needs a network at runtime.

---

## 2. File tree

```
project-remus/
├── docs/
│   ├── CONTEXT.md            ← why this exists, locked decisions
│   ├── DESIGN.md             ← visual & interaction system
│   ├── GAME_DESIGN.md        ← normative rules, balance, cues, themes
│   ├── ARCHITECTURE.md       ← this file
│   └── ROADMAP.md            ← build order
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js                 ← service worker (precache shell)
│   ├── icons/                ← PWA icons 192/512/maskable
│   └── tex/grain.svg         ← the one texture (DESIGN §9)
├── src/
│   ├── app/
│   │   ├── layout.tsx        ← fonts, theme attribute, viewport, SW registration
│   │   ├── page.tsx          ← Home
│   │   ├── globals.css       ← token definitions, base layer
│   │   ├── setup/
│   │   │   ├── players/page.tsx
│   │   │   ├── theme/page.tsx
│   │   │   ├── roles/page.tsx
│   │   │   ├── seats/page.tsx
│   │   │   └── deal/page.tsx
│   │   ├── play/page.tsx     ← single route; the phase machine renders into it
│   │   └── guide/page.tsx    ← how to host + role reference
│   ├── engine/               ← ⚠ PURE. No React, no browser APIs, no imports from ../app
│   │   ├── types.ts          ← Seat, Role, Phase, Intent, GameState, …
│   │   ├── roles.ts          ← the role catalogue (GAME_DESIGN §3)
│   │   ├── nightOrder.ts     ← the ordered beat table (§4.1)
│   │   ├── resolve.ts        ← resolveNight() — the 10-step pipeline (§4.2)
│   │   ├── winCheck.ts       ← faction + neutral conditions, forced-outcome detection (§2, §10.6)
│   │   ├── balance.ts        ← presets, §5.2 rules, villageEdge, vote-margin checks
│   │   ├── machine.ts        ← phase transitions; the only place phase changes
│   │   ├── deal.ts           ← seeded shuffle & role assignment
│   │   └── sim/
│   │       ├── policy.ts     ← baseline agent behaviour (§10.5)
│   │       └── simulate.ts   ← headless N-run driver
│   ├── themes/
│   │   ├── _template.ts
│   │   ├── millersHollow.ts
│   │   ├── cosaNostra.ts
│   │   ├── hunterDemon.ts
│   │   ├── aeaea.ts
│   │   ├── widowsBay.ts
│   │   ├── signalLost.ts
│   │   ├── salem.ts
│   │   ├── longCourt.ts
│   │   ├── schema.ts         ← runtime validation; build fails on a bad theme
│   │   └── index.ts
│   ├── store/
│   │   ├── gameStore.ts      ← Zustand; wraps engine, persists every action
│   │   └── settingsStore.ts  ← audio on/off, reveal-on-death, timers, reduced motion
│   ├── components/
│   │   ├── SeatChip.tsx
│   │   ├── SeatGrid.tsx
│   │   ├── CueStrip.tsx
│   │   ├── BeatCard.tsx
│   │   ├── RevealPanel.tsx
│   │   ├── PhaseTransition.tsx
│   │   ├── VoteTally.tsx
│   │   ├── BalanceMeter.tsx
│   │   ├── StatusBar.tsx
│   │   └── ui/ (Button, Sheet, Stepper, Toggle)
│   ├── audio/
│   │   ├── cues.ts           ← CueId → default text + SynthPatch
│   │   └── synth.ts          ← Web Audio patches (§7)
│   ├── workers/
│   │   └── sim.worker.ts     ← runs engine/sim off the main thread
│   └── lib/
│       ├── wakeLock.ts
│       ├── haptics.ts
│       └── cn.ts
├── tests/
│   ├── engine/               ← Vitest: resolution, win checks, every §9 edge case
│   ├── balance/              ← asserts every preset simulates into the 45–55% band
│   └── e2e/                  ← Playwright: full 8-player game, refresh-mid-night recovery
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**The one architectural rule:** `src/engine/**` may not import anything outside `src/engine/**`.
Enforced by an ESLint `no-restricted-imports` boundary. Break it and the simulator and the tests
both stop working.

---

## 3. The engine

### 3.1 Core types

```ts
type Faction = 'village' | 'mafia' | 'neutral'
type Phase   = 'setup' | 'night' | 'dawn' | 'day' | 'vote' | 'dusk' | 'end'
type Mark    = 'protected' | 'guarded' | 'blessed' | 'silenced' | 'targeted' | 'revealed'

interface Seat {
  id: string
  name: string
  roleId: RoleId
  alive: boolean
  marks: Mark[]
  charges: Partial<Record<AbilityId, number>>   // witch potions, vigilante ammo, self-heals
  loverId?: string
  execTargetId?: string                          // Executioner
  notes?: string
}

interface Role {
  id: RoleId
  faction: Faction
  tier: 1 | 2 | 3
  nightOrder?: number
  firstNightOnly?: boolean
  ability?: AbilityId
  targeting?: TargetRule            // who this role may legally point at
  minPlayers?: number               // §5.2 gates
}

interface Intent {
  beatId: BeatId
  sourceSeatId: string | null       // null for collective mafia kill
  targetSeatId: string | null
  variant?: 'life' | 'death' | 'rampage'
}

interface GameState {
  version: 2
  seed: string
  themeId: string
  phase: Phase
  dayNumber: number
  nightZero: boolean
  seats: Seat[]
  intents: Intent[]                 // cleared each dawn
  beatIndex: number
  log: LogEntry[]
  settings: GameSettings
  winner?: { faction: Faction; roleId?: RoleId; kingmaker: boolean }
}
```

### 3.2 Pure surface

Everything the engine exposes is `(state, input) => newState` or `(state) => info`:

```ts
deal(config, seed):                        GameState
beatsForNight(state):                      Beat[]
legalTargets(state, beat):                 { seatId: string; disabledReason?: string }[]
recordIntent(state, intent):               GameState        // no resolution yet
resolveNight(state):                       { state: GameState; deaths: Death[]; info: InfoResult[] }
tallyVote(state, votes):                   { executedId?: string; tie: boolean }
execute(state, seatId):                    { state: GameState; deaths: Death[] }
checkWin(state):                           WinResult | null
forcedOutcome(state):                      WinResult | null   // §10.6
```

No `Date.now()`, no `Math.random()` — time and randomness are injected. That's what makes a game
replayable from `{ seed, intents[] }`, which is how the e2e tests and the simulator both work.

### 3.3 Why intents, not immediate mutation

The host taps "wolves kill Ana" at beat 30 and the Witch might revive her at beat 50. If we killed
Ana at beat 30, the Witch beat would need to un-kill her, the Seer's beat-25 result would need
retconning, and Back would be a nightmare. Instead **nothing happens until the night ends**, then
one deterministic pass (GAME_DESIGN §4.2) computes the whole outcome. Back is then just
`intents.pop()`.

---

## 4. State & persistence

```
User taps  →  store action  →  engine fn (pure)  →  new GameState  →  render
                                                          ↓
                                            localStorage['remus:game'] (sync, every action)
```

- **Write on every action.** The state is a few kB; JSON round-trip is sub-millisecond. There is no
  debounce, because the failure mode we're protecting against (phone dies mid-night) is unforgiving.
- **Resume** reads the saved state on Home and offers *"Resume — Night 3."*
- **Versioned.** `state.version` gates migrations; an unmigratable state is discarded with an
  explicit "couldn't restore your game" message rather than crashing into a half-state.
- **Undo** keeps the last 5 `GameState` snapshots in memory (not persisted) for the phase-level
  undo in DESIGN §1 principle 7.
- **Nothing leaves the device.** Ever.

---

## 5. Theming

```
<html data-theme="cosaNostra">
```

`globals.css` defines `:root` structural tokens, then one block per theme overriding the
theme-supplied variables (DESIGN §3.1–3.2). Switching themes = setting one attribute. No re-render
of the tree is required for color; React only re-renders for the *words*.

Theme content (names, narration, cue overrides) comes from `src/themes/*.ts`, validated at build by
`schema.ts`. A theme missing a `roleSkins` entry falls back to the canonical role name; a theme with
a narration line over 35 words **fails the build** (GAME_DESIGN §8.4).

Display fonts are per-theme and loaded via `next/font` with `display: 'swap'`; all are self-hosted
so a cold offline start still gets the right typeface.

---

## 6. PWA & offline

- `manifest.webmanifest`: standalone display, portrait-primary, `background_color: #08080c`,
  maskable icons.
- **Service worker** (`public/sw.js`, no Workbox — it's ~60 lines):
  - Precache the app shell, fonts, icons, and texture on install.
  - **Cache-first** for everything. There is no network content to be stale about.
  - New deploys activate on next cold start; a small "Update ready" pill appears if a new SW is
    waiting.
- **Wake lock** (`navigator.wakeLock`) requested when entering `play`, released on `end` or
  backgrounding. Graceful no-op where unsupported.
- **Install prompt**: captured `beforeinstallprompt`, surfaced once on the End screen — after a
  good game is the only moment anyone wants to install anything.

Target: **fully functional in airplane mode after one visit.**

---

## 7. Audio

Two independent layers:

1. **Cue text** (always on) — `CueStrip` renders `theme.cueOverrides[cueId] ?? cues[cueId].text`.
   This is the product (D2).
2. **Generated sound** (opt-in) — `synth.ts` builds each patch from oscillators, filters, and noise
   buffers. Nothing is fetched. Patches per GAME_DESIGN §7.4.

`AudioContext` is created lazily on the **first user gesture** (iOS requires it) and suspended when
the tab backgrounds. If audio is off, `synth.ts` is never imported — it's a dynamic import behind
the setting, so the bundle doesn't carry it.

---

## 8. Testing

| Layer | Tool | What it covers |
|---|---|---|
| Engine unit | Vitest | Every row of GAME_DESIGN §9 is a named test. Resolution order, protection stacking, cascades, charges. |
| Win conditions | Vitest | All faction/neutral conditions + forced-outcome detection. |
| **Balance** | Vitest + simulator | Every shipped preset simulates 10 000 runs into the **45–55 %** band and passes the vote-margin check. This test is allowed to be slow; it runs in CI, not on save. |
| Theme validity | Vitest | Schema, word caps, contrast ratios per palette. |
| Flows | Playwright | Full 8-player game start→win; refresh mid-night restores the exact beat; back/undo integrity. |
| A11y | Playwright + axe | Contrast, focus order, `aria-live` on read-aloud regions. |

The §9 edge-case table and the test file are meant to be read side by side. If a ruling changes,
both change in the same commit.

---

## 9. Performance budget

| Metric | Budget |
|---|---|
| JS, first load (gzip) | **≤ 120 kB** |
| Largest Contentful Paint, 4G | ≤ 1.8 s |
| Interaction → visual response | ≤ 100 ms |
| Beat → beat transition | ≤ 240 ms (DESIGN §6) |
| Simulator, 10 000 runs | ≤ 800 ms in a Worker (never blocks input) |
| Total installed size | ≤ 2 MB |

The whole app is text, SVG, and math. Anything that pushes past these numbers is something we
probably shouldn't have added.

---

## 10. Deployment

- `next build` with `output: 'export'` → static `out/`.
- Host anywhere static (Vercel, Netlify, Pages, an S3 bucket, a USB stick).
- No env vars. No secrets. No build-time API calls.
- CI: typecheck → lint (including the engine import boundary) → Vitest → balance suite → Playwright
  → build. A failing balance suite blocks the merge, same as a failing type.
