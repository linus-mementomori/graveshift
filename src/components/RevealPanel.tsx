'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from './ui'

/**
 * Hold-to-reveal — DESIGN.md §5.4.
 *
 * Secret information never appears on a plain tap. There is a countdown so the
 * player can turn away from the table, the content is NOT rendered to the DOM
 * until the hold begins, release hides it instantly, and it auto-hides after 8s.
 */
export function RevealPanel({
  label,
  detail,
  armSeconds = 3,
  warning = 'Cover the screen.',
  onRevealed,
}: {
  label: string
  detail?: string
  armSeconds?: number
  warning?: string
  onRevealed?: () => void
}) {
  const [countdown, setCountdown] = useState(armSeconds)
  const [holding, setHolding] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const armed = countdown <= 0

  useEffect(() => {
    if (armed) return
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, armed])

  // Auto-hide after 8 seconds regardless of whether the finger is still down.
  useEffect(() => {
    if (!holding) return
    onRevealed?.()
    hideTimer.current = setTimeout(() => setHolding(false), 8000)
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [holding, onRevealed])

  const start = () => armed && setHolding(true)
  const stop = () => setHolding(false)

  return (
    <div
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      role="button"
      tabIndex={0}
      aria-label={holding ? label : 'Hold to reveal'}
      className={cn(
        'card-atmo flex min-h-52 select-none flex-col items-center justify-center rounded-2xl border-2 px-6 py-8 text-center transition-colors',
        holding
          ? 'border-[var(--accent)] shadow-[0_0_30px_var(--accent-glow)]'
          : 'border-dashed border-[var(--border-strong)]',
      )}
      style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
    >
      {holding ? (
        // Rendered only while held — never present in the DOM otherwise.
        <>
          <p className="display glow text-4xl text-[var(--accent)]">{label}</p>
          {detail && (
            <p className="speak-sm mt-3 !text-base text-[var(--text-secondary)]">{detail}</p>
          )}
          <p className="caption mt-5 text-[var(--text-muted)]">Release to hide</p>
        </>
      ) : armed ? (
        <>
          <p className="display text-2xl">Hold to reveal</p>
          <p className="caption mt-3 text-[var(--danger)]">{warning}</p>
        </>
      ) : (
        <>
          <p className="display glow text-6xl tabular-nums text-[var(--accent)]">{countdown}</p>
          <p className="caption mt-3 text-[var(--text-muted)]">{warning}</p>
        </>
      )}
    </div>
  )
}
