# CONTEXT.md — Graveshift

> The single source of truth for *why this project exists* and *what decisions are locked*.
> Read this first. Every other doc assumes it.

---

## 1. One-line pitch

**Graveshift** is an installable web app that turns any phone into a professional Mafia/Werewolf
game master — it handles the rules, the roles, and the night order, and it tells the human host
exactly what to say, what to play, and what to do at every beat.

---

## 2. The problem

Social deduction games are wonderful and hosting them is miserable.

| Pain | What actually happens at the table |
|---|---|
| **Setup tax** | 10 minutes of shuffling cards, arguing over role counts, someone sees a card. |
| **Bookkeeping** | The host holds 12 secret identities in their head and forgets who the Doctor saved. |
| **Rules disputes** | "Does the Seer see the Lycan as a wolf?" — 5 minutes of phone-googling kills momentum. |
| **The host never plays** | Someone has to sit out and narrate, and it's always the same person. |
| **Dead air** | Night phases in silence feel like a spreadsheet. Great hosts add music; most hosts don't. |
| **Same game every time** | Vanilla Werewolf gets stale after three sessions. |

Existing apps mostly solve #2 and stop there. Graveshift solves the **theatre** of it — the part
that makes people say "one more round."

---

## 3. Target user

**Primary: The Host.** 16–35, hosting 6–20 friends at a party, dorm, retreat, family holiday, or
club night. They may have never hosted before. They are holding a phone in one hand and a drink in
the other. The room is dim and loud.

**Secondary: The Players.** They never touch the app (see decision D1). Their experience is
entirely mediated by what the host says and plays. Our design target for them is *atmosphere*, not
UI.

**Design consequences:**
- Every host action must be doable **one-handed, in the dark, at a glance.**
- Text the host reads aloud must be **scannable in one breath** — short lines, big type, no walls.
- The app must work with **zero signal** (basements, cabins, airplane mode).

---

## 4. Locked decisions

These are settled. Changing one is a re-plan, not a tweak.

| ID | Decision | Rationale |
|---|---|---|
| **D1** | **Single device, host-only.** No player phones, no room codes, no accounts, no server. | Kills the entire backend, auth, and realtime surface. Players looking at phones is the *opposite* of what this game is for. |
| **D2** | **Audio is a cue, not a file.** The app tells the host *what to play or perform*; it never ships copyrighted music. | Zero licensing risk, tiny bundle, and it makes the host the performer — which is the point. A small optional Web Audio synth layer (drones, stingers, timer ticks) is permitted because it generates sound rather than plays recordings. |
| **D3** | **Full state machine.** The app owns alive/dead, night action resolution, protection, win conditions, and phase transitions. The host taps; the app decides. | This is the core value prop. A "guided script" app is just a PDF. |
| **D4** | **Themes are pure content.** A theme changes names, flavour text, narration, color, and audio cues — never the rules. | One rules engine, infinite themes. New theme = one JSON-ish TS file, no code. |
| **D5** | **PWA, offline-first.** Installable, works fully offline after first load, state survives a refresh or a crash. | The party is in a basement with no bars and someone will definitely lock the phone mid-night phase. |
| **D6** | **No analytics, no tracking, no network calls at runtime.** | Nothing to send. Privacy is free when you have no server. |
| **D7** | **The resolution engine is a pure function.** No I/O, no randomness outside an injected seed, no UI coupling. | Makes the whole game headlessly simulatable — which is how we validate balance (GAME_DESIGN §10.5) instead of guessing. Also makes it trivially testable. |
| **D8** | **Balance is measured, not asserted.** Every shipped preset must simulate to a 45–55 % village win rate and pass the opening vote-margin check. | Borrowed from forum-mafia design practice: a setup can be broken *by design* long before luck gets involved, and arithmetic catches it. |

---

## 5. Non-goals (explicitly out of scope)

- ❌ Online/remote play, matchmaking, or lobbies
- ❌ Player accounts, profiles, ELO, leaderboards
- ❌ Voice recognition or auto-transcription of the table
- ❌ Shipping licensed music or voice-acted narration
- ❌ Custom role *scripting* by users (theme authoring is fine; new rules are not)
- ❌ Monetization of any kind in v1

---

## 6. Success criteria

A session is successful if:

1. A **first-time host** goes from opening the app to "Night falls…" in **under 90 seconds.**
2. The host **never opens a rulebook** during play.
3. The host **never has to remember anything** — the app is the memory.
4. At least once per game, a player reacts to an **audio/theatre cue**, not just to information.
5. When the game ends, the table says **"again."**

