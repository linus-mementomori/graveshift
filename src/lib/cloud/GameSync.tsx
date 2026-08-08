'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { supabase } from '@/lib/supabase'
import { startOutbox, flush } from './outbox'
import { recordGameStart, recordGameEnd } from './games'

/**
 * Watches the store and mirrors two moments to Supabase: a game beginning and
 * a game ending (CLOUD_PLAN §7 — checkpoints, never per-tap).
 *
 * Mounted once, renders nothing. Every call is fire-and-forget: a sync failure
 * queues in the outbox and never reaches the play UI.
 */
export function GameSync() {
  const cloudGameId = useGameStore((s) => s.cloudGameId)
  const game = useGameStore((s) => s.game)

  const startedRef = useRef<string | null>(null)
  const endedRef = useRef<string | null>(null)

  // Flush anything stranded from a previous session, and on reconnect.
  useEffect(() => startOutbox(), [])

  // Flush again once a session exists — offline games recorded while signed
  // out of a *session* (but with an account) land as soon as auth resolves.
  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) void flush()
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!cloudGameId || !game) return

    if (startedRef.current !== cloudGameId) {
      startedRef.current = cloudGameId
      void recordGameStart(cloudGameId, game)
    }

    if (game.winner && endedRef.current !== cloudGameId) {
      endedRef.current = cloudGameId
      void recordGameEnd(cloudGameId, game)
    }
  }, [cloudGameId, game])

  return null
}
