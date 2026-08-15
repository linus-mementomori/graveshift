import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/store/gameStore'
import { PRESETS, totalPlayers } from '@/engine/balance'

/**
 * The setup flow, driven the way the screens drive it.
 *
 * The engine tests all pass a `names` array of the right length, so they could
 * never catch a mismatch between what the host picked and what got dealt. That
 * wiring lives here, in the store, and this file is what was missing when a
 * 12-player setup dealt a 5-player game.
 */
const store = () => useGameStore.getState()

beforeEach(() => {
  store().reset()
})

describe('player count drives everything downstream', () => {
  it('deals exactly the number of seats the host chose, 5 through 20', () => {
    for (let n = 5; n <= 20; n++) {
      store().reset()
      store().setPlayerCount(n)
      store().startGame()

      const game = store().game
      expect(game, `${n} players: no game dealt`).toBeTruthy()
      expect(game!.seats.length, `${n} players dealt ${game!.seats.length} seats`).toBe(n)
    }
  })

  it('resizes the name list with the count, keeping what was already typed', () => {
    store().setPlayerCount(6)
    store().setName(0, 'Ana')
    store().setName(1, 'Ben')

    store().setPlayerCount(12)
    expect(store().names).toHaveLength(12)
    expect(store().names[0]).toBe('Ana')
    expect(store().names[1]).toBe('Ben')

    // Shrinking must not leave a longer array behind, or the next deal would
    // silently seat people the host removed.
    store().setPlayerCount(7)
    expect(store().names).toHaveLength(7)
  })

  it('swaps in the matching preset when the count changes', () => {
    for (const n of [5, 9, 12, 17, 20]) {
      store().setPlayerCount(n)
      expect(totalPlayers(store().composition), `preset for ${n}`).toBe(n)
      expect(store().composition).toEqual(PRESETS[n])
    }
  })

  it('clamps to the supported 5 to 20 range', () => {
    store().setPlayerCount(1)
    expect(store().playerCount).toBe(5)
    store().setPlayerCount(99)
    expect(store().playerCount).toBe(20)
  })
})

describe('starting a game never inherits the previous one', () => {
  it('re-deals at the new size after an earlier game at a different size', () => {
    // The exact reported bug: play (or abandon) a small game, then set up a
    // bigger one. The old game is still in the store, persisted.
    store().setPlayerCount(5)
    store().startGame()
    expect(store().game!.seats.length).toBe(5)

    store().setPlayerCount(12)
    store().startGame()
    expect(store().game!.seats.length).toBe(12)
  })

  it('re-deals at the same size rather than resuming the finished game', () => {
    store().setPlayerCount(9)
    store().startGame()
    const first = store().game!

    // Kill someone so the old game is visibly mid-flight.
    first.seats[0].alive = false

    store().startGame()
    const second = store().game!
    expect(second.seats.every((s) => s.alive), 'dealt into a used board').toBe(true)
    expect(second.seed, 'reused the previous seed').not.toBe(first.seed)
  })

  it('clears the previous game state, not just the seats', () => {
    store().setPlayerCount(8)
    store().startGame()
    store().startGame()

    const game = store().game!
    // One entry: the fresh setup line. Nothing carried over from the last game.
    expect(game.log.every((e) => e.phase === 'setup')).toBe(true)
    expect(game.intents).toHaveLength(0)
    expect(game.winner).toBeUndefined()
    expect(game.dayNumber).toBe(1)
  })
})

describe('names reach the table', () => {
  it('seats carry the names the host typed, in order', () => {
    store().setPlayerCount(6)
    const typed = ['Ana', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fay']
    typed.forEach((n, i) => store().setName(i, n))
    store().startGame()

    expect(store().game!.seats.map((s) => s.name)).toEqual(typed)
  })

  it('falls back to a placeholder for a seat left blank', () => {
    store().setPlayerCount(5)
    store().setName(0, '   ')
    store().startGame()

    for (const seat of store().game!.seats) {
      expect(seat.name.trim().length, 'a seat ended up nameless').toBeGreaterThan(0)
    }
  })
})

describe('an under-filled composition still seats everyone', () => {
  it('fills the remaining seats rather than dropping players', () => {
    // The roles screen lets the host remove roles. Whatever they leave, the
    // number of people at the table is the number of people at the table.
    store().setPlayerCount(10)
    store().adjustRole('villager', -3)
    store().startGame()

    expect(store().game!.seats).toHaveLength(10)
    expect(store().game!.seats.every((s) => s.roleId)).toBe(true)
  })
})
