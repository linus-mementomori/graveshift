'use client'

import { useMemo, useState } from 'react'
import { Button, CueStrip, Screen, Speak, Notice, cn } from '@/components/ui'
import { SeatGrid } from '@/components/SeatGrid'
import { RevealPanel } from '@/components/RevealPanel'
import { useGameStore } from '@/store/gameStore'
import { getTheme, roleName } from '@/themes'
import { CUES } from '@/audio/cues'
import { beatsForNight, legalTargets, INFORMATIONAL } from '@/engine/machine'
import { investigate, pendingVictims } from '@/engine/resolve'
import type { GameState, Intent } from '@/engine/types'
import { beatNarration, closingLine } from './narration'

export function NightPhase({ game }: { game: GameState }) {
  const { setIntent, cupidPick, clearBeat, advanceBeat, backBeat, finishNight } = useGameStore()
  const theme = getTheme(game.themeId)
  const [witchMode, setWitchMode] = useState<'life' | 'death' | null>(null)
  const [rampage, setRampage] = useState(false)

  const beats = useMemo(() => beatsForNight(game), [game])
  const beat = beats[game.beatIndex]
  const alive = game.seats.filter((s) => s.alive).length

  // Ran past the last beat — resolve the night.
  if (!beat) {
    return (
      <Screen
        title={`Night ${game.dayNumber}`}
        step={`${alive} alive`}
        action={
          <>
            <Button variant="secondary" onClick={backBeat}>
              ← Back
            </Button>
            <Button onClick={finishNight}>Resolve the night →</Button>
          </>
        }
      >
        <div className="pt-10">
          <CueStrip text={theme.cueOverrides.NIGHT_END ?? CUES.NIGHT_END.text} />
          <div className="mt-8">
            <Speak>Everyone, keep your eyes closed. The night is ending.</Speak>
          </div>
        </div>
      </Screen>
    )
  }

  const themedRole = roleName(theme, beat.roleId)
  const cue = beat.cueId ? (theme.cueOverrides[beat.cueId] ?? CUES[beat.cueId].text) : null
  const actor = beat.actors[0]
  const isInfoOnly = INFORMATIONAL.has(beat.id)

  const myIntents = game.intents.filter((i) => i.beatId === beat.id)
  const selectedIds = myIntents.map((i) => i.targetSeatId).filter(Boolean) as string[]

  const options = legalTargets(game, beat, witchMode ?? undefined)
  const victims = beat.id === 'witch_act' ? pendingVictims(game) : []

  // Seer / Gravedigger answers are shown immediately, on a hold-to-reveal panel.
  const answer =
    selectedIds.length > 0 && (beat.id === 'seer_investigate' || beat.id === 'gravedigger_exhume')
      ? investigate(game, beat.id, selectedIds[0])
      : null

  function pick(seatId: string) {
    if (beat.id === 'cupid_link') return cupidPick(seatId)

    const intent: Intent = {
      beatId: beat.id,
      sourceSeatId: actor?.id ?? null,
      targetSeatId: seatId,
    }
    if (beat.id === 'witch_act') intent.variant = witchMode ?? 'death'
    if (beat.id === 'wolves_kill' && rampage) intent.variant = 'rampage'
    setIntent(intent)
  }

  const canAdvance =
    isInfoOnly ||
    selectedIds.length > 0 ||
    (beat.id === 'cupid_link' ? selectedIds.length === 2 : true)

  const alphaHasRampage = game.seats.some(
    (s) => s.alive && s.roleId === 'alpha' && (s.charges.rampage ?? 0) > 0,
  )

  return (
    <Screen
      title={`Night ${game.dayNumber}`}
      step={`${alive} alive · beat ${game.beatIndex + 1}/${beats.length}`}
      action={
        <>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={backBeat} disabled={game.beatIndex === 0}>
              ← Back
            </Button>
            <Button variant="secondary" onClick={() => clearBeat(beat.id)}>
              ↺ Clear
            </Button>
          </div>
          <Button
            onClick={() => {
              setWitchMode(null)
              setRampage(false)
              advanceBeat()
            }}
            disabled={!canAdvance}
          >
            {isInfoOnly ? 'Done — continue' : 'Confirm & continue'}
          </Button>
        </>
      }
    >
      {cue && <CueStrip text={cue} />}

      <p className="caption glow-sm mt-6 text-[var(--accent)]">{themedRole}</p>
      <div className="mt-3">
        <Speak>{beatNarration(theme, beat.id, themedRole)}</Speak>
      </div>

      {/* Night 0: information happens, killing does not (GAME_DESIGN §1). */}
      {game.settings.nightZero && game.dayNumber === 1 && (
        <p className="caption mt-4 text-[var(--warn)]">
          Night 0 — kills tonight will not land.
        </p>
      )}

      {/* Alpha's once-per-game Rampage rides on the wolves' kill beat. */}
      {beat.id === 'wolves_kill' && alphaHasRampage && (
        <label className="mt-5 flex items-center justify-between rounded-xl border border-[var(--border-subtle)] px-4 py-3">
          <span className="text-sm">
            Declare Rampage
            <span className="block text-xs text-[var(--text-muted)]">
              Once per game. Ignores all protection — but the Bodyguard still absorbs.
            </span>
          </span>
          <input
            type="checkbox"
            checked={rampage}
            onChange={(e) => {
              setRampage(e.target.checked)
              if (selectedIds[0]) {
                setIntent({
                  beatId: 'wolves_kill',
                  sourceSeatId: actor?.id ?? null,
                  targetSeatId: selectedIds[0],
                  variant: e.target.checked ? 'rampage' : undefined,
                })
              }
            }}
            className="h-6 w-6 accent-[var(--accent)]"
          />
        </label>
      )}

      {/* The Witch is shown tonight's dying before choosing (§4.1 order 50). */}
      {beat.id === 'witch_act' && (
        <div className="mt-5 space-y-3">
          <Notice>
            {victims.length === 0
              ? 'Nobody is dying tonight.'
              : `About to die: ${victims.map((v) => v.name).join(', ')}.`}
          </Notice>
          <div className="flex gap-3">
            <Button
              variant={witchMode === 'life' ? 'primary' : 'secondary'}
              onClick={() => setWitchMode(witchMode === 'life' ? null : 'life')}
              disabled={(actor?.charges.life ?? 0) <= 0 || victims.length === 0}
            >
              Life {(actor?.charges.life ?? 0) <= 0 && '(spent)'}
            </Button>
            <Button
              variant={witchMode === 'death' ? 'danger' : 'secondary'}
              onClick={() => setWitchMode(witchMode === 'death' ? null : 'death')}
              disabled={(actor?.charges.death ?? 0) <= 0}
            >
              Death {(actor?.charges.death ?? 0) <= 0 && '(spent)'}
            </Button>
          </div>
        </div>
      )}

      {/* Who this beat's actor already knows — the informational beats. */}
      {isInfoOnly && (
        <div className="mt-6">
          <InfoBeatBody game={game} beatId={beat.id} />
        </div>
      )}

      {/* Target picker */}
      {!isInfoOnly && (beat.id !== 'witch_act' || witchMode) && (
        <div className="mt-6">
          <SeatGrid
            options={beat.id === 'witch_act' && witchMode === 'life'
              ? options.filter((o) => victims.some((v) => v.id === o.seat.id))
              : options}
            selectedIds={selectedIds}
            onPick={pick}
          />
          {beat.id === 'cupid_link' && (
            <p className="caption mt-3 text-[var(--text-muted)]">
              Pick two ({selectedIds.length}/2). Tap again to unpick.
            </p>
          )}
        </div>
      )}

      {/* Secret answers never appear on a plain tap (DESIGN §5.4). */}
      {answer && (
        <div className="mt-6">
          <p className="caption mb-2 text-[var(--text-muted)]">
            Show this to {actor?.name}, then relay it silently.
          </p>
          <RevealPanel label={answer.label} detail={answer.detail} armSeconds={2} />
        </div>
      )}

      <p className="caption mt-8 text-center text-[var(--text-muted)]">
        «{closingLine(themedRole)}»
      </p>
    </Screen>
  )
}

