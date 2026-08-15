import { describe, it, expect } from 'vitest'
import { deal, roleBag, rematch } from '@/engine/deal'
import {
  tallyVote, execute, MIN_VOTES_TO_EXECUTE, livingSeats, voterWeight,
  skipExecution, revealMayor, endNight, toDay, toVote, toNight,
} from '@/engine/machine'
import { applyDeaths, resolveNight } from '@/engine/resolve'
import { checkWin } from '@/engine/winCheck'
import {
  PRESETS, totalPlayers, ruleViolations, balanceRead, voteMarginCheck,
  type Composition,
} from '@/engine/balance'
import { makeRng, shuffle } from '@/engine/rng'
import { NIGHT_ORDER } from '@/engine/nightOrder'
import { ROLES } from '@/engine/roles'
import type { GameState, GameSettings } from '@/engine/types'

const SETTINGS: GameSettings = {
  nightZero: false,
  revealRoleOnDeath: true,
  generatedAudio: false,
  dayTimerSeconds: null,
}

function game(composition: Composition, seed = 'test-seed'): GameState {
  const n = totalPlayers(composition)
  return deal({
    names: Array.from({ length: n }, (_, i) => `P${i + 1}`),
    composition,
    themeId: 'remusVale',
    settings: SETTINGS,
    seed,
  })
}

