import { describe, it, expect } from 'vitest'
import { THEMES, getTheme } from '@/themes'
import { ROLES } from '@/engine/roles'
import type { DeathReason } from '@/engine/types'
import type { Theme } from '@/themes/types'

const DEATH_REASONS: DeathReason[] = [
  'mafia_kill',
  'serial_killer',
  'vigilante',
  'witch_poison',
  'bodyguard_sacrifice',
  'lover_grief',
  'hunter_revenge',
  'execution',
  'vigilante_guilt',
]

/** Every flavour variant for a reason, whichever shape the theme used. */
function variants(theme: Theme, reason: DeathReason): string[] {
  const v = theme.deathFlavour[reason]
  return Array.isArray(v) ? v : v ? [v] : []
}

const allLines = (theme: Theme) => DEATH_REASONS.flatMap((r) => variants(theme, r))

describe('theme content integrity', () => {
  it('every theme covers every death reason', () => {
    for (const theme of THEMES) {
      for (const reason of DEATH_REASONS) {
        expect(variants(theme, reason).length, `${theme.name} / ${reason}`).toBeGreaterThan(0)
      }
    }
  })

  it('every theme names every role the engine can deal', () => {
    // A missing skin silently falls back to the canonical English name, which
    // is not a crash but is a hole in the costume.
    for (const theme of THEMES) {
      for (const roleId of Object.keys(ROLES)) {
        expect(theme.roleSkins[roleId as keyof typeof theme.roleSkins]?.name, `${theme.name} / ${roleId}`)
          .toBeTruthy()
      }
    }
  })

  it('supplies all nine narration beats and three victory lines', () => {
    const beats = ['nightFall','wolvesWake','seerWake','doctorWake','dawn','noDeath','day','vote','execution'] as const
    for (const theme of THEMES) {
      for (const b of beats) expect(theme.narration[b], `${theme.name} / ${b}`).toBeTruthy()
      for (const f of ['village','mafia','neutral'] as const) {
        expect(theme.victory[f], `${theme.name} / victory.${f}`).toBeTruthy()
      }
    }
  })
})

