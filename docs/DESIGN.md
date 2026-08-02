# DESIGN.md — Nightfall

The visual and interaction system. Written for a very specific context: **one thumb, a dark room,
a loud party, and a host who is also holding a drink.**

**Contents**
1. Design principles
2. Layout system
3. Color & theme tokens
4. Typography
5. Components
6. Motion
7. Screen-by-screen specs
8. Accessibility
9. Icon & illustration direction

---

## 1. Design principles

**1 · Dark by default, always.**
There is no light mode. A white screen at a night-time party blinds the host and lights up the
room. Backgrounds live between `#0a0a0f` and `#16161f`.

**2 · One decision per screen.**
If the host has to choose between two things of equal weight, the screen is wrong. Every play
screen has exactly one primary action, and it's the biggest thing on it.

**3 · Thumb-zone first.**
Everything tappable during play sits in the **bottom 45 %** of the viewport. The top is for
information you read; the bottom is for things you touch. Nothing important within 24 px of the top
edge.

**4 · Read-aloud text is a first-class typographic object.**
Lines the host speaks are set at 22–30 px, generous leading, high contrast, never truncated, never
inside a scroll container. If it doesn't fit, the line is too long — fix the copy, not the type.

**5 · Theme is a costume, not a redesign.**
Layout, spacing, and component structure are identical across all themes. Only color, accent
texture, iconography, and words change. A host who learns one theme knows them all.

**6 · Nothing moves fast.**
Motion is slow and heavy — 200–400 ms, ease-out. This is a game about dread. Bouncy spring
animations belong in a different app.

**7 · Never trap the host.**
Every screen has Back. Every night action is undoable before resolution. Every phase can be
rewound once. Mistakes at 1 a.m. are guaranteed; punishing them is a design failure.

---

## 2. Layout system

### 2.1 Spacing scale (4 px base)

`0 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`

Tailwind defaults map cleanly; do not invent intermediate values.

### 2.2 Viewport targets

| Target | Width | Notes |
|---|---|---|
| Small phone | 360 px | Must work. iPhone SE / small Android. |
| **Design baseline** | **390 px** | All specs below assume this. |
| Large phone | 430 px | Content max-width 480 px, centred. |
| Tablet / desktop | ≥ 768 px | Centred 480 px column on a vignette background. **Not** a redesign — this app is a phone app that happens to open on a laptop. |

### 2.3 The play frame

Every in-game screen uses the same three-band structure:

```
┌──────────────────────────────┐
│  STATUS BAR      56px        │  phase · night N · 7 alive · menu
├──────────────────────────────┤
│                              │
│  STAGE           flex-1      │  narration, cue strip, info
│                              │
├──────────────────────────────┤
│  ACTION DECK     auto        │  targets grid + primary button
│                    (bottom)  │  safe-area padded
└──────────────────────────────┘
```

- **Status bar** — always visible, never scrolls. Left: phase + night number. Centre: alive count.
  Right: menu (undo, settings, end game).
- **Stage** — the only scrollable region, and it should rarely need to scroll.
- **Action deck** — pinned to the bottom, `padding-bottom: env(safe-area-inset-bottom)`.

### 2.4 Touch targets

Minimum **48 × 48 px**, **56 px** for anything used during Night. Minimum 8 px between adjacent
targets — 12 px in the seat grid, because the host is tapping in the dark.

---

## 3. Color & theme tokens

### 3.1 Architecture

All color goes through CSS custom properties on `:root`, swapped by a `data-theme` attribute on
`<html>`. No component ever hard-codes a hex value.

```css
:root {
  /* structural — identical in every theme */
  --bg-void:      #08080c;
  --bg-base:      #0e0e14;
  --bg-raised:    #16161f;
  --bg-overlay:   #1e1e2a;
  --border-subtle: rgb(255 255 255 / 0.08);
  --border-strong: rgb(255 255 255 / 0.16);

  --text-primary:   #f2f2f7;
  --text-secondary: #a8a8b8;
  --text-muted:     #6e6e80;

  /* semantic — constant across themes */
  --danger:  #e5484d;   /* death, mafia, execution */
  --safe:    #46a758;   /* protection, survival, village win */
  --info:    #4b9ce0;   /* investigation results */
  --warn:    #f5a524;   /* balance warnings, timers */

  /* theme-supplied — overridden per theme */
  --accent:        #b5453f;
  --accent-soft:   #6b2724;
  --accent-glow:   rgb(181 69 63 / 0.28);
  --phase-night:   #1a1a2e;
  --phase-day:     #2a2418;
  --texture:       url('/tex/grain.svg');
}
```

