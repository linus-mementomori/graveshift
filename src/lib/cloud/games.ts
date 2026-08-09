'use client'

/**
 * Game sync, CLOUD_PLAN §7.
 *
 * Three checkpoints, never a per-tap write: created, finished, abandoned.
 * Every write is idempotent (client-generated uuid as the primary key), so a
 * retry upserts rather than duplicating.
 *
 * P2: this is a background mirror. A failure here must never surface in the
 * play UI. The host is mid-game and there is nothing useful they could do.
 */

import { supabase } from '@/lib/supabase'
import { queue, flush } from './outbox'
import type { GameState } from '@/engine/types'

/**
 * Strip seat NAMES before anything leaves the device.
 *
 * Those are the real first names of 6–20 people at a party who never signed up
 * for anything and never consented to being in a database (CLOUD_PLAN §14.2).
 * Roles, life/death and outcomes are all the history and admin views need.
 */
export function anonymiseState(game: GameState) {
  return {
    ...game,
    seats: game.seats.map((s, i) => ({
      ...s,
      name: `Seat ${i + 1}`,
      notes: undefined,
    })),
  }
}

const composition = (game: GameState) =>
  game.seats.reduce<Record<string, number>>((acc, s) => {
    acc[s.roleId] = (acc[s.roleId] ?? 0) + 1
    return acc
  }, {})

export async function recordGameStart(id: string, game: GameState): Promise<void> {
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id
  if (!userId) return // anonymous play is never synced (P1)

  const row = {
    id,
    user_id: userId,
    theme_id: game.themeId,
    player_count: game.seats.length,
    composition: composition(game),
    settings: game.settings,
    seed: game.seed,
    status: 'in_progress' as const,
  }

  queue({ table: 'games', op: 'upsert', row })
  await flush()
}

export async function recordGameEnd(id: string, game: GameState): Promise<void> {
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  if (!data.user?.id) return

  queue({
    table: 'games',
    op: 'update',
    id,
    row: {
      status: game.winner ? 'complete' : 'abandoned',
      winner_faction: game.winner?.faction ?? null,
      night_count: game.dayNumber,
      final_state: anonymiseState(game),
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  })
  await flush()
}

export async function recordGameAbandoned(id: string, game: GameState): Promise<void> {
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  if (!data.user?.id) return

  queue({
    table: 'games',
    op: 'update',
    id,
    row: {
      status: 'abandoned',
      night_count: game.dayNumber,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  })
  await flush()
}
