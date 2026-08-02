'use client'

/**
 * Game store — the thin React-facing wrapper around the pure engine.
 *
 * Persists to localStorage on EVERY action (ARCHITECTURE.md §4). No debounce:
 * the failure mode we protect against is a phone dying mid-night phase.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRESETS, defaultNightZero, type Composition } from '@/engine/balance'
import { DEFAULT_THEME_ID } from '@/themes'
import type { GameSettings, Seat } from '@/engine/types'

interface SetupDraft {
  playerCount: number
  themeId: string
  composition: Composition
  names: string[]
  settings: GameSettings
}

interface GameStore extends SetupDraft {
  /** Seats exist once roles have been dealt. Null during setup. */
  seats: Seat[] | null
  dealtAt: number | null

  setPlayerCount: (n: number) => void
  setTheme: (id: string) => void
  setComposition: (c: Composition) => void
  adjustRole: (roleId: keyof Composition, delta: number) => void
  resetToPreset: () => void
  setName: (index: number, name: string) => void
  toggleSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void
  reset: () => void
}

const emptyNames = (n: number) => Array.from({ length: n }, (_, i) => `Player ${i + 1}`)

const initialCount = 8

const initial: SetupDraft & { seats: null; dealtAt: null } = {
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
  seats: null,
  dealtAt: null,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initial,

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

      reset: () => set({ ...initial, composition: { ...PRESETS[initialCount] } }),
    }),
    { name: 'nightfall:game', version: 2 },
  ),
)
