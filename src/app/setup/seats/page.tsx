'use client'

import { useState } from 'react'
import { ButtonLink, Button, Screen, Speak } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { getTheme } from '@/themes'

/**
 * Names and introductions, in one pass.
 *
 * The host is already going round the table asking "what's your name?", so the
 * introduction rides along with it: ask, listen, type. One lap of the table
 * instead of two, which is why this doesn't get its own screen.
 *
 * The scene is read FIRST, before any names, so people introduce themselves
 * into somewhere rather than into a blank. Roles are still hidden here, which
 * is fine: the intro is who you are in this town, not what card you're holding.
 */
export default function SeatsPage() {
  const { playerCount, names, setName, themeId } = useGameStore()
  const theme = getTheme(themeId)
  const [sceneRead, setSceneRead] = useState(false)

  return (
    <Screen
      title="Setup"
      step="4 of 5"
      action={
        sceneRead ? (
          <ButtonLink href="/setup/deal">Deal the roles →</ButtonLink>
        ) : (
          <Button onClick={() => setSceneRead(true)}>Now go round the table →</Button>
        )
      }
    >
      {!sceneRead ? (
        <>
          <h2 className="display glow-sm text-3xl">Where we are</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Read this out. Let the room go quiet before you start.
          </p>

          <div className="mt-6">
            <Speak>{theme.narration.opening}</Speak>
          </div>
        </>
      ) : (
        <>
          <h2 className="display glow-sm text-3xl">Who&apos;s here?</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            Enter them in the order they&apos;re sitting. You&apos;ll be reading this list in the
            dark.
          </p>

          <div className="mt-5">
            <Speak>{theme.narration.intro}</Speak>
          </div>

          <p className="caption mt-3 leading-relaxed text-[var(--text-muted)]">
            Ask each person as you type them in. One line each.
          </p>

          <ol className="mt-6 space-y-2">
            {Array.from({ length: playerCount }, (_, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="caption w-5 shrink-0 text-right text-[var(--text-muted)] tabular-nums">
                  {i + 1}
                </span>
                <input
                  value={names[i] ?? ''}
                  onChange={(e) => setName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 text-base outline-none focus:border-[var(--accent)]"
                />
              </li>
            ))}
          </ol>

          <button
            onClick={() => setSceneRead(false)}
            className="caption mt-6 text-[var(--text-muted)] underline underline-offset-4"
          >
            Read the scene again
          </button>
        </>
      )}
    </Screen>
  )
}