### 3.2 Theme palettes

| Theme | `--accent` | `--accent-soft` | `--phase-night` | `--phase-day` | Feel |
|---|---|---|---|---|---|
| **Millers Hollow** | `#b5453f` blood red | `#6b2724` | `#141420` | `#2a2418` | Woodsmoke, dried blood, lantern |
| **Cosa Nostra** | `#c9a227` brass | `#6b5410` | `#0f1218` | `#241f1a` | Rain, brass, cigarette smoke |
| **Hunter × Demon** | `#7b4dff` violet | `#3a1f80` | `#12101f` | `#1f1a2e` | Neon, ink, moonlight |
| **Olympus Betrayed** | `#e0b64a` gold | `#7a5f18` | `#101318` | `#2b2618` | Marble, gold leaf, storm |
| **Signal Lost** | `#3fb5b0` cyan | `#1a5654` | `#0a1214` | `#16211f` | Cold, sterile, humming |
| **Salem, 1692** | `#c98a3f` candle | `#6b4419` | `#12100c` | `#241d14` | Tallow, wool, whisper |
| **The Long Court** | `#5fa8d3` frost | `#234a63` | `#0c1016` | `#182028` | Frost, silver, cruelty |

### 3.3 Phase tinting

The background shifts with the phase — subtle, but the host feels it:

| Phase | Background | Vignette | Accent behaviour |
|---|---|---|---|
| Night | `--phase-night` | strong, 60 % opacity | accent glows softly, 2 % breathing pulse |
| Dawn | gradient `--phase-night → --phase-day` over 1200 ms | fading | still |
| Day | `--phase-day` | light | flat, no glow |
| Vote | `--bg-void` | none — hard, flat, cold | accent only on the tally |
| End | winner's color washes the whole frame | radial from centre | full saturation |

### 3.4 Contrast floor

- Body text on any theme background: **≥ 4.5:1**
- Read-aloud text: **≥ 7:1** (it's read at a glance, in the dark, possibly by someone tipsy)
- Accent on background: **≥ 3:1** for anything load-bearing
- Never encode meaning in color alone — alive/dead also differ in opacity, strikethrough, and icon.

---

## 4. Typography

### 4.1 Families

| Role | Font | Why |
|---|---|---|
| **Display** (titles, phase names, role names) | `Libre Baskerville`, italic 700 | Superseded 2026-08: the per-theme-category font swap (Cinzel/Bebas Neue/Zen Kaku/Space Grotesk) was never implemented — every theme shared one `--font-display` token. Replaced with a single italic serif, matched to the reference VHS-horror mock (`Werewolves Game Website/`), applied uniformly across all seven themes. |
| **Read-aloud** | `Libre Baskerville` | Same family as Display — matches the reference's blockquote treatment. Still warm and legible at `speak-lg` sizes; the italic reads as *spoken* the same way the old serif did. |
| **UI / body** | `Courier Prime` (monospace) | Typewriter/VHS-readout feel from the reference. Tighter than Inter at small sizes but still clears the §3.4 contrast floor — it carries labels, captions and buttons, not paragraphs. |
| **Numeric** | `Courier Prime` with `tabular-nums` | Vote tallies must not jitter. |

All fonts loaded via `next/font/google` (`Libre_Baskerville`, `Courier_Prime`) in `app/layout.tsx` — no runtime request once built, works offline (Decision D5).

### 4.4 Atmosphere (added 2026-08)

Ported from the Figma Make reference in `Werewolves Game Website/` — a VHS/horror mock with glow
type, scanlines and floating embers. Layered onto the existing token system so every theme keeps it,
not just Millers Hollow:

- **VHS scanlines** — `.vhs-scan` on `<body>`, a fixed repeating-gradient overlay at `z-index: 50`,
  `pointer-events: none`. Purely atmospheric, sits above content, never blocks touches.
- **Glow** — `.glow-sm` / `.glow` / `.glow-lg`, text-shadow stacks built on `currentColor` so they
  re-skin with `--accent` automatically. Used sparingly: hero title, section headers, the setup
  player-count number, the selected theme card's name. Never on body copy — glow is atmosphere, the
  §3.4 contrast floors still govern legibility.
- **Flicker / pulse** — `.flicker` (a lamp on a bad wire, 6 s loop) and `.pulse-glow` (2.5 s
  breathing glow, replaces the plainer `breathe` opacity-only pulse on the home wordmark).
- **Ember particles** — `<Particles />`, ~18 CSS-animated dots drifting upward, colored via
  `var(--accent)`, mounted once in `ThemeRoot`. Renders nothing under
  `prefers-reduced-motion: reduce`.
- **`.card-atmo`** — gradient surface (`--bg-raised → --bg-overlay`) with a faint scanline texture
  and a hover lift, replacing flat `--bg-raised` boxes on theme cards, role rows, seat targets and
  the deal-list rows. Mirrors the reference's `.role-card`.

All of the above degrade to a flat cross-fade under `prefers-reduced-motion` per §6 — nothing here
is load-bearing for reading the screen, only for mood.

**Bug found and fixed while doing this pass:** the old `@theme inline` block in `globals.css`
registered a `--color-base` token, which collided with Tailwind's own built-in `text-base` (the
1rem font-size utility) — Tailwind resolved `text-base` to `color: var(--bg-base)` instead of a
font size. Since `--bg-base` and `--bg-void` are nearly the same near-black, this was invisible on
filled buttons but made secondary-button text and the theme-card titles render nearly the same
color as their own background. The bridge block was unused elsewhere (every component already used
`bg-[var(--bg-raised)]`-style arbitrary values, never the shorthand classes it generated), so it was
removed outright rather than renamed.

