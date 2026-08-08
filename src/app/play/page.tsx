'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ButtonLink, Screen, Notice } from '@/components/ui'
import { useGameStore } from '@/store/gameStore'
import { NightPhase } from '@/components/play/NightPhase'
import { DawnPhase } from '@/components/play/DawnPhase'
import { DayPhase } from '@/components/play/DayPhase'
import { VotePhase, DuskPhase } from '@/components/play/VotePhase'
import { EndPhase } from '@/components/play/EndPhase'

/**
 * The single play route — ARCHITECTURE.md §2.
 * The phase machine renders into it; `machine.ts` is the only thing that
 * decides which phase we're in.
 */
export default function PlayPage() {
  const game = useGameStore((s) => s.game)
  const router = useRouter()

  // Keep the screen awake during play (ARCHITECTURE §6). Best-effort only.
  useEffect(() => {
    if (!game || game.phase === 'end') return
    let lock: WakeLockSentinel | null = null
    navigator.wakeLock
      ?.request('screen')
      .then((l) => {
        lock = l
      })
      .catch(() => {
        /* unsupported or denied — atmosphere, not a requirement */
      })
    return () => {
      lock?.release().catch(() => {})
    }
  }, [game?.phase, game])

  if (!game) {
    return (
      <Screen title="Play" action={<ButtonLink href="/setup/players">Set up a game</ButtonLink>}>
        <div className="pt-6">
          <Notice>
            No game in progress. Roles have to be dealt before the first night.
          </Notice>
        </div>
      </Screen>
    )
  }

  switch (game.phase) {
    case 'night':
      return <NightPhase game={game} />
    case 'dawn':
      return <DawnPhase game={game} />
    case 'day':
      return <DayPhase game={game} />
    case 'vote':
      return <VotePhase game={game} />
    case 'dusk':
      return <DuskPhase game={game} />
    case 'end':
      return <EndPhase game={game} />
    default:
      router.push('/setup/players')
      return null
  }
}