describe('death lines are grammatical continuations of a name', () => {
  // The screen renders the player's name in display type and this line directly
  // underneath, so each line must read as "<Name> was found at the treeline."

  it('never starts with a capital (that would read as a new sentence)', () => {
    for (const theme of THEMES) {
      for (const line of allLines(theme)) {
        const first = line[0]
        expect(/[a-z]/.test(first), `${theme.name}: "${line}"`).toBe(true)
      }
    }
  })

  it('ends with a full stop', () => {
    for (const theme of THEMES) {
      for (const line of allLines(theme)) {
        expect(line.trimEnd().endsWith('.'), `${theme.name}: "${line}"`).toBe(true)
      }
    }
  })

  it('never embeds a player-name placeholder', () => {
    for (const theme of THEMES) {
      for (const line of allLines(theme)) {
        expect(line).not.toMatch(/\$\{|\{\{|%s|\bNAME\b/)
      }
    }
  })

  it('stays short enough to read aloud in one breath', () => {
    for (const theme of THEMES) {
      for (const line of allLines(theme)) {
        expect(line.length, `${theme.name}: "${line}"`).toBeLessThanOrEqual(140)
      }
    }
  })
})

describe('no duplicate storytelling', () => {
  it('a reason never lists the same line twice', () => {
    for (const theme of THEMES) {
      for (const reason of DEATH_REASONS) {
        const v = variants(theme, reason)
        expect(new Set(v).size, `${theme.name} / ${reason}`).toBe(v.length)
      }
    }
  })

  it('a theme never reuses one line across two different reasons', () => {
    for (const theme of THEMES) {
      const seen = new Map<string, DeathReason>()
      for (const reason of DEATH_REASONS) {
        for (const line of variants(theme, reason)) {
          const prior = seen.get(line)
          expect(prior, `${theme.name}: "${line}" used for both ${prior} and ${reason}`).toBeUndefined()
          seen.set(line, reason)
        }
      }
    }
  })

  it('two themes never share a line (each world has its own voice)', () => {
    const seen = new Map<string, string>()
    for (const theme of THEMES) {
      for (const line of allLines(theme)) {
        const prior = seen.get(line)
        expect(prior, `"${line}" appears in both ${prior} and ${theme.name}`).toBeUndefined()
        seen.set(line, theme.name)
      }
    }
  })

  it('gives the reasons that fire every cycle a deep enough pool', () => {
    // mafia_kill / serial_killer / execution can each happen on every single
    // cycle, so a six-night game must not exhaust them.
    for (const theme of THEMES) {
      for (const reason of ['mafia_kill', 'serial_killer', 'execution'] as DeathReason[]) {
        expect(variants(theme, reason).length, `${theme.name} / ${reason}`).toBeGreaterThanOrEqual(6)
      }
    }
  })
})

describe('story alignment: a line must match the death it describes', () => {
  it('execution lines read as a public, daytime, collective act', () => {
    // Executions are voted by the table in daylight. A line implying a private
    // night-time killing would contradict what the players just did.
    for (const theme of THEMES) {
      for (const line of variants(theme, 'execution')) {
        expect(line, `${theme.name}: "${line}"`).not.toMatch(/\bin their (bed|sleep)\b/i)
        expect(line, `${theme.name}: "${line}"`).not.toMatch(/\bwas found\b/i)
      }
    }
  })

  it('night-kill lines do not claim a public vote', () => {
    const nightReasons: DeathReason[] = ['mafia_kill', 'serial_killer', 'witch_poison']
    for (const theme of THEMES) {
      for (const reason of nightReasons) {
        for (const line of variants(theme, reason)) {
          expect(line, `${theme.name} / ${reason}: "${line}"`).not.toMatch(/\b(voted|condemned|sentenced|hanged before)\b/i)
        }
      }
    }
  })

  it('lover_grief points at the partner, or at the theme\'s word for the bond', () => {
    // On screen this reads "<Name> <line>" and nothing else, so a grief line
    // that refers to neither the other person nor the bond leaves the player
    // wondering who died.
    //
    // Each theme has its own vocabulary for the bond and that counts: Signal
    // Lost's Cupid is the "Pair-Bond Protocol", so "the link held" is exactly
    // right there. "Some bonds do not negotiate" referred to nothing at all
    // and was rewritten.
    const referent = /\bthem\b|\bthey\b|\btheir\b|\bbeside\b|\bafter\b|\blink\b|\bbond\b|\bbinding\b|\bbound\b/i
    for (const theme of THEMES) {
      for (const line of variants(theme, 'lover_grief')) {
        expect(line, `${theme.name}: "${line}"`).toMatch(referent)
      }
    }
  })

  it('uses one apostrophe character throughout', () => {
    // Mixed ' and U+2019 in the same corpus renders inconsistently.
    const straight: string[] = []
    const curly: string[] = []
    for (const theme of THEMES) {
      for (const line of allLines(theme)) {
        if (line.includes("'")) straight.push(`${theme.name}: ${line}`)
        if (line.includes('’')) curly.push(`${theme.name}: ${line}`)
      }
    }
    expect(
      straight.length === 0 || curly.length === 0,
      `mixed apostrophes.\n  straight: ${straight.length}\n  curly: ${curly.length}\n  ${[...straight.slice(0,3), ...curly.slice(0,3)].join('\n  ')}`,
    ).toBe(true)
  })
})

describe('themes are costumes, never rules (D4)', () => {
  it('getTheme falls back rather than throwing on an unknown id', () => {
    expect(() => getTheme('does-not-exist')).not.toThrow()
    expect(getTheme('does-not-exist')).toBeTruthy()
  })

  it('theme ids are unique', () => {
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
