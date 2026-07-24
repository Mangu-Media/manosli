import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import SectionHeader from '@/components/SectionHeader'
import HudFrame from '@/components/HudFrame'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ model */

type SourceKey = 'VOCALS' | 'DRUMS' | 'BASS' | 'SYNTH'

interface Source {
  key: SourceKey
  color: string
  glow: string
}

const SOURCES: Source[] = [
  { key: 'VOCALS', color: '#FF3D8A', glow: 'shadow-glow-beat' },
  { key: 'DRUMS', color: '#FFB224', glow: 'shadow-[0_0_40px_rgba(255,178,36,0.4)]' },
  { key: 'BASS', color: '#7C5CFF', glow: 'shadow-glow-pulse' },
  { key: 'SYNTH', color: '#2EE6D6', glow: 'shadow-glow-wave' },
]

type Pos = Record<SourceKey, { x: number; y: number }>

const PRESETS: Record<string, Pos> = {
  STUDIO: {
    VOCALS: { x: 0, y: -1.2 },
    DRUMS: { x: -0.9, y: -2 },
    BASS: { x: 1, y: -2.1 },
    SYNTH: { x: 1.6, y: -0.8 },
  },
  STAGE: {
    VOCALS: { x: 0, y: -2.4 },
    DRUMS: { x: -1.8, y: -2.8 },
    BASS: { x: 1.8, y: -2.8 },
    SYNTH: { x: 0.8, y: -1.6 },
  },
  ARENA: {
    VOCALS: { x: 0, y: -3 },
    DRUMS: { x: -2.6, y: -2.2 },
    BASS: { x: 2.6, y: -2.2 },
    SYNTH: { x: 0, y: -1 },
  },
  'IN THE ROUND': {
    VOCALS: { x: 0, y: -2 },
    DRUMS: { x: 2, y: 0 },
    BASS: { x: 0, y: 2 },
    SYNTH: { x: -2, y: 0 },
  },
}

const SCATTER: Pos = {
  VOCALS: { x: -7, y: -6 },
  DRUMS: { x: 7, y: -7 },
  BASS: { x: 8, y: 6 },
  SYNTH: { x: -8, y: 7 },
}

const RANGE = 6.8 // stage spans ±3.4m
const MAX_R = 3.3

const clampR = (p: { x: number; y: number }) => {
  const r = Math.hypot(p.x, p.y)
  if (r <= MAX_R) return p
  const k = MAX_R / r
  return { x: p.x * k, y: p.y * k }
}

/** angle in degrees, 0 = ahead (up), + = right, normalized [-180,180] */
const angleOf = (p: { x: number; y: number }) => (Math.atan2(p.x, -p.y) * 180) / Math.PI
const norm180 = (a: number) => ((a + 540) % 360) - 180

function relLabel(p: { x: number; y: number }, head: number) {
  const rel = norm180(angleOf(p) - head)
  const abs = Math.abs(rel)
  if (abs > 150) return { text: `${Math.round(180 - abs)}°B`, rel }
  return { text: `${Math.round(abs)}°${rel < 0 ? 'L' : 'R'}`, rel }
}

function binauralCaption(key: SourceKey, rel: number) {
  const a = Math.abs(rel)
  let phrase: string
  if (a <= 12) phrase = 'DEAD AHEAD — CENTER IMAGE LOCKED'
  else if (a <= 55) phrase = rel < 0 ? 'FRONT LEFT' : 'FRONT RIGHT'
  else if (a <= 115) phrase = rel < 0 ? 'HARD LEFT — EXPECT IT BESIDE YOUR EAR' : 'HARD RIGHT — EXPECT IT BEHIND YOUR EAR'
  else phrase = rel < 0 ? 'BEHIND YOUR LEFT SHOULDER' : 'BEHIND YOUR RIGHT SHOULDER'
  return `${key} NOW ${phrase}`
}

/* -------------------------------------------------------------- component */