### 4.2 Scale

| Token | Size / line-height | Weight | Used for |
|---|---|---|---|
| `display-xl` | 44 / 48 | 600 | Phase title ("NIGHT ONE"), end screen |
| `display-lg` | 32 / 38 | 600 | Screen titles, role name on reveal |
| **`speak-lg`** | **28 / 40** | **450** | **Primary read-aloud line** |
| **`speak-sm`** | **20 / 32** | **450** | **Secondary read-aloud line** |
| `body` | 16 / 24 | 400 | UI copy |
| `label` | 14 / 20 | 500 | Seat names, buttons |
| `caption` | 12 / 16 | 500, `0.06em` tracking, uppercase | Cue strip, status bar, meta |

### 4.3 Read-aloud treatment

```
        ┌ 3px left rule in --accent
        │
        │  «Werewolves, open your eyes.
        │   Choose your prey.»
        │
        └ Fraunces, speak-lg, --text-primary, max-width 34ch
```

- Wrapped in `« »` so the host instantly knows it's spoken text, not UI text.
- `text-wrap: balance` to avoid orphan words.
- Never truncated. Never inside a scrolling container. If it overflows on a 360 px screen, the copy
  gets rewritten.

---

## 5. Components

### 5.1 `SeatChip`

The most-used component in the app. A player in the seat grid.

```
┌──────────────┐   States:
│  ◉           │   · default   border-subtle, bg-raised
│  Ana         │   · selected  accent border 2px + accent-glow shadow
│  Villager?   │   · disabled  40% opacity, no shadow, reason on long-press
└──────────────┘   · dead      50% opacity, name struck through, ✕ badge
                   · silenced  🔇 badge, name in text-muted
                   · marked    small colored dot: protected / targeted / revealed
```

- Grid: 2 columns ≤ 8 players, **3 columns** at 9–20 (the common case), 12 px gap.
- Height 72 px, radius 12 px.
- Long-press (400 ms) opens a seat detail sheet: role if known to the host, notes, history.
- Tap feedback: 60 ms scale to 0.97 + a light haptic (`navigator.vibrate(10)`).

### 5.2 `CueStrip`

A pinned bar at the top of the Stage during play.

```
┌────────────────────────────────────────┐
│ ♪  play a low drone · dim the lights  ▸│
└────────────────────────────────────────┘
```

- Background `--accent-soft` at 22 % opacity, 1 px accent border, radius 8 px.
- `caption` type. Never more than two lines.
- Tapping expands to full guidance + a **▶ Play generated sound** button if `SynthPatch` exists.
- Urgency changes the treatment: `ambient` = static · `accent` = single 300 ms fade-in glow ·
  `hit` = one sharp 120 ms flash on mount.

### 5.3 `BeatCard`

The container for a single night beat. Vertical stack:

```
CueStrip
  ↓ 24px
RoleBadge  (icon + themed role name, accent, caption-uppercase)
  ↓ 12px
Read-aloud line (speak-lg)
  ↓ 8px
Sub-instruction (speak-sm or body, text-secondary)
  ↓ 24px
── divider ──
  ↓ 16px
Seat grid  /  or  hold-to-reveal result panel
  ↓ 16px
[ ↺ Repeat ]  [ Skip / No target ]
──────────────────────────
[   Confirm & continue   ]  ← primary, full width, 56px
```

