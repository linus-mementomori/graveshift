'use client'

import { useEffect, useState } from 'react'

/**
 * Ambient floating embers, ported from the Werewolves reference design.
 * Colored via --accent so it re-skins with the theme. Off entirely under
 * prefers-reduced-motion (DESIGN.md §6).
 */
export function Particles() {
  const [particles, setParticles] = useState<
    { id: number; left: string; delay: string; duration: string; size: string; opacity: number }[]
  >([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 12}s`,
        duration: `${10 + Math.random() * 10}s`,
        size: `${1 + Math.random() * 2}px`,
        opacity: 0.2 + Math.random() * 0.4,
      })),
    )
  }, [])

  if (particles.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            bottom: '-10px',
            left: p.left,
            width: p.size,
            height: p.size,
            background: 'var(--accent)',
            boxShadow: '0 0 4px var(--accent)',
            animation: `float-particle ${p.duration} ${p.delay} infinite linear`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  )
}
