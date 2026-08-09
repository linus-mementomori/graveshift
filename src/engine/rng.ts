/**
 * Seeded randomness. The ONLY source of chance in the engine.
 *
 * D7: no Math.random() anywhere. Everything derives from an injected seed, which
 * is what makes a game replayable from { seed, intents[] } and the simulator
 * deterministic.
 */

/** mulberry32. Small, fast, good enough for shuffling a dozen cards. */
export function makeRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates. Returns a new array; never mutates the input. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * A seed for a fresh game. This is the one place time/entropy enters, and it is
 * called by the STORE (not the engine) so the engine itself stays pure.
 */
export function newSeed(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