/** Spatial §2 — the Spatial Stage: drag 4 object-audio sources around the listener */
export default function SpatialStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inView = useInView(panelRef, { once: true, margin: '-20% 0px' })
  const [size, setSize] = useState(0)
  const [pos, setPos] = useState<Pos>(SCATTER)
  const [head, setHead] = useState(0)
  const [dragging, setDragging] = useState<SourceKey | null>(null)
  const [focus, setFocus] = useState<SourceKey>('SYNTH')
  const [preset, setPreset] = useState('STUDIO')
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const posRef = useRef(pos)
  posRef.current = pos

  /* stage size for px transforms */
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize(el.clientWidth))
    ro.observe(el)
    setSize(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  /* entrance: scatter → STUDIO preset, spring, stagger 0.1s */
  useEffect(() => {
    if (!inView) return
    applyPreset('STUDIO', 0.35)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  const applyPreset = useCallback((name: string, extraDelay = 0) => {
    setPreset(name)
    const target = PRESETS[name]
    const start = posRef.current
    const keys = Object.keys(target) as SourceKey[]
    const controls = animate(0, 1, {
      type: 'spring',
      stiffness: 110,
      damping: 17,
      delay: extraDelay,
      onUpdate: (t) => {
        const next = { ...posRef.current }
        keys.forEach((k) => {
          next[k] = {
            x: start[k].x + (target[k].x - start[k].x) * t,
            y: start[k].y + (target[k].y - start[k].y) * t,
          }
        })
        setPos(next)
      },
    })
    // ripple from listener
    const id = Date.now()
    setRipples((r) => [...r, { id, x: 50, y: 50 }])
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 1200)
    return () => controls.stop()
  }, [])

  /* drag */
  const toMeters = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current!.getBoundingClientRect()
    return clampR({
      x: ((clientX - rect.left) / rect.width - 0.5) * RANGE,
      y: ((clientY - rect.top) / rect.height - 0.5) * RANGE,
    })
  }, [])

  const onOrbDown = (key: SourceKey) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(key)
    setFocus(key)
  }
  const onOrbMove = (key: SourceKey) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging !== key || !e.currentTarget.hasPointerCapture(e.pointerId)) return
    setPos((p) => ({ ...p, [key]: toMeters(e.clientX, e.clientY) }))
  }
  const onOrbUp = (key: SourceKey) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging !== key) return
    setDragging(null)
    const p = posRef.current[key]
    const id = Date.now() + Math.random()
    setRipples((r) => [...r, { id, x: 50 + (p.x / RANGE) * 100, y: 50 + (p.y / RANGE) * 100 }])
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 1200)
    void e
  }

  /* keyboard nudge */
  const onOrbKey = (key: SourceKey) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 1 : 0.2
    const d: Record<string, [number, number]> = {
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
    }
    const delta = d[e.key]
    if (!delta) return
    e.preventDefault()
    setFocus(key)
    setPos((p) => ({ ...p, [key]: clampR({ x: p[key].x + delta[0], y: p[key].y + delta[1] }) }))
  }

  /* head slider */
  const sliderRef = useRef<HTMLDivElement>(null)
  const setHeadFromClient = (clientX: number) => {
    const rect = sliderRef.current!.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    setHead(Math.round(t * 180 - 90))
  }
  const onSliderDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setHeadFromClient(e.clientX)
  }
  const onSliderMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setHeadFromClient(e.clientX)
  }

  const scale = size / RANGE
  const focusPos = pos[focus]
  const focusRel = relLabel(focusPos, head).rel

  return (
    <section className="py-28">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.01 // OBJECT AUDIO"
          title={['PUT THE BAND', 'WHERE YOU WANT IT.']}
          accentWords={['WANT']}
          accentDot="bg-wave"
          lede="Four objects on a 3-meter stage. Drag them. Rotate your head. The mix holds its position in the room — like physics says it should."
        />

        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-12%' }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="glass glass-sheen relative mt-14 rounded-3xl p-5 sm:p-8"
          style={{ minHeight: 600 }}
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* ------------------------------------------------ stage */}
            <div
              ref={stageRef}
              className="relative mx-auto aspect-square w-full max-w-[640px] touch-none select-none"
            >
              {/* radar rings */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                {[1, 2, 3].map((m, i) => (
                  <motion.circle
                    key={m}
                    cx="50"
                    cy="50"
                    r={(m / RANGE) * 100}
                    fill="none"
                    stroke="#241A38"
                    strokeWidth="0.35"
                    initial={{ pathLength: 0 }}
                    animate={inView ? { pathLength: 1 } : {}}
                    transition={{ duration: 1, delay: i * 0.12, ease: EASE_OUT_EXPO }}
                  />
                ))}
                {/* crosshair + meter labels */}
                <line x1="50" y1="0" x2="50" y2="100" stroke="#241A38" strokeWidth="0.2" strokeDasharray="1.5 1.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#241A38" strokeWidth="0.2" strokeDasharray="1.5 1.5" />
                {[1, 2, 3].map((m) => (
                  <text key={m} x={50 + (m / RANGE) * 100 + 1.2} y="48.6" fill="#6E6584" fontSize="2.4" fontFamily="JetBrains Mono, monospace">
                    {m}M
                  </text>
                ))}
                {/* drag connector */}
                {dragging && (
                  <line
                    x1={50 + (pos[dragging].x / RANGE) * 100}
                    y1={50 + (pos[dragging].y / RANGE) * 100}
                    x2="50"
                    y2="50"
                    stroke={SOURCES.find((s) => s.key === dragging)!.color}
                    strokeWidth="0.4"
                    strokeDasharray="1.2 1.2"
                    opacity="0.7"
                  />
                )}
              </svg>

              {/* drop ripples */}
              {ripples.map((r) => (
                <span
                  key={r.id}
                  aria-hidden="true"
                  className="spx-drop pointer-events-none absolute h-16 w-16 rounded-full border border-wave"
                  style={{ left: `${r.x}%`, top: `${r.y}%` }}
                />
              ))}

              {/* listener */}
              <motion.div
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1 } : {}}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.25 }}
                className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-wave bg-void/80 shadow-glow-wave">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-wave transition-transform duration-200" style={{ transform: `rotate(${head}deg)` }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="8" r="3.4" />
                    <path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5" />
                    <path d="M12 1.5v2" strokeWidth="2.4" />
                  </svg>
                </div>
              </motion.div>

              {/* source orbs */}
              {SOURCES.map((s, i) => {
                const p = pos[s.key]
                const dist = Math.max(Math.hypot(p.x, p.y), 0.1)
                const halo = 1 + ((MAX_R - Math.min(dist, MAX_R)) / MAX_R) * 0.9
                const px = size / 2 + p.x * scale
                const py = size / 2 + p.y * scale
                return (
                  <div
                    key={s.key}
                    role="button"
                    tabIndex={0}
                    aria-label={`${s.key} source at ${dist.toFixed(1)} meters. Drag or use arrow keys to move.`}
                    onPointerDown={onOrbDown(s.key)}
                    onPointerMove={onOrbMove(s.key)}
                    onPointerUp={onOrbUp(s.key)}
                    onPointerCancel={onOrbUp(s.key)}
                    onKeyDown={onOrbKey(s.key)}
                    className={cn(
                      'absolute left-0 top-0 z-20 flex h-12 w-12 cursor-grab items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse',
                      dragging === s.key && 'z-30 cursor-grabbing',
                    )}
                    style={{ transform: `translate(${px - 24}px, ${py - 24}px)` }}
                  >
                    <span className={cn('spx-bob flex h-full w-full items-center justify-center')} style={{ animationDelay: `${i * 0.55}s` }}>
                      {/* loudness halo */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full transition-transform duration-150"
                        style={{ backgroundColor: s.color, opacity: 0.18, transform: `scale(${halo * 1.9})`, filter: 'blur(6px)' }}
                      />
                      <span
                        className={cn('relative h-6 w-6 rounded-full border-2', s.glow)}
                        style={{ backgroundColor: s.color, borderColor: '#F5F2FB' }}
                      />
                      <span className="absolute -bottom-6 whitespace-nowrap rounded border border-line bg-void/80 px-1.5 py-0.5 font-mono text-[0.55rem] tracking-[0.1em] text-mist">
                        {s.key}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>

            {/* ----------------------------------------- readout column */}
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-line bg-void/50 p-4">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">Field readout</p>
                <ul className="mt-3 space-y-2">
                  {SOURCES.map((s) => {
                    const p = pos[s.key]
                    const dist = Math.max(Math.hypot(p.x, p.y), 0.1)
                    const rel = relLabel(p, head)
                    return (
                      <li key={s.key} className="flex items-center justify-between font-mono text-[0.8125rem] tabular-nums tracking-[0.04em]">
                        <span className="flex items-center gap-2 text-mist">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.key}
                        </span>
                        <span className={cn(focus === s.key ? 'text-ghost' : 'text-smoke')}>
                          {dist.toFixed(1)}M · {rel.text}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-4 border-t border-line pt-3 font-mono text-[0.7rem] leading-relaxed tracking-[0.04em] text-wave">
                  {binauralCaption(focus, focusRel)}
                </p>
              </div>

              {/* head rotation */}
              <div className="rounded-2xl border border-line bg-void/50 p-4">
                <div className="flex items-center justify-between font-mono text-[0.7rem] tracking-[0.06em] text-smoke">
                  <span>HEAD: −90° … +90°</span>
                  <span className="tabular-nums text-wave">{head > 0 ? `+${head}°` : `${head}°`}</span>
                </div>
                <div
                  ref={sliderRef}
                  role="slider"
                  tabIndex={0}
                  aria-label="Head rotation"
                  aria-valuemin={-90}
                  aria-valuemax={90}
                  aria-valuenow={head}
                  onPointerDown={onSliderDown}
                  onPointerMove={onSliderMove}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') setHead((h) => Math.max(-90, h - (e.shiftKey ? 10 : 2)))
                    if (e.key === 'ArrowRight') setHead((h) => Math.min(90, h + (e.shiftKey ? 10 : 2)))
                  }}
                  className="relative mt-3 flex h-11 cursor-pointer touch-none items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse"
                >
                  <span className="absolute inset-x-0 h-1.5 rounded-full bg-line" />
                  <span className="absolute left-1/2 h-3 w-[1px] -translate-x-1/2 bg-smoke" aria-hidden="true" />
                  <span
                    className="absolute h-6 w-6 -translate-x-1/2 rounded-full border-2 border-wave bg-void shadow-glow-wave"
                    style={{ left: `${((head + 90) / 180) * 100}%` }}
                  />
                </div>
              </div>

              {/* presets */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(PRESETS).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => applyPreset(name)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.08em] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse',
                      preset === name
                        ? 'border-wave/70 bg-wave/10 text-wave'
                        : 'border-line text-mist hover:border-wave/40 hover:text-ghost',
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* specs footer */}
              <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <p className="font-mono text-[0.65rem] tracking-[0.08em] text-smoke">
                  OBJECT-BASED · UP TO 64 OBJECTS · 48KHZ/24BIT
                </p>
                <span className="rounded-lg border border-wave/60 px-2.5 py-0.5 font-mono text-[0.65rem] tracking-[0.08em] text-wave">
                  HEAD-TRACKED
                </span>
              </div>
            </div>
          </div>

          <HudFrame className="m-3" />
        </motion.div>
      </div>
    </section>
  )
}
