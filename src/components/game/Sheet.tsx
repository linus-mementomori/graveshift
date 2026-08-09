'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/components/ui'

/**
 * Bottom sheet for the in-game dock.
 *
 * Slides up over the play screen and stops short of the dock, so the host can
 * still see which tab they're in. Tapping the scrim closes it (DESIGN §1
 * principle 7: never trap the host, especially not at 1 a.m.
 */
export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  // Escape closes, and the page behind must not scroll under the sheet.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto flex max-h-[72dvh] w-full max-w-[480px] flex-col',
          'rounded-t-2xl border-t border-[var(--accent)]/30 bg-[var(--bg-base)]',
          // Clears the floating dock so the tab bar stays visible underneath.
          'pb-[calc(84px_+_env(safe-area-inset-bottom))]',
        )}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-2">
          <span className="caption text-[var(--accent)]">{title}</span>
          <button onClick={onClose} aria-label="Close" className="p-1">
            <X size={16} className="text-[var(--text-muted)]" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
      </div>
    </div>
  )
}
