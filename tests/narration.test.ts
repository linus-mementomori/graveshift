import { describe, it, expect } from 'vitest'
import { deathLine, beatNarration, closingLine } from '@/components/play/narration'
import { THEMES, getTheme } from '@/themes'
import { NIGHT_ORDER } from '@/engine/nightOrder'
import type { GameState, Seat, DeathReason } from '@/engine/types'
import type { Theme } from '@/themes/types'

const REASONS: DeathReason[] = [
  'mafia_kill','serial_killer','vigilante','witch_poison','bodyguard_sacrifice',
  'lover_grief','hunter_revenge','execution','vigilante_guilt',
]

const poolSize = (t: Theme, r: DeathReason) => {
  const v = t.deathFlavour[r]
  return Array.isArray(v) ? v.length : v ? 1 : 0
}

/** A game in which `n` seats have died of `reason`, in order. */
function deaths(seed: string, themeId: string, reason: DeathReason, n: number) {
  const seats: Seat[] = Array.from({ length: n }, (_, i) => ({
    id: `s${i}`, name: `s${i}`, roleId: 'villager', alive: false,
    marks: [], charges: {}, deathOrder: i, deathReason: reason,
  }))
  const game = { seed, themeId, seats, dayNumber: 1 } as unknown as GameState
  return seats.map((s) => deathLine(getTheme(themeId), game, s.id, reason))
}

describe('death narration never repeats itself in one game', () => {
  it('deals every variant once before any can come round again', () => {
    for (const theme of THEMES) {
      for (const reason of REASONS) {
        const depth = poolSize(theme, reason)
        for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
          const lines = deaths(seed, theme.id, reason, depth)
          expect(new Set(lines).size, `${theme.name}/${reason}/${seed}`).toBe(depth)
        }
      }
    }
  })

  it('never says the same line twice in a row, even past exhaustion', () => {
    for (const theme of THEMES) {
      for (const reason of REASONS) {
        for (const seed of ['a', 'b', 'c']) {
          const lines = deaths(seed, theme.id, reason, 16)
          for (let i = 1; i < lines.length; i++) {
            expect(lines[i], `${theme.name}/${reason}/${seed} @${i}`).not.toBe(lines[i - 1])
          }
        }
      }
    }
  })

  it('covers a realistic six-night game without repeating a wolf kill', () => {
    for (const theme of THEMES) {
      const lines = deaths('real-game', theme.id, 'mafia_kill', 6)
      expect(new Set(lines).size, theme.name).toBe(6)
    }
  })
})

describe('death narration is deterministic (D7)', () => {
  it('the same seed narrates identically every time', () => {
    for (const theme of THEMES) {
      const a = deaths('fixed', theme.id, 'mafia_kill', 6)
      const b = deaths('fixed', theme.id, 'mafia_kill', 6)
      expect(a).toEqual(b)
    }
  })

  it('different seeds tell it in a different order', () => {
    const a = deaths('seed-a', 'remusVale', 'mafia_kill', 6).join('|')
    const b = deaths('seed-b', 'remusVale', 'mafia_kill', 6).join('|')
    expect(a).not.toBe(b)
  })
})

describe('death narration degrades safely', () => {
  const theme = getTheme('remusVale')
  const bare = { seed: 's', themeId: 'remusVale', seats: [], dayNumber: 1 } as unknown as GameState

  it('falls back rather than throwing for an unknown reason', () => {
    expect(() => deathLine(theme, bare, 'nobody', 'not_a_reason' as DeathReason)).not.toThrow()
    expect(deathLine(theme, bare, 'nobody', 'not_a_reason' as DeathReason)).toBeTruthy()
  })

  it('does not claim a night death when the reason is an execution', () => {
    const empty = { ...theme, deathFlavour: {} } as Theme
    expect(deathLine(empty, bare, 'x', 'execution')).not.toMatch(/night/i)
    expect(deathLine(empty, bare, 'x', 'mafia_kill')).toMatch(/night/i)
  })

  it('handles a seat with no recorded death order (games saved before it existed)', () => {
    const legacy = {
      seed: 's', themeId: 'remusVale', dayNumber: 1,
      seats: [{ id: 'x', name: 'x', roleId: 'villager', alive: false, marks: [], charges: {} }],
    } as unknown as GameState
    const line = deathLine(theme, legacy, 'x', 'mafia_kill')
    expect(line).toBeTruthy()
    expect(line).not.toMatch(/undefined|NaN/)
  })

  it('accepts a theme that wrote a single string instead of a list', () => {
    const single = { ...theme, deathFlavour: { mafia_kill: 'went quiet.' } } as unknown as Theme
    expect(deathLine(single, bare, 'x', 'mafia_kill')).toBe('went quiet.')
  })
})

describe('beat narration', () => {
  it('produces a line for every beat in the night order, in every theme', () => {
    for (const theme of THEMES) {
      for (const beat of NIGHT_ORDER) {
        const line = beatNarration(theme, beat.id, 'The Role')
        expect(line, `${theme.name}/${beat.id}`).toBeTruthy()
        expect(line, `${theme.name}/${beat.id}`).not.toMatch(/undefined|\[object/)
      }
    }
  })

  it('closing line always names the role being put back to sleep', () => {
    expect(closingLine('The Seer')).toContain('The Seer')
  })
})
