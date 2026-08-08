'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'

/**
 * Buy Me a Coffee floating widget.
 *
 * Two things this has to work around:
 *
 * 1. `data-color` is read ONCE, when the script initialises. The widget has no
 *    API to recolour itself afterwards, so following a runtime theme swap means
 *    tearing the whole thing down and re-injecting it. That's what the effect
 *    below does, keyed on the active theme.
 *
 * 2. Its default `y_margin` of 18px puts the button exactly where our floating
 *    dock lives. Raised so the two never overlap.
 *
 * Deliberately absent from /setup and /play: a donation prompt while someone is
 * mid-night with eleven people waiting is the worst possible ask (DONATIONS §4C).
 */

const BMC_ID = process.env.NEXT_PUBLIC_BMC_USERNAME || 'projectremus'

/** Screens that own the whole viewport, or where asking would be rude. */
const HIDDEN_PREFIXES = ['/play', '/setup', '/auth']

const SCRIPT_ID = 'bmc-widget-script'

/** Everything the widget leaves behind, so a re-inject doesn't stack copies. */
function teardown() {
  document.getElementById(SCRIPT_ID)?.remove()
  document.querySelectorAll('#bmc-wbtn, #bmc-wbtn-close, .bmc-btn-container').forEach((el) =>
    el.remove(),
  )
  // The popup iframe is appended separately and has no stable id.
  document
    .querySelectorAll('iframe[src*="buymeacoffee"], div[id^="bmc-"]')
    .forEach((el) => el.remove())
}

export function SupportWidget() {
  const pathname = usePathname() ?? '/'
  const themeId = useGameStore((s) => s.themeId)

  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (hidden) {
      teardown()
      return
    }

    teardown()

    /*
     * Resolve the accent WITHOUT depending on <html data-theme> being current.
     *
     * Two traps here, both hit during development:
     *   1. <ThemeRoot> sets data-theme in its own effect, and React runs child
     *      effects before parent ones — so reading off <html> synchronously
     *      returns the *previous* theme (observed: red widget on a gold theme).
     *   2. Deferring with requestAnimationFrame fixes the ordering but never
     *      fires in a background or non-painting tab, so the widget silently
     *      never loads.
     *
     * Styling a throwaway element with the theme we want sidesteps both:
     * globals.css keys its tokens off [data-theme], so this reads the correct
     * value synchronously no matter what the document is currently set to.
     */
    const probe = document.createElement('div')
    probe.setAttribute('data-theme', themeId)
    probe.style.display = 'none'
    document.body.appendChild(probe)
    const accent =
      getComputedStyle(probe).getPropertyValue('--accent').trim() || '#b5453f'
    probe.remove()

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js'
    script.setAttribute('data-name', 'BMC-Widget')
    script.setAttribute('data-cfasync', 'false')
    script.setAttribute('data-id', BMC_ID)
    script.setAttribute('data-description', 'Support me on Buy me a coffee!')
    script.setAttribute('data-message', '')
    script.setAttribute('data-color', accent)
    script.setAttribute('data-position', 'Right')
    script.setAttribute('data-x_margin', '18')
    // Clears the floating dock (≈64px) plus breathing room.
    script.setAttribute('data-y_margin', '96')
    script.async = true

    // A blocked CDN, an ad blocker, or being offline are all fine — the widget
    // simply never appears, and /support still works.
    script.onerror = () => teardown()

    document.body.appendChild(script)

    return teardown
    // Re-runs on theme change, which is the only way to recolour it.
  }, [themeId, hidden])

  return null
}