### 5.4 `RevealPanel` (hold-to-reveal)

Used for the role deal and for investigation results. Never shows secret info on a plain tap.

- Resting state: a blurred/frosted card reading **"Hold to reveal"** + a warning: *"Cover the
  screen."*
- 3-second countdown before the hold arms — gives the player time to turn away from the table.
- Content shows only while the finger is held down (`onPointerDown` → `onPointerUp`). Release =
  instant hide, no animation, no lingering frame.
- Screenshot-ish protections: content is not rendered to the DOM until the hold begins.
- Auto-hides after 8 seconds regardless.

### 5.5 `PhaseTransition`

Full-bleed interstitial between phases. 900 ms total.

- Background cross-fades to the new phase tint.
- Phase title (`display-xl`) fades up 12 px, letter-spacing animating from `0.3em → 0.12em`.
- Optional single line of theme narration underneath.
- Tappable to skip — always. Never trap the host in an animation.

### 5.6 `VoteTally`

- Row per nominated seat: name, a horizontal bar in `--accent`, tabular count.
- Bars animate width on each vote change (250 ms ease-out).
- Majority threshold drawn as a dashed vertical line with a `caption` label.
- When a bar crosses the threshold, it switches to `--danger` and pulses once.
- Mayor's double vote renders as `2×` badge next to the name.

### 5.7 `BalanceMeter` (setup)

- A horizontal track: red (mafia-favoured) → amber (balanced) → green (village-favoured).
- A marker slides to the computed `villageEdge` score (GAME_DESIGN §5.3), 300 ms ease-out.
- One line of plain-language copy underneath. Never blocks the host — advice, not a gate.
- **Two-stage fidelity.** The heuristic score paints immediately; when the background simulator
  (GAME_DESIGN §10.5) returns, the marker eases to the true simulated win rate and the caption
  upgrades from *"Balanced"* to *"Village wins 51% of simulated games."* A small `caption` spinner
  marks the in-between state — never a blocking loader.
- **Vote-margin failure is the one loud warning.** If the opening vote-margin check (§10.2) fails,
  the meter turns `--danger` and shows: *"The wolves can out-vote the town on day one."* Still not
  a hard block — but it is the only balance message that gets a full-width banner.
- **Night 0 toggle** lives directly beneath the meter, since it is the cheapest fix the host has.
  Toggling it re-runs the simulation and the marker visibly moves — which teaches the host what the
  setting actually does far better than a tooltip would.

### 5.8 Buttons

| Variant | Look | Use |
|---|---|---|
| **Primary** | Filled `--accent`, `--bg-void` text, 56 px, radius 12 px, full width | The one action on the screen |
| **Secondary** | `--bg-raised`, `--border-strong` 1 px, `--text-primary` | Repeat, skip, back |
| **Ghost** | Transparent, `--text-secondary` | Menu items, tertiary |
| **Danger** | `--danger` fill | Execute, end game, delete |

All buttons: `active:scale-[0.98]`, 120 ms. Disabled = 40 % opacity **and** a reason on tap
("Doctor already protected Ana last night") — never a dead button with no explanation.

---

## 6. Motion

| Interaction | Duration | Easing | Notes |
|---|---|---|---|
| Button press | 120 ms | `ease-out` | scale 0.98 |
| Seat select | 160 ms | `ease-out` | border + glow |
| Beat → beat | 240 ms | `ease-in-out` | slide 16 px + fade |
| Phase transition | 900 ms | `cubic-bezier(.2,.8,.2,1)` | full-bleed |
| Death reveal | 600 ms | `ease-out` | fade in, then a 120 ms shake on the name |
| Victory | 1400 ms | staged | wash → banner → roles cascade at 60 ms stagger |
| Night breathing | 4 s loop | `ease-in-out` | accent glow 100 % ↔ 92 % opacity |

**`prefers-reduced-motion: reduce`** → all of the above collapse to 120 ms cross-fades. The
breathing loop stops entirely. Nothing is lost but atmosphere.

---

## 7. Screen-by-screen specs

### 7.1 Home

```
        NIGHTFALL              display-xl, accent glow
   the game master in your pocket   caption, text-muted

   ┌────────────────────────┐
   │   ▶  New game          │  primary, 56px
   └────────────────────────┘
   ┌────────────────────────┐
   │   ↻  Resume  (Night 3) │  secondary — only if saved state exists
   └────────────────────────┘

   How to host   ·   Roles   ·   Settings     ghost row
```

