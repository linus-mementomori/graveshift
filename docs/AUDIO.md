# AUDIO.md: Sound in Graveshift

Why the app generates sound instead of playing files, what's built, and how to
add real recordings later if you decide you want them.

---

## The MyInstants question

You asked whether we could wire MyInstants sounds to buttons in the app. I
browsed it properly before answering. Short version: **the idea is right, the
source is wrong.** Here's what I found.

### What's actually on there

The New Zealand trending page is almost entirely copyrighted meme audio,
SpongeBob, Fortnite's death sound, Michael Jackson, Breaking Bad's Tuco, Among
Us, the Discord notification, Apple Pay. Plus a lot of fart jokes. None of it
suits a horror party game, and none of it is ours to use.

Searching properly does turn up genuinely useful material. The wolf-howl
soundboard has ~30 entries including *"Wolf Howl. Far Away"*, *",  Nearby"* and
*",  Very Far Away"*, which is exactly the vocabulary this game wants: a distant
howl at night one, a near one at night four. Credit where it's due, that's a
real find.

### Why we still can't use it

Four independent reasons, any one of which would be enough:

**1 · We can't establish rights to a single clip.** MyInstants is user-uploaded
with no per-sound licence metadata. A "wolf howl" there might be public domain,
might be lifted from a BBC documentary, might be from a commercial sound
library. There is no way to tell, and "someone else uploaded it" is not a
defence, the liability lands on whoever publishes it.

**2 · Hotlinking their files serves the app off their bandwidth**, without
permission, for a third-party product. Sites that notice this typically respond
by blocking the referrer or swapping the file, which means your game breaks
mid-night, at a party, with no warning.

**3 · It breaks offline.** Decision D5 and the core promise: *works in a
basement with no signal*. Remote audio makes the atmosphere the first thing to
fail exactly when the room is darkest.

**4 · It contradicts D2**, the decision that gives this app its shape: *"Audio
is a cue, not a file. The app tells the host what to play or perform; it never
ships copyrighted music."* That isn't squeamishness, it's what keeps the bundle
tiny, the licensing at zero, and the host as the performer.

---

## What I built instead

`src/audio/synth.ts`. Every sound **synthesised at runtime** from oscillators
and noise. Nothing fetched, nothing shipped, nothing sampled.

| Patch | Sound | Used by |
|---|---|---|
| `drone` | Low detuned bed, sustained until stopped | Night falls |
| `chime` | Inharmonic bell | Seer wakes |
| `heartbeat` | Lub-dub ×2, ~60 bpm | Tension beats |
| `hit` | Noise crack over a body thud | Death reveal |
| `tick` | Short click | Vote timer |
| `howl` | Pitch-swept wolf howl with vibrato | Wolves wake |

A **▶ Play** button now appears on any cue strip whose cue has a patch, so the
host can tap it instead of performing it. The drone toggles to **■ Stop**;
everything else is a one-shot.

Three things worth knowing about the implementation:

- **`AudioContext` is created lazily on the tap**, never at load. iOS refuses to
  start audio outside a user gesture.
- **`synth.ts` is dynamically imported**, so it costs zero bytes on first load
  and only downloads if someone actually presses play.
- **Only one sustained sound at a time**, a second drone layered on the first
  is just noise.

### The honest trade-off

A synthesised howl will not fool anyone next to a real field recording. It
sounds like a good impression rather than a wolf. Given that this app's entire
premise is *the host performs and the phone prompts*, an impression is arguably
on-theme, but it is a real limitation, not a claim of parity.

---

## If you want real recordings later

The route is **CC0 files, self-hosted**. Never hotlinked soundboards.

### Where to get them

| Source | Licence | Notes |
|---|---|---|
| [Freesound](https://freesound.org) (filter to **CC0**) | Public domain | Biggest library. The filter matters. Plenty there is CC-BY or non-commercial |
| [Pixabay Sound Effects](https://pixabay.com/sound-effects/) | Pixabay licence | Free commercial use, no attribution |
| [OpenGameArt](https://opengameart.org) | Mixed. Check each | Made for games, so lengths suit cues |
| [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk) | ⚠ Personal/educational only | Beautiful, but **not** licensed for a public app |

### How to add them

1. Drop files in `public/audio/`: **self-hosted**, so offline still works
2. Keep them short (2–4 s) and compress hard: mono, 96 kbps MP3 or Opus
3. Extend `CUES` in `src/audio/cues.ts` with a `file` field alongside `synth`
4. Prefer the file when present, fall back to the synth patch
5. Precache them in `public/sw.js`'s `SHELL` array
6. **Record the licence and source URL for every file** in a
   `public/audio/CREDITS.md`. Future-you will not remember, and that record is
   the whole point of doing it this way

### Watch the budget

ARCHITECTURE §9 caps total installed size at **2 MB** and first-load JS at
**120 kB**. A well-compressed 3-second effect is 20–40 kB, so six or seven
signature sounds fit comfortably. A folder of full-length music tracks does not
- and that's before the licensing conversation.

---

## The version I'd actually recommend

Keep the synth as the default, and add **at most three or four** CC0 recordings
for the moments that carry the game: the wolf howl at night, the death sting at
dawn, and a victory tone. Those are the beats people remember. Everything else
is atmosphere the synth already handles, and every file you add is bundle
weight, a licence to track, and one more thing to keep working offline.
