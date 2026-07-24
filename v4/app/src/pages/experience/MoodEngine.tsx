import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import SonarRipple from '@/components/SonarRipple'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useScrambledText } from './useScrambledText'

/* ── mood math ────────────────────────────────────────────────────────────── */

type Weather = 'CLEAR' | 'RAIN' | 'SNOW' | 'HEAT'
const WEATHERS: Weather[] = ['CLEAR', 'RAIN', 'SNOW', 'HEAT']

interface Signals {
  hr: number
  pace: number
  hour: number
  weather: Weather
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function moodVector(s: Signals) {
  const hrN = (s.hr - 48) / 128
  const paceN = s.pace / 12
  const n = clamp01(0.5 + 0.5 * Math.cos(((s.hour - 1.5) * 2 * Math.PI) / 24))
  const e = clamp01(0.12 + 0.6 * hrN + 0.35 * paceN + (s.weather === 'HEAT' ? 0.06 : 0) - (s.weather === 'SNOW' ? 0.04 : 0))
  const vBase = s.weather === 'CLEAR' ? 0.72 : s.weather === 'RAIN' ? 0.42 : s.weather === 'SNOW' ? 0.55 : 0.6
  const v = clamp01(vBase + 0.1 * (1 - n) + 0.08 * (e - 0.5))
  return { e, v, n }
}

type RGB = [number, number, number]
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** HR↑ → magenta/hot · late hour → deep violet/calm · rain → desaturated blue-violet */
function moodColor(e: number, n: number, weather: Weather): RGB {
  let c = mix([104, 70, 235], [255, 61, 138], e)
  if (weather === 'RAIN') c = mix(c, [96, 102, 178], 0.45)
  if (weather === 'SNOW') c = mix(c, [140, 150, 210], 0.35)
  if (weather === 'HEAT') c = mix(c, [255, 178, 36], 0.18)
  return mix(c, [70, 50, 140], n * 0.25)
}

/* ── playlist pool & scoring ──────────────────────────────────────────────── */

interface Track {
  title: string
  artist: string
  art: string
  e: number
  n: number
  weather?: Weather
}

const POOL: Track[] = [
  { title: 'Pastel Static', artist: 'Nuwave', art: '/assets/album-05.png', e: 0.35, n: 0.75, weather: 'RAIN' },
  { title: 'Concrete Bloom', artist: 'Kessler', art: '/assets/album-06.png', e: 0.55, n: 0.5 },
  { title: 'Low Orbit', artist: 'Aphelion', art: '/assets/album-07.png', e: 0.25, n: 0.9, weather: 'SNOW' },
  { title: 'Honey Waves', artist: 'Gold Hour', art: '/assets/album-08.png', e: 0.4, n: 0.85, weather: 'HEAT' },
  { title: 'Midnight Circuit', artist: 'Vector Aurora', art: '/assets/album-01.png', e: 0.9, n: 0.6 },
  { title: 'Glasshouse FM', artist: 'Mira Solis', art: '/assets/album-02.png', e: 0.5, n: 0.55, weather: 'RAIN' },
  { title: 'Tidal Logic', artist: 'Deep Current', art: '/assets/album-03.png', e: 0.3, n: 0.4, weather: 'CLEAR' },
  { title: 'Ember Drives', artist: 'Canyon Run', art: '/assets/album-04.png', e: 0.75, n: 0.3, weather: 'HEAT' },
]

interface Scored extends Track {
  match: number
}

function rescorePlaylist(s: Signals): Scored[] {
  const { e, n } = moodVector(s)
  return POOL.map((t, idx) => {
    const score = clamp01(1 - (Math.abs(t.e - e) * 0.55 + Math.abs(t.n - n) * 0.35) + (t.weather === s.weather ? 0.12 : 0))
    return { ...t, idx, match: Math.min(99, Math.max(87, Math.round(88 + score * 11))) }
  })
    .sort((a, b) => b.match - a.match || a.idx - b.idx)
    .slice(0, 5)
}

/* ── custom signal slider (1px line track, aurora fill, 20px knob) ────────── */

interface SignalSliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
}

