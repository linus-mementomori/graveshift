'use client'

/**
 * Game store — the thin React-facing wrapper around the pure engine.
 *
 * Persists to localStorage on EVERY action (ARCHITECTURE.md §4). No debounce:
 * the failure mode we protect against is a phone dying mid-night phase.
 *
 * The engine stays pure (CONTEXT.md D7). Anything impure — the seed, the clock —
 * is generated HERE and injected.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRESETS, defaultNightZero, type Composition } from '@/engine/balance'
import { DEFAULT_THEME_ID } from '@/themes'
import { deal, rematch } from '@/engine/deal'
import * as M from '@/engine/machine'
import type { InfoResult } from '@/engine/resolve'
import type { Death, GameSettings, GameState, Intent, Seat, WinResult } from '@/engine/types'

interface SetupDraft {
  playerCount: number
  themeId: string
  composition: Composition
  names: string[]
  settings: GameSettings
}

interface GameStore extends SetupDraft {
  /** The live game. Null during setup / after New Game. */
  game: GameState | null
  /**
   * Client-generated id for the cloud `games` row. Generated here (impure) and
   * used as an idempotency key so a retried sync upserts instead of duplicating.
   * Null while playing signed-out — anonymous games are never synced (CLOUD_PLAN P1).
   */
  cloudGameId: string | null
  /** Results of the most recent resolution, for the Dawn and reveal screens. */
  lastDeaths: Death[]
  lastInfo: InfoResult[]
  pendingHunterIds: string[]
  votes: Record<string, number>

  // ── setup ──
  setPlayerCount: (n: number) => void
  setTheme: (id: string) => void
  setComposition: (c: Composition) => void
  adjustRole: (roleId: keyof Composition, delta: number) => void
  resetToPreset: () => void
  setName: (index: number, name: string) => void
  toggleSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void
  reset: () => void

  // ── play ──
  startGame: () => void
  setIntent: (intent: Intent) => void
  cupidPick: (seatId: string) => void
  clearBeat: (beatId: string) => void
  advanceBeat: () => void
  backBeat: () => void
  finishNight: () => void
  resolveHunter: (hunterId: string, targetId: string | null) => void
  goDay: () => void
  goVote: () => void
  revealMayor: (seatId: string) => void
  setVote: (seatId: string, n: number) => void
  clearVotes: () => void
  doExecute: (seatId: string) => void
  skipVote: () => void
  continueToNight: () => void
  callIt: (winner: WinResult) => void
  newGame: () => void
  playAgain: () => void
}

const emptyNames = (n: number) => Array.from({ length: n }, (_, i) => `Player ${i + 1}`)

const initialCount = 8

const initialDraft: SetupDraft = {
  playerCount: initialCount,
  themeId: DEFAULT_THEME_ID,
  composition: { ...PRESETS[initialCount] },
  names: emptyNames(initialCount),
  settings: {
    nightZero: defaultNightZero(initialCount),
    revealRoleOnDeath: true,
    generatedAudio: false,
    dayTimerSeconds: null,
  },
}

const initialPlay = {
  game: null,
  cloudGameId: null as string | null,
  lastDeaths: [] as Death[],
  lastInfo: [] as InfoResult[],
  pendingHunterIds: [] as string[],
  votes: {} as Record<string, number>,
}