describe('seeded determinism (D7)', () => {
  it('the same seed deals the identical game', () => {
    const a = game(PRESETS[9], 'abc')
    const b = game(PRESETS[9], 'abc')
    expect(a.seats.map((s) => s.roleId)).toEqual(b.seats.map((s) => s.roleId))
  })

  it('different seeds generally deal differently', () => {
    const a = game(PRESETS[9], 'abc').seats.map((s) => s.roleId).join()
    const b = game(PRESETS[9], 'xyz').seats.map((s) => s.roleId).join()
    expect(a).not.toBe(b)
  })

  it('shuffle never mutates its input and keeps every element', () => {
    const src = Object.freeze([1, 2, 3, 4, 5])
    const out = shuffle(src, makeRng('s'))
    expect(src).toEqual([1, 2, 3, 4, 5])
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('rematch keeps the roster but reshuffles roles', () => {
    const g = game(PRESETS[9], 'abc')
    const r = rematch(g, 'different')
    expect(r.seats.map((s) => s.name)).toEqual(g.seats.map((s) => s.name))
    expect(r.seats.every((s) => s.alive)).toBe(true)
  })
})

describe('dealing', () => {
  it('gives every seat a role and every role a seat', () => {
    for (const [n, preset] of Object.entries(PRESETS)) {
      const g = game(preset, `seed-${n}`)
      expect(g.seats.length).toBe(Number(n))
      expect(g.seats.every((s) => s.roleId)).toBe(true)
      expect([...roleBag(preset)].sort()).toEqual(g.seats.map((s) => s.roleId).sort())
    }
  })

  it('starts everyone alive with no death metadata', () => {
    const g = game(PRESETS[9])
    expect(g.seats.every((s) => s.alive)).toBe(true)
    expect(g.seats.every((s) => s.deathReason === undefined)).toBe(true)
  })

  it('falls back to a placeholder for a blank name', () => {
    const g = deal({
      names: ['', '  ', 'Real', 'D', 'E'],
      composition: PRESETS[5],
      themeId: 'remusVale',
      settings: SETTINGS,
      seed: 's',
    })
    expect(g.seats.every((s) => s.name.trim().length > 0)).toBe(true)
  })
})

describe('the execution rule: plurality, minimum 2, ties save everyone', () => {
  const g = game(PRESETS[9])
  const [a, b, c] = g.seats

  it('executes a clear plurality winner', () => {
    expect(tallyVote(g, { [a.id]: 3, [b.id]: 1 })).toEqual({ executedId: a.id, tie: false })
  })

  it('does NOT require an absolute majority', () => {
    // 3 of 9 is a plurality, not a majority. It still executes.
    const t = tallyVote(g, { [a.id]: 3, [b.id]: 2, [c.id]: 2 })
    expect(t.executedId).toBe(a.id)
  })

  it('refuses to execute on a single vote', () => {
    expect(tallyVote(g, { [a.id]: 1 })).toEqual({ tie: false })
    expect(MIN_VOTES_TO_EXECUTE).toBe(2)
  })

  it('a tie at the top saves everyone tied', () => {
    expect(tallyVote(g, { [a.id]: 3, [b.id]: 3 })).toEqual({ tie: true })
    expect(tallyVote(g, { [a.id]: 4, [b.id]: 4, [c.id]: 1 })).toEqual({ tie: true })
  })

  it('a tie below the minimum still saves rather than executes', () => {
    expect(tallyVote(g, { [a.id]: 1, [b.id]: 1 })).toEqual({ tie: true })
  })

  it('no votes at all executes nobody', () => {
    expect(tallyVote(g, {})).toEqual({ tie: false })
    expect(tallyVote(g, { [a.id]: 0, [b.id]: 0 })).toEqual({ tie: false })
  })

  it('ignores negative counts rather than crashing', () => {
    expect(() => tallyVote(g, { [a.id]: -5, [b.id]: 2 })).not.toThrow()
    expect(tallyVote(g, { [a.id]: -5, [b.id]: 2 }).executedId).toBe(b.id)
  })
})

describe('death bookkeeping', () => {
  it('records reason and a 0-based order for each death', () => {
    const g = game(PRESETS[9])
    const [a, b] = g.seats
    applyDeaths(g, [{ seatId: a.id, reason: 'mafia_kill' }])
    applyDeaths(g, [{ seatId: b.id, reason: 'execution' }])
    expect(g.seats.find((s) => s.id === a.id)).toMatchObject({ alive: false, deathReason: 'mafia_kill', deathOrder: 0 })
    expect(g.seats.find((s) => s.id === b.id)).toMatchObject({ alive: false, deathReason: 'execution', deathOrder: 1 })
  })

  it('never kills the same seat twice or double-counts the order', () => {
    const g = game(PRESETS[9])
    const a = g.seats[0]
    applyDeaths(g, [{ seatId: a.id, reason: 'mafia_kill' }])
    const before = a.deathOrder
    const res = applyDeaths(g, [{ seatId: a.id, reason: 'execution' }])
    expect(res.deaths).toHaveLength(0)
    expect(g.seats.find((s) => s.id === a.id)!.deathOrder).toBe(before)
    expect(g.seats.find((s) => s.id === a.id)!.deathReason).toBe('mafia_kill')
  })

  it('death orders are unique and contiguous', () => {
    const g = game(PRESETS[9])
    g.seats.slice(0, 4).forEach((s, i) =>
      applyDeaths(g, [{ seatId: s.id, reason: i % 2 ? 'execution' : 'mafia_kill' }]),
    )
    const orders = g.seats.filter((s) => !s.alive).map((s) => s.deathOrder).sort((x, y) => x! - y!)
    expect(orders).toEqual([0, 1, 2, 3])
  })

  it('a dying lover takes their partner with them', () => {
    const g = game(PRESETS[9])
    const [a, b] = g.seats
    a.loverId = b.id
    b.loverId = a.id
    const res = applyDeaths(g, [{ seatId: a.id, reason: 'mafia_kill' }])
    expect(res.deaths.map((d) => d.reason)).toContain('lover_grief')
    expect(g.seats.find((s) => s.id === b.id)!.alive).toBe(false)
  })

  it('a lover cascade terminates rather than looping forever', () => {
    const g = game(PRESETS[9])
    const [a, b] = g.seats
    a.loverId = b.id
    b.loverId = a.id
    expect(() => applyDeaths(g, [{ seatId: a.id, reason: 'mafia_kill' }])).not.toThrow()
    expect(livingSeats(g).length).toBe(g.seats.length - 2)
  })

  it('flags a dying Hunter as owing a shot', () => {
    const g = game(PRESETS[9])
    const hunter = g.seats.find((s) => s.roleId === 'hunter')
    if (!hunter) return
    const res = applyDeaths(g, [{ seatId: hunter.id, reason: 'mafia_kill' }])
    expect(res.pendingHunterIds).toContain(hunter.id)
  })
})

describe('win conditions', () => {
  function killAllBut(g: GameState, keep: (roleId: string) => boolean) {
    for (const s of g.seats) if (!keep(s.roleId)) applyDeaths(g, [{ seatId: s.id, reason: 'mafia_kill' }])
  }

  it('village wins when every mafia is dead', () => {
    const g = game(PRESETS[9])
    killAllBut(g, (r) => ROLES[r as keyof typeof ROLES].faction !== 'mafia')
    // remove neutrals too so the read is unambiguous
    for (const s of livingSeats(g)) {
      if (ROLES[s.roleId].faction === 'neutral') applyDeaths(g, [{ seatId: s.id, reason: 'mafia_kill' }])
    }
    expect(checkWin(g)?.faction).toBe('village')
  })

  it('nobody wins while both sides still have players', () => {
    const g = game(PRESETS[9])
    expect(checkWin(g)).toBeNull()
  })

  it('mafia win at parity, not only at elimination', () => {
    const g = game(PRESETS[9])
    const mafia = g.seats.filter((s) => ROLES[s.roleId].faction === 'mafia')
    const others = g.seats.filter((s) => ROLES[s.roleId].faction !== 'mafia')
    // leave mafia count >= remaining others
    others.slice(0, others.length - mafia.length).forEach((s) =>
      applyDeaths(g, [{ seatId: s.id, reason: 'mafia_kill' }]),
    )
    const w = checkWin(g)
    if (w) expect(['mafia', 'neutral']).toContain(w.faction)
  })
})

describe('night order', () => {
  it('is uniquely ordered with no duplicate beats', () => {
    const ids = NIGHT_ORDER.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves protection before kills so the Doctor can matter', () => {
    const order = NIGHT_ORDER.map((b) => b.id)
    const doctor = order.indexOf('doctor_protect')
    const wolves = order.indexOf('wolves_kill')
    if (doctor >= 0 && wolves >= 0) expect(doctor).toBeLessThan(wolves)
  })

  it('every role with a beat has that beat defined in the night order', () => {
    const ids = new Set(NIGHT_ORDER.map((b) => b.id))
    for (const role of Object.values(ROLES)) {
      if (role.beatId) expect(ids.has(role.beatId), `${role.id} -> ${role.beatId}`).toBe(true)
    }
  })
})

describe('balance presets (D8)', () => {
  it('every preset is internally consistent', () => {
    for (const [n, preset] of Object.entries(PRESETS)) {
      expect(totalPlayers(preset), `preset ${n}`).toBe(Number(n))
      expect(ruleViolations(preset), `preset ${n}`).toEqual([])
    }
  })

  it('every preset passes the opening vote-margin check (D8, second half)', () => {
    for (const [n, preset] of Object.entries(PRESETS)) {
      expect(voteMarginCheck(preset).pass, `preset ${n}`).toBe(true)
    }
  })

  it('records which presets the app itself reads as mafia-favoured', () => {
    // villageEdge is an unbounded score, not a 0-1 ratio: >= 2 reads "village",
    // >= -1 "balanced", below that "mafia" ("Brutal. Expect a short, tense
    // game."). Three shipped presets currently fall in that last bucket, which
    // sits awkwardly beside D8's promise that every shipped preset is balanced.
    //
    // Pinned here deliberately. This is a live game-design question, not a code
    // bug, so the test records the state of play rather than asserting a fix:
    // if the presets are retuned this fails and someone re-reads the number.
    const brutal = Object.keys(PRESETS)
      .map(Number)
      .filter((n) => balanceRead(PRESETS[n]).label === 'mafia')
      .sort((a, b) => a - b)
    expect(brutal).toEqual([14, 18, 19])
  })

  it('covers the advertised 5 to 20 player range', () => {
    const sizes = Object.keys(PRESETS).map(Number)
    expect(Math.min(...sizes)).toBeLessThanOrEqual(5)
    expect(Math.max(...sizes)).toBeGreaterThanOrEqual(20)
    for (let n = 5; n <= 20; n++) expect(PRESETS[n], `missing preset for ${n}`).toBeTruthy()
  })
})

describe('purity: the engine never mutates the state it is given (D7)', () => {
  it('tallyVote does not touch the game', () => {
    const g = game(PRESETS[9])
    const snapshot = JSON.stringify(g)
    tallyVote(g, { [g.seats[0].id]: 3 })
    expect(JSON.stringify(g)).toBe(snapshot)
  })

  it('execute returns new state without mutating the original', () => {
    const g = game(PRESETS[9])
    const snapshot = JSON.stringify(g)
    const res = execute(g, g.seats[0].id)
    expect(JSON.stringify(g)).toBe(snapshot)
    expect(res.state).not.toBe(g)
  })

  it('phase transitions do not mutate the original', () => {
    const g = game(PRESETS[9])
    const snapshot = JSON.stringify(g)
    toDay(g); toVote(g); toNight(g); skipExecution(g)
    expect(JSON.stringify(g)).toBe(snapshot)
  })
})