function SignalSlider({ label, min, max, step, value, onChange, format }: SignalSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const pct = ((value - min) / (max - min)) * 100

  const setFromClientX = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0) return
      const p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const raw = min + p * (max - min)
      const snapped = Math.min(max, Math.max(min, Math.round(raw / step) * step))
      onChange(Number(snapped.toFixed(4)))
    },
    [min, max, step, onChange],
  )

  const onPointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    ev.currentTarget.setPointerCapture(ev.pointerId)
    setDragging(true)
    setFromClientX(ev.clientX)
  }
  const onPointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) setFromClientX(ev.clientX)
  }
  const endDrag = () => setDragging(false)

  const onKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    const big = step * 10
    let next: number | null = null
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') next = value + step
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') next = value - step
    else if (ev.key === 'PageUp') next = value + big
    else if (ev.key === 'PageDown') next = value - big
    else if (ev.key === 'Home') next = min
    else if (ev.key === 'End') next = max
    if (next !== null) {
      ev.preventDefault()
      onChange(Number(Math.min(max, Math.max(min, next)).toFixed(4)))
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[0.8125rem] uppercase tracking-[0.22em] text-smoke">{label}</span>
        <span className="font-mono text-sm text-ghost font-tabular">{format(value)}</span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className="group relative mt-3 flex h-6 cursor-pointer touch-none items-center outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-void"
      >
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        <span className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-aurora" style={{ width: `${pct}%` }} />
        <span
          className={cn(
            'absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-void bg-ghost transition-[box-shadow,transform] duration-200',
            dragging ? 'scale-110 shadow-glow-pulse' : 'group-hover:shadow-glow-pulse',
          )}
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/* ── mood orb (200px canvas, 60fps lerp, paused offscreen) ────────────────── */

interface MoodOrbProps {
  e: number
  n: number
  weather: Weather
}

const MoodOrb = memo(function MoodOrb({ e, n, weather }: MoodOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetRef = useRef({ e, n, weather })
  // keep the render-loop's targets in sync (post-commit, so no ref access in render)
  useEffect(() => {
    targetRef.current = { e, n, weather }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const SIZE = 200
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // displayed values — lerped 60fps toward targets
    const shown = { e: targetRef.current.e, n: targetRef.current.n, c: moodColor(targetRef.current.e, targetRef.current.n, targetRef.current.weather) as RGB }
    let angle = 0
    let raf = 0
    let running = true
    let last = performance.now()

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const t = targetRef.current
      const tc = moodColor(t.e, t.n, t.weather)
      // 60fps lerp
      const k = reduced ? 1 : 0.08
      shown.e += (t.e - shown.e) * k
      shown.n += (t.n - shown.n) * k
      shown.c = mix(shown.c, tc, k)

      const { e: E, c: C } = shown
      const cx = SIZE / 2
      const cy = SIZE / 2
      const breathe = reduced ? 1 : 1 + 0.03 * Math.sin(now / 1000 * (0.8 + E * 0.6))
      const [r, g, b] = C.map(Math.round)

      ctx.clearRect(0, 0, SIZE, SIZE)

      // outer glow
      const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 98)
      glow.addColorStop(0, `rgba(${r},${g},${b},${(0.16 + E * 0.2).toFixed(3)})`)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, 98, 0, Math.PI * 2)
      ctx.fill()

      // orb body
      const orbR = (52 + E * 6) * breathe
      const body = ctx.createRadialGradient(cx - orbR * 0.25, cy - orbR * 0.3, orbR * 0.1, cx, cy, orbR)
      body.addColorStop(0, `rgba(255,255,255,${(0.5 + E * 0.3).toFixed(3)})`)
      body.addColorStop(0.35, `rgba(${r},${g},${b},0.95)`)
      body.addColorStop(1, `rgba(${Math.round(r * 0.35)},${Math.round(g * 0.35)},${Math.round(b * 0.5)},0.9)`)
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2)
      ctx.fill()

      // particle ring — count scales with energy
      const count = Math.round(10 + E * 38)
      angle += dt * (0.15 + E * 0.55) * (reduced ? 0 : 1)
      for (let i = 0; i < count; i++) {
        const frac = i / count
        const jitter = ((i * 137) % 17) - 8
        const rr = 74 + jitter + 6 * Math.sin(now / 900 + i)
        const a = angle + frac * Math.PI * 2
        const px = cx + Math.cos(a) * rr
        const py = cy + Math.sin(a) * rr
        const tw = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(now / 500 + i * 2.1))
        ctx.beginPath()
        ctx.arc(px, py, 1.1 + (i % 3) * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${Math.min(255, r + 70)},${Math.min(255, g + 70)},${Math.min(255, b + 70)},${tw.toFixed(3)})`
        ctx.fill()
      }

      if (!reduced && running) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting
        if (running && !reduced) {
          cancelAnimationFrame(raf)
          last = performance.now()
          raf = requestAnimationFrame(draw)
        }
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ width: 200, height: 200 }} aria-hidden="true" />
})

/* ── the demo ─────────────────────────────────────────────────────────────── */

const DEFAULT_SIGNALS: Signals = { hr: 72, pace: 1.4, hour: 21, weather: 'RAIN' }

/** Experience §3 — on-device Mood Engine: signal console + mood orb + generated playlist */
export default function MoodEngine() {
  const [signals, setSignals] = useState<Signals>(DEFAULT_SIGNALS)
  const [playlist, setPlaylist] = useState<Scored[]>(() => rescorePlaylist(DEFAULT_SIGNALS))
  const [scoring, setScoring] = useState(false)
  const [flash, setFlash] = useState(false)
  const [rescoreMs, setRescoreMs] = useState(87)

  const { e, v, n } = moodVector(signals)
  const vectorText = `MOOD VECTOR: E${e.toFixed(2)} V${v.toFixed(2)} N${n.toFixed(2)}`
  const scrambledVector = useScrambledText(vectorText, true, 10)
  const scrambledMs = useScrambledText(`RE-SCORED IN ${rescoreMs}MS`, true, 24)

  // debounced 400ms settle → 300ms RE-SCORING shimmer → rows crossfade in new order
  const timersRef = useRef<number[]>([])
  useEffect(() => {
    const timers = timersRef.current
    const settle = window.setTimeout(() => {
      setScoring(true)
      const done = window.setTimeout(() => {
        setPlaylist(rescorePlaylist(signals))
        const { e: E, n: N } = moodVector(signals)
        setRescoreMs(74 + Math.round((E * 37 + N * 23) % 26))
        setScoring(false)
        setFlash(true)
        const unflash = window.setTimeout(() => setFlash(false), 200)
        timers.push(unflash)
      }, 300)
      timers.push(done)
    }, 400)
    timers.push(settle)
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      timers.length = 0
    }
  }, [signals])

  const set = useCallback(<K extends keyof Signals>(key: K, val: Signals[K]) => {
    setSignals((s) => ({ ...s, [key]: val }))
  }, [])

  const chipBase = 'rounded-lg border px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] transition-[border-color,color] duration-200'

  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.02 // MOOD ENGINE"
          title={['IT READS THE ROOM.', 'THE ROOM IS YOU.']}
          accentWords={['YOU']}
          accentDot="bg-beat"
          lede="Four on-device neural networks fuse live signals into a mood vector — and re-score your library against it in under 90 milliseconds. Slide the signals. Watch the music follow."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[45%_55%] lg:gap-8">
          {/* signal console */}
          <motion.div
            initial={{ x: -64, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-25%' }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className="glass glass-sheen rounded-2xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">SIGNAL INPUT</p>
              <span className="rounded-lg border border-line px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-mist">SIMULATED</span>
            </div>

            <div className="mt-8 space-y-7">
              <SignalSlider label="HEART RATE" min={48} max={176} step={1} value={signals.hr} onChange={(val) => set('hr', val)} format={(val) => `${Math.round(val)} BPM`} />
              <SignalSlider label="PACE" min={0} max={12} step={0.1} value={signals.pace} onChange={(val) => set('pace', val)} format={(val) => `${val.toFixed(1)} KM/H`} />
              <SignalSlider label="HOUR" min={0} max={23} step={1} value={signals.hour} onChange={(val) => set('hour', val)} format={(val) => `${String(Math.round(val)).padStart(2, '0')}:00`} />
              <div>
                <span className="font-mono text-[0.8125rem] uppercase tracking-[0.22em] text-smoke">WEATHER</span>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {WEATHERS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => set('weather', w)}
                      aria-pressed={signals.weather === w}
                      className={cn(
                        'rounded-lg border py-2 font-mono text-[0.8125rem] tracking-[0.04em] transition-all duration-300',
                        signals.weather === w
                          ? 'border-pulse/70 bg-pulse/10 text-ghost shadow-glow-pulse'
                          : 'border-line text-mist hover:border-pulse/40 hover:text-ghost',
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-8 border-t border-line/60 pt-5 font-mono text-[0.8125rem] leading-[1.5] tracking-[0.04em] text-smoke">
              SIGNALS FUSE ON-DEVICE. NOTHING LEAVES THIS CONSOLE.
            </p>
          </motion.div>

          {/* mood orb + generated playlist */}
          <motion.div
            initial={{ x: 64, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-25%' }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE_OUT_EXPO }}
            className="glass glass-sheen relative overflow-hidden rounded-2xl p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(chipBase, flash ? 'border-pulse text-ghost' : 'border-line text-mist')}>
                <span className="font-tabular">{scrambledVector}</span>
              </span>
              <span className={cn(chipBase, flash ? 'border-wave text-ghost' : 'border-line text-mist')}>
                <span className="font-tabular">{scrambledMs}</span>
              </span>
              <span className={cn(chipBase, 'flex items-center gap-1.5 border-wave/50 text-wave')}>
                <ShieldCheck className="h-3.5 w-3.5" />
                ON-DEVICE · NOTHING UPLOADED
              </span>
            </div>

            {/* orb with idle sonar ripple (every 4s) */}
            <div className="relative mx-auto mt-6 flex h-[200px] w-[200px] items-center justify-center">
              <SonarRipple className="[&_span]:[animation-duration:4s]" />
              <MoodOrb e={e} n={n} weather={signals.weather} />
            </div>

            {/* generated playlist */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">GENERATED QUEUE</p>
                <span
                  className={cn(
                    'font-mono text-[0.8125rem] tracking-[0.04em] transition-opacity duration-200',
                    scoring ? 'text-beat opacity-100' : 'opacity-0',
                  )}
                >
                  RE-SCORING…
                </span>
              </div>
              <div className="relative mt-3 overflow-hidden rounded-xl border border-line/60">
                {/* shimmer sweep while re-scoring */}
                <AnimatePresence>
                  {scoring && (
                    <motion.div
                      key="shimmer"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'linear' }}
                      className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-transparent via-pulse/25 to-transparent"
                    />
                  )}
                </AnimatePresence>
                <ul>
                  <AnimatePresence initial={false}>
                    {playlist.map((t, i) => (
                      <motion.li
                        key={t.title}
                        layout
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.35, delay: i * 0.05, ease: EASE_OUT_EXPO }}
                        className={cn('flex items-center gap-3 px-3 py-2.5', i > 0 && 'border-t border-line/40')}
                      >
                        <img src={t.art} alt="" className="h-10 w-10 rounded-md border border-line object-cover" loading="lazy" />
                        <span className="flex-1 truncate text-sm text-ghost">
                          {t.title} <span className="text-mist">— {t.artist}</span>
                        </span>
                        <span className="font-mono text-[0.8125rem] text-wave font-tabular">MATCH {t.match}%</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 font-mono text-[0.8125rem] leading-[1.5] tracking-[0.04em] text-smoke"
        >
          Demo simulates the on-device pipeline. In the app, signals come from your watch, earbuds, and sensors — with
          your explicit permission, per source.
        </motion.p>
      </div>
    </section>
  )
}