Anti-criteria — we have failed if:
- The host is scrolling to find the next button.
- The host has to squint or use two hands.
- A rules edge case produces a state the app can't resolve.

---

## 7. Product shape

```
 ┌─ SETUP ───────────────┐   ┌─ PLAY ────────────────┐   ┌─ END ─────────────┐
 │ 1. Player count       │   │ Night  → role prompts │   │ Winner reveal     │
 │ 2. Theme pick         │──▶│ Dawn   → death reveal │──▶│ Full role reveal  │
 │ 3. Role balance       │   │ Day    → discussion   │   │ Game recap / log  │
 │ 4. Name the players   │   │ Vote   → execution    │   │ Rematch (1 tap)   │
 │ 5. Deal roles (pass)  │   │ ↑ loop until win      │   │                   │
 └───────────────────────┘   └───────────────────────┘   └───────────────────┘
```

Everything in **SETUP** is a choice. Everything in **PLAY** is a prompt — the host is told what to
say, what to play, and who to tap. That asymmetry is the product.

---

## 8. Theme system in one paragraph

The user picks a **skin**, not a ruleset. *Werewolves of Millers Hollow* (folk horror),
*Mafia* (noir crime), *Hunter × Demon* (anime), *Olympus Betrayed* (myth), *Deep Space Anomaly*
(sci-fi horror), *Salem 1692* (historical), *The Coven* (dark fantasy). Each supplies: display name,
palette, a title/subtitle, a name for each rule-role (Werewolf → *Made Man* → *Oni* → *Titan-blooded*),
narration lines for every phase, victory copy, and audio cue text (*"play low strings"* vs
*"play a distant siren"*). The engine underneath is identical in all of them.

---

## 9. Vocabulary (use these words consistently in code, docs, and UI)

| Term | Meaning |
|---|---|
| **Host** | The one person holding the device. Not a player. |
| **Seat** | A player position: `{ id, name, roleId, alive, marks[] }`. We say "seat" in code, "player" in UI. |
| **Role** | A rules-level ability set (`werewolf`, `seer`, `doctor`…). Theme-agnostic. |
| **Skin** | A theme's presentation of a role (name, flavour, icon, color). |
| **Faction** | `village` \| `mafia` \| `neutral`. Win conditions are evaluated per faction. |
| **Phase** | One step of the loop: `night`, `dawn`, `day`, `vote`, `dusk`, `end`. |
| **Beat** | One atomic host instruction inside a phase (e.g. "Wolves, open your eyes"). |
| **Cue** | A performance instruction attached to a beat: audio, lighting, or vocal delivery. |
| **Mark** | A transient per-night flag on a seat (`targeted`, `protected`, `roleblocked`, `revealed`). |
| **Night order** | The fixed integer sequence in which roles act. Lower acts first. |
| **Resolution** | The pure function that turns a night's marks into deaths. |

---

## 10. Tech stance

- **Next.js (App Router) + TypeScript**, static export–friendly, deployable to any static host.
- **Tailwind CSS** with CSS-variable theme tokens so a theme swap is a single attribute change.
- **Zustand** (or a reducer + context) for game state, persisted to `localStorage` on every action.
- **Web Audio API** for optional generated sound. No audio assets.
- **No database. No API routes. No auth.** If a feature needs a server, it's out of scope (see D1).

---

## 11. Risks & how we blunt them

| Risk | Mitigation |
|---|---|
| Role balance is wrong and games feel unfair | Ship a tuned balance table per player count (see GAME_DESIGN §5), plus a live "difficulty read" during setup. |
| Host loses their place mid-phase | Every screen shows *phase · night number · who's left*. A "repeat that line" button on every beat. |
| Phone locks / app is backgrounded | Persist after every action; restore straight into the exact beat. Optional wake-lock during play. |
| Too many roles overwhelm a new host | Roles are tiered (Core / Standard / Advanced). Default setup uses Core only. |
| Themes become a maintenance burden | Themes are data validated against a schema; a broken theme fails at build, not at the party. |
| Reading long narration kills pace | Hard cap: no beat script exceeds ~35 words. Enforced in review. |

---

## 12. Current status

**Phase 0 — documentation + scaffold.** Docs in `docs/`, a running Next.js PWA skeleton with theme
tokens, routing, and stubbed screens. The rules engine is typed but not yet implemented.
See `docs/ROADMAP.md` for what lands next.