Background: current theme's night tint with a slow-drifting grain texture. The wordmark breathes.

### 7.2 Setup — player count

- Giant number, `display-xl` at 72 px, centred.
- `−` / `+` buttons at 64 px either side (thumb-friendly, no tiny steppers).
- A quick-pick row: `6 · 8 · 10 · 12 · 15`.
- Below: live composition preview — *"2 wolves · 3 power roles · 3 villagers"*.

### 7.3 Setup — theme

- 2-column card grid. Each card: themed background swatch, display font name, one-line tagline.
- Selecting a card **immediately re-skins the entire app** — including this screen. That moment is
  the demo; make it feel good (240 ms cross-fade of all tokens).
- Long-press a card → preview sheet showing that theme's role names and a sample narration line.

### 7.4 Setup — roles

- Grouped by faction: Mafia / Village / Neutral, each a collapsible section.
- Each role: icon, themed name, `+`/`−` stepper, one-line ability summary.
- `BalanceMeter` pinned above the action deck, live-updating.
- Warnings appear inline in `--warn`, never as a blocking modal.
- Secondary button: **Reset to recommended.**

### 7.5 Setup — seats

- Vertical list of text inputs, auto-focus advancing on Enter.
- Drag handles to reorder to match the physical circle.
- "Auto-name" fills `Player 1…n` instantly for hosts who don't care.

### 7.6 Setup — the deal

Full-bleed, one player at a time, no chrome:

```
        Pass the phone to
             ANA               display-lg

    ┌──────────────────────┐
    │                      │
    │   Hold to reveal     │   RevealPanel, frosted
    │   cover the screen   │
    │                      │
    └──────────────────────┘

    [  Ana has seen it  →  ]   primary
```

Progress dots at the bottom. No back-navigation into an already-dealt seat (it would leak).

### 7.7 Night

`BeatCard` in the play frame. Status bar reads `NIGHT 2 · 9 alive`.

### 7.8 Dawn

- Phase transition, then the stage holds only the death reveal — deliberately sparse.
- If someone died: name in `display-lg`, `--danger`, with the themed death flavour beneath, and
  (if reveal-on-death is on) the role in a small badge.
- If nobody died: a single centred line and a lot of empty space. Emptiness *is* the design.

### 7.9 Day

- Optional timer as a thin progress bar under the status bar (not a big countdown — that creates
  anxiety about the wrong thing).
- Seat grid with per-seat note fields.
- Primary: **Call the vote.**

### 7.10 Vote

- Nominate mode → tap seats to add them to the ballot.
- Tally mode → `VoteTally` with `+`/`−` per row.
- Primary turns to `--danger` and reads **Execute [Name]** once a majority exists.

### 7.11 End

- Winner wash + banner.
- Every seat listed with true role, cascading in at 60 ms stagger. Winners get an accent glow.
- Collapsible night-by-night log.
- Two buttons: **Rematch (same roles)** · **New game**.

---

## 8. Accessibility

- **Contrast:** floors in §3.4, verified per theme in CI with a contrast script.
- **Reduced motion:** honoured everywhere (§6).
- **Screen readers:** read-aloud text is `role="region"` with `aria-live="polite"` so a
  low-vision host hears the new line when a beat changes. Seat chips announce state:
  *"Ana, alive, not selected."*
- **Dynamic type:** all sizes in `rem`; the layout holds to 200 % text scaling. No fixed-height
  text containers.
- **Colorblind:** alive/dead never rely on color — opacity, strikethrough, and an icon carry it.
  Faction results use both color and an explicit word ("MAFIA" / "NOT MAFIA").
- **One-handed:** every play-screen control sits in the bottom 45 %.
- **Wake lock:** requested during play so the screen doesn't sleep mid-night phase.

---

## 9. Icon & illustration direction

- **Icons:** single-weight line icons, 1.5 px stroke, 24 px grid, rounded caps. Lucide as the base
  set; theme-specific role icons drawn to match that weight so nothing looks bolted on.
- **Role icons:** one silhouette per role per theme. Simple enough to read at 20 px inside a
  `SeatChip`.
- **Texture:** a single tiling SVG grain overlay at 3–6 % opacity over every background. It's the
  cheapest way to stop a dark app from looking like an empty div.
- **No photography. No stock illustration. No AI-slop portraits.** Silhouettes, symbols, and type.
  This keeps the bundle tiny, the themes coherent, and the mood ambiguous — which is the point of a
  game where you don't know who anyone is.
