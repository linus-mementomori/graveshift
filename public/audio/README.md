# public/audio: drop your MP3s here

Name a file exactly as listed below and the app uses it automatically. No code
changes, no config.

**Nothing here is required.** Any cue without a file falls back to the generated
synth patch, so a half-filled folder works fine. Add sounds as you find them.

---

## Cue sounds

These fire from the ▶ Play button on the cue strip at that point in the game.

| Filename | When it plays |
|---|---|
| `night-fall.mp3` | Night begins |
| `wolves-wake.mp3` | Wolves open their eyes |
| `seer-wake.mp3` | Seer's turn |
| `doctor-wake.mp3` | Doctor's turn |
| `witch-wake.mp3` | Witch's turn |
| `night-end.mp3` | Night ends |
| `dawn.mp3` | Dawn breaks |
| `death-reveal.mp3` | Announcing who died |
| `no-death.mp3` | Nobody died |
| `day.mp3` | Day discussion begins |
| `vote.mp3` | Calling the vote |
| `execution.mp3` | Someone is executed |
| `last-words.mp3` | Final words before death |
| `victory-village.mp3` | Village wins |
| `victory-mafia.mp3` | Wolves win |
| `victory-neutral.mp3` | A neutral role wins |

## Soundboard sounds

These appear in the **Soundboard** tray during play. Fired whenever the host
wants, not tied to a beat. Buttons only appear for files that exist.

| Filename | Intended use |
|---|---|
| `good-luck-sleeping.mp3` | Sarcastic sign-off as everyone closes their eyes |
| `scream.mp3` | A death that deserves more than an announcement |
| `suspense.mp3` | Under a vote that's about to go badly |
| `laugh.mp3` | The village executes a villager. Again. |
| `heartbeat-long.mp3` | Under the final accusation |
| `door-creak.mp3` | Nothing is at the door. Let them wonder. |

Want different ones? Edit `EXTRA_SOUNDS` in `src/audio/files.ts`. Id, label,
filename, and a one-line hint.

---

## Keep them small

`ARCHITECTURE.md` §9 caps total installed size at **2 MB**, and these get
precached for offline use, so every byte is downloaded on first visit.

- **2–4 seconds** per clip. Trim silence off both ends.
- **Mono, 96 kbps** is plenty for a phone speaker at a party.
- Target **20–40 kB** per file. All 22 above at that size ≈ 700 kB, comfortably
  inside budget.

Quick re-encode if a file is oversized:

```bash
ffmpeg -i input.mp3 -ac 1 -b:a 96k -t 4 output.mp3
```

---

## Record where each file came from

Fill in `CREDITS.md` in this folder as you add files. Two reasons, and the
second is the one that bites:

1. Some licences (CC-BY) require attribution, and you can't attribute what you
   didn't write down.
2. If you're ever asked to prove you had the right to use a sound, "I found it
   on a soundboard site" is not an answer. A dated note with the source URL and
   licence is.

Safest sources, in order:

| Source | Licence |
|---|---|
| [Freesound](https://freesound.org), **filter to CC0** | Public domain |
| [Pixabay Sound Effects](https://pixabay.com/sound-effects/) | Free commercial use |
| [OpenGameArt](https://opengameart.org) | Mixed. Check each |

Avoid ripping from films, games, TV or meme soundboards for anything public.
It's fine for a private game night; it's a real risk on a public site with your
name on it. See `docs/AUDIO.md`.
