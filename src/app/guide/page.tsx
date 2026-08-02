'use client'

import { ButtonLink, Screen } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { getTheme, roleName, roleFlavour } from '@/themes'
import { ROLE_LIST } from '@/engine/roles'
import { HOST_TIPS } from '@/audio/cues'

export default function GuidePage() {
  const themeId = useGameStore((s) => s.themeId)
  const theme = getTheme(themeId)

  return (
    <Screen title="How to host" action={<ButtonLink href="/">← Back</ButtonLink>}>
      <h2 className="display glow-sm text-3xl">The job</h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
        You are not a player. You hold the phone, you read what it shows you, and you keep the
        room moving. The app remembers everything — who is alive, who acted, who is protected —
        so you can spend your attention on delivery instead of bookkeeping.
      </p>

      <h3 className="display glow-sm mt-8 text-xl">Performance</h3>
      <ul className="mt-3 space-y-2">
        {HOST_TIPS.map((t) => (
          <li key={t} className="text-sm text-[var(--text-secondary)]">
            — {t}
          </li>
        ))}
      </ul>

      <h3 className="display glow-sm mt-8 text-xl">Roles in {theme.name}</h3>
      <div className="mt-3 space-y-3">
        {ROLE_LIST.map((r) => (
          <div key={r.id}>
            <p className="text-sm font-medium text-[var(--accent)]">{roleName(theme, r.id)}</p>
            <p className="text-xs text-[var(--text-secondary)]">{r.summary}</p>
            <p className="speak-sm mt-1 !text-sm text-[var(--text-muted)]">
              {roleFlavour(theme, r.id)}
            </p>
          </div>
        ))}
      </div>
    </Screen>
  )
}
