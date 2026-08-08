'use client'

/**
 * Generated sound — ARCHITECTURE §7, permitted by CONTEXT.md D2.
 *
 * Every sound here is SYNTHESISED from oscillators and noise at runtime.
 * Nothing is fetched, nothing is shipped, nothing is sampled from a recording.
 * That is a deliberate legal position, not a technical preference:
 *
 *   - zero licensing risk — we own every waveform because we generate it
 *   - zero bundle cost — this file is ~4 kB and replaces megabytes of audio
 *   - works in airplane mode, which is the whole point of the app (D5)
 *
 * The trade-off is honest: a synthesised howl will never sound as good as a
 * real field recording. If you want photoreal audio later, the right route is
 * self-hosted CC0 files (see docs/AUDIO.md), never hotlinked soundboards.
 */

export type PatchId = 'drone' | 'chime' | 'heartbeat' | 'hit' | 'tick' | 'howl'

let ctx: AudioContext | null = null
let master: GainNode | null = null
/** Sustained patches are stoppable; one-shots are not. */
let sustained: { stop: () => void } | null = null

/**
 * iOS refuses to create a running AudioContext outside a user gesture, so this
 * is called lazily from the tap that wants the sound — never at module load.
 */
function audio(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null

  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return { ctx, master: master! }
}

/** Short burst of white noise, used by the percussive patches. */
function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const frames = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

function envelope(gain: GainNode, ctx: AudioContext, attack: number, decay: number, peak = 1) {
  const t = ctx.currentTime
  gain.gain.cancelScheduledValues(t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(peak, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

/** A low, uneasy bed. Sustained until stopped. */
function playDrone(ctx: AudioContext, out: GainNode) {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 2.5)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 220
  filter.Q.value = 6

  // Two detuned voices beat against each other, which is what makes a drone
  // feel alive rather than like a test tone.
  const voices = [55, 55.4, 82.5].map((freq) => {
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    osc.connect(filter)
    osc.start()
    return osc
  })

  filter.connect(gain)
  gain.connect(out)

  return {
    stop() {
      const t = ctx.currentTime
      gain.gain.cancelScheduledValues(t)
      gain.gain.setValueAtTime(gain.gain.value, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      voices.forEach((v) => v.stop(t + 1.3))
    },
  }
}

function playChime(ctx: AudioContext, out: GainNode) {
  const gain = ctx.createGain()
  gain.connect(out)
  envelope(gain, ctx, 0.005, 1.8, 0.3)

  // Inharmonic partials read as "bell" rather than "beep".
  ;[880, 1320, 2640].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const partial = ctx.createGain()
    partial.gain.value = 1 / (i + 1.5)
    osc.connect(partial)
    partial.connect(gain)
    osc.start()
    osc.stop(ctx.currentTime + 2)
  })
}

function playHeartbeat(ctx: AudioContext, out: GainNode) {
  const thump = (at: number, peak: number) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(62, ctx.currentTime + at)
    osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + at + 0.14)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + at)
    gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + at + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.22)
    osc.connect(gain)
    gain.connect(out)
    osc.start(ctx.currentTime + at)
    osc.stop(ctx.currentTime + at + 0.3)
  }
  // lub-dub, twice
  thump(0, 0.8)
  thump(0.26, 0.5)
  thump(1.0, 0.8)
  thump(1.26, 0.5)
}

function playHit(ctx: AudioContext, out: GainNode) {
  // Noise crack…
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx, 0.3)
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 900
  const ng = ctx.createGain()
  envelope(ng, ctx, 0.002, 0.16, 0.5)
  src.connect(hp)
  hp.connect(ng)
  ng.connect(out)
  src.start()

  // …over a body thud, so it lands in the chest as well as the ear.
  const osc = ctx.createOscillator()
  const og = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(140, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.25)
  envelope(og, ctx, 0.002, 0.3, 0.9)
  osc.connect(og)
  og.connect(out)
  osc.start()
  osc.stop(ctx.currentTime + 0.4)
}

function playTick(ctx: AudioContext, out: GainNode) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = 1400
  envelope(gain, ctx, 0.001, 0.03, 0.25)
  osc.connect(gain)
  gain.connect(out)
  osc.start()
  osc.stop(ctx.currentTime + 0.06)
}

/**
 * A wolf howl, from a pitch-swept saw through a formant-ish bandpass.
 * Not a recording — closer to someone doing a good impression, which suits an
 * app whose whole premise is that the host performs.
 */
function playHowl(ctx: AudioContext, out: GainNode) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(240, t)
  osc.frequency.exponentialRampToValueAtTime(520, t + 0.7)
  osc.frequency.setValueAtTime(520, t + 1.5)
  osc.frequency.exponentialRampToValueAtTime(300, t + 2.6)

  // Slight wobble stops it sounding like a siren.
  const vibrato = ctx.createOscillator()
  const vibratoGain = ctx.createGain()
  vibrato.frequency.value = 5.5
  vibratoGain.gain.value = 11
  vibrato.connect(vibratoGain)
  vibratoGain.connect(osc.frequency)
  vibrato.start(t)
  vibrato.stop(t + 3)

  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 900
  band.Q.value = 3

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.5, t + 0.35)
  gain.gain.setValueAtTime(0.5, t + 1.6)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.9)

  osc.connect(band)
  band.connect(gain)
  gain.connect(out)
  osc.start(t)
  osc.stop(t + 3)
}

/** Play a patch. Safe to call before any gesture — it simply no-ops. */
export function play(patch: PatchId): void {
  const a = audio()
  if (!a) return

  // Only one sustained sound at a time; a second drone over the first is noise.
  if (sustained) {
    sustained.stop()
    sustained = null
  }

  switch (patch) {
    case 'drone':
      sustained = playDrone(a.ctx, a.master)
      break
    case 'chime':
      playChime(a.ctx, a.master)
      break
    case 'heartbeat':
      playHeartbeat(a.ctx, a.master)
      break
    case 'hit':
      playHit(a.ctx, a.master)
      break
    case 'tick':
      playTick(a.ctx, a.master)
      break
    case 'howl':
      playHowl(a.ctx, a.master)
      break
  }
}

/** Stop anything sustained (the drone). One-shots finish on their own. */
export function stopAll(): void {
  sustained?.stop()
  sustained = null
}

export const isPlayingSustained = () => sustained !== null
