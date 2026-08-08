'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { KOFI_ID } from './SupportLink'

/**
 * Ko-fi floating support widget.
 *
 * Easier to theme than the alternative: Ko-fi takes its colours as arguments to
 * `kofiWidgetOverlay.draw()`, so a theme change is just another draw call —
 * no tearing down and re-injecting the script.
 *
 * Deliberately absent from /setup and /play: a donation prompt while someone is
 * mid-night with eleven people waiting is the worst possible ask (DONATIONS §4C).
 */

/** Screens that own the whole viewport, or where asking would be rude. */
const HIDDEN_PREFIXES = ['/play', '/setup', '/auth']

const SCRIPT_ID = 'kofi-overlay-script'
const SCRIPT_SRC = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, options: Record<string, string>) => void
    }
  }
}

/**
 * Pick black or white for the button label, based on how light the accent is.
 *
 * Our accents span gold (#e0b64a) to deep red (#b5453f). Hard-coding white text
 * would be unreadable on the gold themes, so this uses the standard sRGB
 * luminance weights and flips at the usual midpoint.
 */
function readableTextOn(hex: string): string {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m || m.length < 3) return '#ffffff'
  const [r, g, b] = m.map((h) => parseInt(h, 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.55 ? '#0e0e14' : '#ffffff'
}

/** Remove the rendered widget without unloading the script. */
function clearWidget() {
  document
    .querySelectorAll('.floatingchat-container-wrap, .floatingchat-container-wrap-mobi, #kofi-widget-overlay')
    .forEach((el) => el.remove())
}

export function SupportWidget() {
  const pathname = usePathname() ?? '/'
  const themeId = useGameStore((s) => s.themeId)

  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (hidden) {
      clearWidget()
      return
    }

    /*
     * Resolve the accent WITHOUT depending on <html data-theme> being current.
     *
     * <ThemeRoot> sets data-theme in its own effect, and React runs child
     * effects before parent ones — reading off <html> here returns the
     * *previous* theme's colour. Styling a throwaway element with the theme we
     * want reads the right value synchronously, whatever the document says.
     */
    const probe = document.createElement('div')
    probe.setAttribute('data-theme', themeId)
    probe.style.display = 'none'
    document.body.appendChild(probe)
    const accent = getComputedStyle(probe).getPropertyValue('--accent').trim() || '#b5453f'
    probe.remove()

    const options = {
      type: 'floating-chat',
      'floating-chat.donateButton.text': 'Support Us',
      'floating-chat.donateButton.background-color': accent,
      'floating-chat.donateButton.text-color': readableTextOn(accent),
    }

    const draw = () => {
      // Redrawing stacks a second button unless the first is removed.
      clearWidget()
      try {
        window.kofiWidgetOverlay?.draw(KOFI_ID, options)
      } catch {
        /* widget unavailable — the /account link still works */
      }
    }

    const existing = document.getElementById(SCRIPT_ID)
    if (existing && window.kofiWidgetOverlay) {
      draw()
    } else if (!existing) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = SCRIPT_SRC
      script.async = true
      script.onload = draw
      // Blocked CDN, ad blocker, offline — all fine, the widget just never appears.
      script.onerror = () => clearWidget()
      document.body.appendChild(script)
    } else {
      // Script tag exists but hasn't finished loading; draw when it does.
      existing.addEventListener('load', draw, { once: true })
    }

    return clearWidget
    // Re-draws on theme change, which is how it recolours.
  }, [themeId, hidden])

  return null
}
