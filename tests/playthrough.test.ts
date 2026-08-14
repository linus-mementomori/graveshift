import { describe, it, expect } from 'vitest'
import { simulate, runMany } from './simulate'
import { PRESETS } from '@/engine/balance'
import { ROLES } from '@/engine/roles'

const SIZES = Object.keys(PRESETS).map(Number).sort((a, b) => a - b)

describe('every table size plays a complete game without crashing', () => {
  for (const n of SIZES) {
    it(`${n} players`, () => {
      for (let i = 0; i < 25; i++) {
        const r = simulate(PRESETS[n], `t${n}-${i}`)
        expect(r.stalled, `${n}p seed ${i} never resolved`).toBeFalsy()
        expect(r.winner, `${n}p seed ${i}`).not.toBe('none')
      }
    })
  }
})

describe('a finished game is always in a coherent state', () => {
  it('always terminates well inside the day cap', () => {
    for (const n of SIZES) {
      for (let i = 0; i < 10; i++) {
        const r = simulate(PRESETS[n], `cap-${n}-${i}`)
        expect(r.days, `${n}p seed ${i} ran ${r.days} days`).toBeLessThan(30)
      }
    }
  })

  it('never declares a winner that was not in the game', () => {
    const valid = new Set<string>(['village', 'mafia', 'neutral', ...Object.keys(ROLES)])
    for (const n of SIZES) {
      for (let i = 0; i < 10; i++) {
        const r = simulate(PRESETS[n], `w-${n}-${i}`)
        expect(valid.has(r.winner), `${n}p produced winner "${r.winner}"`).toBe(true)
      }
    }
  })

  it('is reproducible: the same seed replays to the same result', () => {
    for (const n of SIZES) {
      const a = simulate(PRESETS[n], `repeat-${n}`)
      const b = simulate(PRESETS[n], `repeat-${n}`)
      expect(a).toEqual(b)
    }
  })
})

describe('balance, measured rather than asserted (D8)', () => {
  // These are the first real measurements this project has had: the simulator
  // was listed as a planned feature and the presets are the hand-built table.
  //
  // The bot is deliberately average - the village converges on one nominee and
  // acts on Seer reads, the mafia bloc vote - so treat these as directional,
  // not as tuning targets. What they establish is a BASELINE: if someone
  // retunes a preset, this test tells them which way it moved.

  it('both factions can win at every table size (no preset is unwinnable)', () => {
    for (const n of SIZES) {
      const r = runMany(PRESETS[n], 120, `bal-${n}`)
      expect(r.tally.village ?? 0, `${n}p: village never wins`).toBeGreaterThan(0)
      const evil = (r.tally.mafia ?? 0) + (r.tally.jester ?? 0) + (r.tally.serialKiller ?? 0)
      expect(evil, `${n}p: nobody but the village ever wins`).toBeGreaterThan(0)
    }
  })

  it('small tables sit near the intended even split', () => {
    // 5-10 players is the range the presets were hand-tuned for, and it holds.
    for (const n of [5, 9, 10]) {
      const r = runMany(PRESETS[n], 200, `small-${n}`)
      expect(r.villageWinRate, `${n}p at ${(r.villageWinRate * 100).toFixed(1)}%`).toBeGreaterThan(0.35)
      expect(r.villageWinRate, `${n}p at ${(r.villageWinRate * 100).toFixed(1)}%`).toBeLessThan(0.65)
    }
  })

  it('DOCUMENTS a real gap: big tables fall well short of D8', () => {
    // D8 promises every shipped preset simulates to a 45-55% village win rate.
    // From 14 players up the simulated rate is roughly 10-25%, and the app's
    // own balanceRead independently calls 14p, 18p and 19p "Brutal".
    //
    // Asserted as the CURRENT state so it is visible and tracked, not silently
    // shipped. Retuning the presets is a game-design decision for the owner,
    // and when it happens this test should fail and be updated.
    const big = [14, 16, 18, 20]
    for (const n of big) {
      const r = runMany(PRESETS[n], 150, `big-${n}`)
      expect(r.villageWinRate, `${n}p is now ${(r.villageWinRate * 100).toFixed(1)}% - retuned?`)
        .toBeLessThan(0.45)
    }
  })
})