/** The "you already know this" beats: lovers, minion, wolves, executioner. */
function InfoBeatBody({ game, beatId }: { game: GameState; beatId: string }) {
  const theme = getTheme(game.themeId)
  const alive = game.seats.filter((s) => s.alive)

  let names: string[] = []
  let caption = ''

  if (beatId === 'wolves_recognise') {
    names = alive.filter((s) => s.roleId === 'werewolf' || s.roleId === 'alpha').map((s) => s.name)
    caption = 'The pack knows each other.'
  } else if (beatId === 'minion_sees') {
    names = alive.filter((s) => s.roleId === 'werewolf' || s.roleId === 'alpha').map((s) => s.name)
    caption = 'The Minion sees these. They do not see the Minion.'
  } else if (beatId === 'lovers_wake') {
    names = alive.filter((s) => s.loverId).map((s) => s.name)
    caption = 'The Lovers see each other.'
  } else if (beatId === 'executioner_target') {
    const exec = alive.find((s) => s.roleId === 'executioner')
    const target = game.seats.find((s) => s.id === exec?.execTargetId)
    names = target ? [target.name] : []
    caption = 'Their mark. They win if this player is executed by vote.'
  } else if (beatId === 'sleepwalker_stir') {
    return (
      <Notice>
        The Sleepwalker learns at dawn whether anyone died — not who. Nothing to do now.
      </Notice>
    )
  }

  if (names.length === 0) return <Notice>Nobody to show. Continue.</Notice>

  return (
    <div>
      <p className="caption mb-2 text-[var(--text-muted)]">{caption}</p>
      <RevealPanel label={names.join(' · ')} armSeconds={2} />
    </div>
  )
}
