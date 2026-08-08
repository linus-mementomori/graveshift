'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

/**
 * Restores the saved game from localStorage, once, after React has mounted.
 *
 * The store sets `skipHydration: true` precisely so this can happen here rather
 * than at module load. Restoring at module load runs *before* React subscribes,
 * so the resulting state change notifies nobody: the saved game sits in storage
 * while every screen renders as though there isn't one. That produced "No game
 * in progress" on /play and a permanent "Shuffling…" on the deal screen.
 *
 * Doing it in an effect means the restore is a normal state update, with normal
 * subscribers, and every screen re-renders correctly.
 */
export function StoreHydrator() {
  useEffect(() => {
    // Flag it from here rather than onRehydrateStorage: this runs after the
    // restore has fully settled, and it still fires when there is nothing
    // saved at all — which is just as much an answer as finding a game.
    Promise.resolve(useGameStore.persist.rehydrate()).finally(() => {
      useGameStore.setState({ hydrated: true })
    })
  }, [])

  return null
}
