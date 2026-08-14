# TEST_REPORT.md: first full audit

August 2026. 83 tests, 4 suites, all passing. `npm test`, typecheck and build all clean.

Before this the repo had **no tests**. ROADMAP claimed *"Verified: 46 engine
assertions"*, but its own backlog admitted they lived in a scratch script that
was never committed, and the balance simulator D8 depends on was still listed as
a planned feature. Nothing was actually verified in-repo.

---

## 1. What now exists

| File | Covers |
|---|---|
| `tests/engine.test.ts` | dealing, seeded determinism, the vote rule, death bookkeeping, win conditions, night order, preset sanity, engine purity |
| `tests/themes.test.ts` | content integrity, grammar of death lines, duplicate detection, story alignment |
| `tests/narration.test.ts` | no-repeat guarantee, determinism, safe fallbacks |
| `tests/playthrough.test.ts` | full headless games at all 16 table sizes |
| `tests/simulate.ts` | the headless driver (not a test: the tool the others use) |
| `scripts/simrun.ts` | prints the balance table on demand |

Run with `npm test`. Balance table: `npx tsx --tsconfig tsconfig.json scripts/simrun.ts`.

---

## 2. Bugs found and fixed

**Twitter/X card image was a 404 in production.** `layout.tsx` hardcoded
`/og.png`, a file this project has never built. Next's `opengraph-image.tsx`
convention overrode `og:image` but not `twitter:image`, so OG looked correct
while X was broken. Fixed by deleting the hand-named image so both tags come
from the generated card.

**The OG image was served as `text/plain`.** `out/opengraph-image` has no file
extension, so Netlify cannot infer a MIME type. Every scraper checks
`Content-Type` before rendering a preview, so the card failed in production
while working perfectly in local dev. Fixed with `public/_headers`, which also
corrects the manifest (`application/octet-stream`) and pins `/sw.js` to
`no-cache` so an edge cache cannot resurrect the stale-worker bug.

**The favicon was effectively invisible.** Only 10% of its pixels were opaque at
16px: partly the transparent background, mostly that it was a photorealistic
glass render, which is soft low-alpha detail that dissolves when shrunk. Redrawn
as a solid grave-marker silhouette, now 40% coverage and legible at 16px.

**Mixed apostrophes.** Seven curly `’` against straight `'` everywhere else.

**Two grief lines referred to nobody.** "Some bonds do not negotiate" left the
player no idea whose death it described.

**The execution death had no flavour at all** (fixed earlier in the same pass).
Every theme carried a `deathFlavour.execution` line and none was ever rendered.

---

## 3. The open finding: D8 is not met

D8 promises every shipped preset simulates to a 45-55% village win rate. Now
that a simulator exists, that is measurable for the first time:

| Table | Village win % | Verdict |
|---|---|---|
| 5, 9, 10 | 46-52% | on target |
| 7, 8, 11 | 30-39% | below |
| 12-16 | 23-37% | well below |
| **18, 19** | **11%, 14%** | **severely below** |

Two independent methods agree. The app's own `balanceRead` labels 14p, 18p and
19p "Brutal", and those sit among the worst simulated results. The Jester also
wins 20-27% of games from 12 players up, which is high for a neutral.

**Caveat.** The bot is deliberately average: the village converges on one
nominee and acts on Seer reads, the mafia bloc vote. An earlier version had the
village vote at random and produced a meaningless 0-25%, because a village that
splits while the mafia concentrate loses every setup regardless of composition.
These numbers are directional, not tuning targets.

**Nothing was retuned.** Preset balance is a game-design decision, and ROADMAP
already carries it as future work. `playthrough.test.ts` pins the current
numbers so a retune shows up as a deliberate, visible change rather than drift.

---

## 4. Where the tests were wrong, not the content

Twice an assertion accused good writing:

- Aeaea's *"followed their bound heart"* does name the partner; the regex was
  too narrow.
- Signal Lost's *"the link held"* is correct, because that theme's Cupid is the
  **Pair-Bond Protocol**. "Link" is its word for the bond.

Both assertions were widened. Worth remembering when adding content rules: a
theme's own vocabulary counts as alignment.

---

## 5. Still open

- **Preset retuning** for 12+ tables, if the numbers above are accepted.
- **`/themes/`** is crawlable, reuses the homepage `<title>`, and shows one
  sentence to logged-out visitors. Either `noindex` it or give it content.
- **The store has no `migrate` function** despite `version: 3`, so a future
  version bump silently discards games in progress. Pre-existing.
- **Google Search Console** is still unverified, which blocks indexing entirely.
