'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

/**
 * Applies the selected theme to <html data-theme>, which swaps every colour
 * token at once (DESIGN.md §3.1). Also registers the service worker so the app
 * works offline after the first visit (CONTEXT.md D5).
 */
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const themeId = useGameStore((s) => s.themeId)

  useEffect(() => {
    document.documentElement.dataset.theme = themeId
  }, [themeId])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is a progressive enhancement — never block the app */
    })
  }, [])

  return <>{children}</>
}