/** Impure by design — the engine may not do this itself (D7). */
const newSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialDraft,
      ...initialPlay,

      // ── setup ────────────────────────────────────────────────────────────
      setPlayerCount: (n) => {
        const count = Math.max(5, Math.min(20, n))
        const names = emptyNames(count).map((fallback, i) => get().names[i] ?? fallback)
        set({
          playerCount: count,
          composition: { ...PRESETS[count] },
          names,
          settings: { ...get().settings, nightZero: defaultNightZero(count) },
        })
      },

      setTheme: (id) => set({ themeId: id }),

      setComposition: (composition) => set({ composition }),

      adjustRole: (roleId, delta) => {
        const composition = { ...get().composition }
        const next = Math.max(0, (composition[roleId] ?? 0) + delta)
        if (next === 0) delete composition[roleId]
        else composition[roleId] = next
        set({ composition })
      },

      resetToPreset: () => set({ composition: { ...PRESETS[get().playerCount] } }),

      setName: (index, name) => {
        const names = [...get().names]
        names[index] = name
        set({ names })
      },

      toggleSetting: (key, value) => set({ settings: { ...get().settings, [key]: value } }),

      reset: () => set({ ...initialDraft, composition: { ...PRESETS[initialCount] }, ...initialPlay }),

      // ── play ─────────────────────────────────────────────────────────────
      startGame: () => {
        const { composition, names, themeId, settings } = get()
        set({
          ...initialPlay,
          cloudGameId: newId(),
          game: deal({ composition, names, themeId, settings, seed: newSeed() }),
        })
      },

      setIntent: (intent) => {
        const game = get().game
        if (!game) return
        set({ game: M.recordIntent(game, intent) })
      },

      cupidPick: (seatId) => {
        const game = get().game
        if (!game) return
        set({ game: M.recordCupidPick(game, seatId) })
      },

      clearBeat: (beatId) => {
        const game = get().game
        if (!game) return
        set({ game: M.clearIntentsFor(game, beatId) })
      },

      advanceBeat: () => {
        const game = get().game
        if (!game) return
        set({ game: M.nextBeat(game) })
      },

      backBeat: () => {
        const game = get().game
        if (!game) return
        set({ game: M.prevBeat(game) })
      },

      finishNight: () => {
        const game = get().game
        if (!game) return
        const { state, deaths, outcome } = M.endNight(game)
        set({
          game: state,
          lastDeaths: deaths,
          lastInfo: outcome.info,
          pendingHunterIds: outcome.pendingHunterIds,
        })
      },

      resolveHunter: (hunterId, targetId) => {
        const game = get().game
        if (!game) return
        const res = M.hunterRevenge(game, hunterId, targetId)
        set({
          game: res.state,
          lastDeaths: [...get().lastDeaths, ...res.deaths],
          pendingHunterIds: [
            ...get().pendingHunterIds.filter((id) => id !== hunterId),
            ...res.pendingHunterIds,
          ],
        })
      },

      goDay: () => {
        const game = get().game
        if (!game) return
        set({ game: M.toDay(game), votes: {} })
      },

      goVote: () => {
        const game = get().game
        if (!game) return
        set({ game: M.toVote(game), votes: {} })
      },

      revealMayor: (seatId) => {
        const game = get().game
        if (!game) return
        set({ game: M.revealMayor(game, seatId) })
      },

      setVote: (seatId, n) =>
        set({ votes: { ...get().votes, [seatId]: Math.max(0, n) } }),

      clearVotes: () => set({ votes: {} }),

      doExecute: (seatId) => {
        const game = get().game
        if (!game) return
        const res = M.execute(game, seatId)
        set({
          game: res.state,
          lastDeaths: res.survived ? [] : [{ seatId, reason: 'execution' }],
          pendingHunterIds: res.pendingHunterIds,
          votes: {},
        })
      },

      skipVote: () => {
        const game = get().game
        if (!game) return
        set({ game: M.skipExecution(game), votes: {}, lastDeaths: [], lastInfo: [] })
      },

      continueToNight: () => {
        const game = get().game
        if (!game) return
        set({
          game: M.toNight(game),
          lastDeaths: [],
          lastInfo: [],
          pendingHunterIds: [],
          votes: {},
        })
      },

      callIt: (winner) => {
        const game = get().game
        if (!game) return
        set({ game: M.callIt(game, winner) })
      },

      newGame: () => set({ ...initialPlay }),

      playAgain: () => {
        const game = get().game
        if (!game) return
        set({ ...initialPlay, cloudGameId: newId(), game: rematch(game, newSeed()) })
      },
    }),
    { name: 'remus:game', version: 3 },
  ),
)

/** Convenience selectors. */
export const useGame = () => useGameStore((s) => s.game)
export const seatName = (seat: Seat | undefined, fallback = 'someone') => seat?.name ?? fallback
