'use client'

/**
 * The offline outbox, CLOUD_PLAN §7.
 *
 * Writes queue in localStorage and flush on app open, on `online`, and after
 * sign-in. A game hosted entirely in a basement syncs whole the next time the
 * app opens with a signal.
 *
 * Every entry is idempotent: upserts key on a client-generated uuid, updates
 * key on that same id. Replaying the queue twice is harmless.
 */

import { supabase } from '@/lib/supabase'

export interface OutboxEntry {
  table: 'games' | 'custom_themes'
  op: 'upsert' | 'update'
  id?: string
  row: Record<string, unknown>
  queuedAt: number
}

const KEY = 'graveshift:outbox'
/** Stop the queue growing without bound if the user is offline for weeks. */
const MAX_ENTRIES = 200

function read(): OutboxEntry[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as OutboxEntry[]) : []
  } catch {
    return []
  }
}

function write(entries: OutboxEntry[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
  } catch {
    /* quota. Dropping telemetry is always better than breaking the game */
  }
}

export function queue(entry: Omit<OutboxEntry, 'queuedAt'>): void {
  write([...read(), { ...entry, queuedAt: Date.now() }])
}

export function pendingCount(): number {
  return read().length
}

let flushing = false

/** Drain the queue. Silent on failure. Entries stay for the next attempt. */
export async function flush(): Promise<void> {
  if (flushing || !supabase) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return

  const entries = read()
  if (entries.length === 0) return

  flushing = true
  const remaining: OutboxEntry[] = []

  try {
    for (const entry of entries) {
      try {
        const q =
          entry.op === 'upsert'
            ? supabase.from(entry.table).upsert(entry.row)
            : supabase.from(entry.table).update(entry.row).eq('id', entry.id ?? '')

        const { error } = await q
        // A row rejected by RLS or a constraint will never succeed on retry, so
        // dropping it beats blocking the queue forever behind a poison entry.
        if (error && !/row-level security|violates|invalid input/i.test(error.message)) {
          remaining.push(entry)
        }
      } catch {
        remaining.push(entry)
      }
    }
  } finally {
    write(remaining)
    flushing = false
  }
}

/** Wire the automatic flush triggers. Returns a cleanup function. */
export function startOutbox(): () => void {
  if (typeof window === 'undefined') return () => {}
  const onOnline = () => void flush()
  window.addEventListener('online', onOnline)
  void flush()
  return () => window.removeEventListener('online', onOnline)
}
