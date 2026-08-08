'use client'

import { cn } from './ui'

const BMC_ID = process.env.NEXT_PUBLIC_BMC_USERNAME || 'projectremus'
export const SUPPORT_URL = `https://buymeacoffee.com/${BMC_ID}`

/**
 * "Buy me a coffee" link that actually opens.
 *
 * A plain <a target="_blank"> is not enough here. It silently does nothing in
 * three situations this app is regularly in:
 *
 *   - installed as a PWA (`display: standalone` in the manifest) — some
 *     platforms, iOS especially, just swallow _blank
 *   - inside an in-app browser (Instagram, Slack, the preview pane)
 *   - behind a popup blocker
 *
 * So: try window.open, and if it returns null — which is exactly what a blocked
 * or ignored popup looks like — navigate this tab instead. Leaving the app is a
 * far better outcome than a button that does nothing.
 *
 * The href stays on the element so middle-click, long-press and "open in new
 * tab" all keep working, and crawlers see a real link.
 */
export function SupportLink({
  className,
  children = '☕ Buy me a coffee',
}: {
  className?: string
  children?: React.ReactNode
}) {
  function open(e: React.MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle modified clicks (new tab, new window, download).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return

    e.preventDefault()
    const win = window.open(SUPPORT_URL, '_blank', 'noopener,noreferrer')
    if (!win) window.location.href = SUPPORT_URL
  }

  return (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={open}
      className={cn(
        'flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-5',
        'border border-[var(--accent)]/50 text-base tracking-wide text-[var(--accent)]',
        'transition-transform duration-[120ms] active:scale-[0.98]',
        className,
      )}
    >
      {children}
    </a>
  )
}
