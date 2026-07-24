import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { Glasses, Headphones, Laptop, Smartphone, Speaker, Watch } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import SpectrumBars from '@/components/SpectrumBars'
import SonarRipple from '@/components/SonarRipple'
import { EASE_IN_OUT_QUART, EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

type DeviceId = 'phone' | 'watch' | 'earbuds' | 'glasses' | 'speaker' | 'laptop'

interface DeviceSpec {
  id: DeviceId
  label: string
  Icon: ComponentType<{ className?: string }>
  /** desktop position on the arc, % of stage */
  x: number
  y: number
  cardAlign: 'left' | 'center' | 'right'
}

const DEVICES: DeviceSpec[] = [
  { id: 'phone', label: 'PHONE', Icon: Smartphone, x: 8, y: 58, cardAlign: 'left' },
  { id: 'watch', label: 'WATCH', Icon: Watch, x: 22, y: 24, cardAlign: 'center' },
  { id: 'earbuds', label: 'EARBUDS', Icon: Headphones, x: 38, y: 10, cardAlign: 'center' },
  { id: 'glasses', label: 'GLASSES', Icon: Glasses, x: 62, y: 10, cardAlign: 'center' },
  { id: 'speaker', label: 'SPEAKER', Icon: Speaker, x: 78, y: 24, cardAlign: 'center' },
  { id: 'laptop', label: 'LAPTOP', Icon: Laptop, x: 92, y: 58, cardAlign: 'right' },
]

interface Pt {
  x: number
  y: number
}

interface Flight {
  key: number
  from: DeviceId
  to: DeviceId
  d: string
}

interface LogLine {
  id: number
  text: string
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** quadratic bezier point at t */
function qb(p0: number, c: number, p1: number, t: number) {
  const u = 1 - t
  return u * u * p0 + 2 * u * t * c + t * t * p1
}

/** faint dashed stream from YOU to the live device; perpetual dash flow, isolated + memoized */
const YouLine = memo(function YouLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#2EE6D6"
      strokeWidth="1"
      strokeDasharray="4 7"
      opacity="0.4"
      animate={{ strokeDashoffset: [0, -22] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
    />
  )
})

/** Ecosystem §2 — tap a device, the session token teleports to it */
export default function HandoffStage() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const stageRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Partial<Record<DeviceId, HTMLButtonElement | null>>>({})
  const youRef = useRef<HTMLDivElement>(null)

  const [active, setActive] = useState<DeviceId>('phone')
  const [flight, setFlight] = useState<Flight | null>(null)
  const [fadeTrail, setFadeTrail] = useState<string | null>(null)
  const [flash, setFlash] = useState<DeviceId | null>(null)
  const [ripple, setRipple] = useState<DeviceId | null>(null)
  const [log, setLog] = useState<LogLine[]>([{ id: 0, text: 'session live on phone · stream locked' }])
  const [centers, setCenters] = useState<Partial<Record<DeviceId | 'you', Pt>>>({})

  const tokenX = useMotionValue(-100)
  const tokenY = useMotionValue(-100)
  const logId = useRef(1)
  const flightKey = useRef(0)

  const appendLog = (text: string) =>
    setLog((l) => [...l.slice(-4), { id: logId.current++, text }])

  const centerOf = (el: HTMLElement, stageRect: DOMRect): Pt => {
    const r = el.getBoundingClientRect()
    return { x: r.left - stageRect.left + r.width / 2, y: r.top - stageRect.top + r.height / 2 }
  }

  /** measure all node + YOU centers (post-entrance, on resize / layout mode change) */
  const measure = () => {
    const stage = stageRef.current
    if (!stage) return
    const sr = stage.getBoundingClientRect()
    const next: Partial<Record<DeviceId | 'you', Pt>> = {}
    for (const d of DEVICES) {
      const el = nodeRefs.current[d.id]
      if (el) next[d.id] = centerOf(el, sr)
    }
    if (youRef.current) next.you = centerOf(youRef.current, sr)
    setCenters(next)
  }

  useLayoutEffect(() => {
    // entrance transforms settle ~1.2s in; measure then, and on resize
    const t = window.setTimeout(measure, 1300)
    window.addEventListener('resize', measure)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop])

  const handoff = (to: DeviceId) => {
    if (flight || to === active) return
    const stage = stageRef.current
    const fromEl = nodeRefs.current[active]
    const toEl = nodeRefs.current[to]
    if (!stage || !fromEl || !toEl) return
    const sr = stage.getBoundingClientRect()
    const p0 = centerOf(fromEl, sr)
    const p1 = centerOf(toEl, sr)
    const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y)
    // desktop: curved path lifted upward; mobile: straightened path
    const lift = isDesktop ? Math.min(130, Math.max(50, dist * 0.3)) : 0
    const cp = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 - lift }
    const d = `M ${p0.x} ${p0.y} Q ${cp.x} ${cp.y} ${p1.x} ${p1.y}`
    const from = active
    const key = ++flightKey.current
    setFlight({ key, from, to, d })

    animate(0, 1, {
      duration: 0.9,
      ease: EASE_IN_OUT_QUART,
      onUpdate: (t) => {
        tokenX.set(qb(p0.x, cp.x, p1.x, t) - 8)
        tokenY.set(qb(p0.y, cp.y, p1.y, t) - 8)
      },
      onComplete: () => {
        setActive(to)
        setFlight(null)
        setFadeTrail(d)
        window.setTimeout(() => setFadeTrail(null), 600)
        setFlash(to)
        window.setTimeout(() => setFlash(null), 800)
        const ms = 18 + Math.round(Math.random() * 24)
        appendLog(`handoff ${from} → ${to} · ${ms}ms · stream unbroken`)
      },
    })
  }

  const pokeActive = (id: DeviceId) => {
    if (id !== active || flight) return
    setRipple(id)
    window.setTimeout(() => setRipple(null), 1500)
    appendLog('already live here — nice try')
  }

  const arcs: string[] = []
  if (isDesktop && centers.phone && centers.laptop) {
    for (let i = 0; i < DEVICES.length - 1; i++) {
      const a = centers[DEVICES[i].id]
      const b = centers[DEVICES[i + 1].id]
      if (!a || !b) continue
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2 - 42
      arcs.push(`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`)
    }
  }
  const youLine =
    centers.you && centers[active]
      ? { x1: centers.you.x, y1: centers.you.y, x2: centers[active]!.x, y2: centers[active]!.y }
      : null

  return (
    <section className="border-y border-line bg-abyss py-28">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.01 // HANDOFF"
          title={['TAP A DEVICE.', 'THE MUSIC TELEPORTS.']}
          accentWords={['TELEPORTS']}
          accentDot="bg-wave"
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="glass glass-sheen relative mt-14 overflow-hidden rounded-3xl p-6 md:min-h-[480px]"
        >
          {/* SVG overlay: neighbor arcs, YOU link, flight trail */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {arcs.map((d, i) => (
              <motion.path
                key={d}
                d={d}
                fill="none"
                stroke="#241A38"
                strokeWidth="1"
                strokeDasharray="3 6"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 1.2, delay: 1.2 + i * 0.12, ease: EASE_OUT_EXPO }}
              />
            ))}
            {youLine && <YouLine x1={youLine.x1} y1={youLine.y1} x2={youLine.x2} y2={youLine.y2} />}
            {flight && (
              <motion.path
                key={flight.key}
                d={flight.d}
                fill="none"
                stroke="#2EE6D6"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.55"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: EASE_IN_OUT_QUART }}
              />
            )}
            {fadeTrail && (
              <motion.path
                d={fadeTrail}
                fill="none"
                stroke="#2EE6D6"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ opacity: 0.55 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.55 }}
              />
            )}
          </svg>

          {/* device nodes: absolute arc on desktop, 2-col grid on mobile */}
          <div className="relative grid grid-cols-2 gap-x-4 gap-y-10 pt-4 md:block">
            {DEVICES.map((d, i) => {
              const isActive = active === d.id
              return (
                <div
                  key={d.id}
                  className="flex justify-center md:absolute md:-translate-x-1/2 md:-translate-y-1/2"
                  style={isDesktop ? { left: `${d.x}%`, top: `${d.y}%` } : undefined}
                >
                  <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, margin: '-8%' }}
                    transition={{ duration: 0.7, delay: i * 0.07, ease: EASE_OUT_EXPO }}
                    className="relative flex flex-col items-center"
                  >
                    <AnimatePresence>
                      {ripple === d.id && (
                        <motion.span key="ripple" exit={{ opacity: 0 }} className="absolute -inset-2">
                          <SonarRipple />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <button
                      ref={(el) => {
                        nodeRefs.current[d.id] = el
                      }}
                      type="button"
                      onClick={() => handoff(d.id)}
                      onDoubleClick={() => pokeActive(d.id)}
                      aria-label={`Hand off session to ${d.label.toLowerCase()}`}
                      className={cn(
                        'relative flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-void',
                        isActive
                          ? 'border-spark/80 bg-panel text-ghost shadow-[0_0_28px_rgba(255,178,36,0.22)] ring-2 ring-spark/40'
                          : 'border-line bg-panel/60 text-mist hover:border-pulse/60 hover:text-ghost',
                        flash === d.id && 'border-wave ring-2 ring-wave shadow-glow-wave',
                      )}
                    >
                      <d.Icon className="h-6 w-6" />
                      {isActive && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded border border-spark/60 bg-void px-1.5 py-px font-mono text-[0.58rem] font-bold tracking-[0.14em] text-spark">
                          LIVE
                        </span>
                      )}
                    </button>
                    <span
                      className={cn(
                        'mt-2.5 font-mono text-[0.68rem] tracking-[0.18em] transition-colors duration-300',
                        isActive ? 'text-ghost' : 'text-smoke',
                      )}
                    >
                      {d.label}
                    </span>

                    {/* mini now-playing card springs onto the active device */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          key={`card-${d.id}`}
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.25 } }}
                          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                          className={cn(
                            'glass absolute top-full z-20 mt-3 w-[196px] rounded-xl p-3',
                            d.cardAlign === 'left' && 'left-0',
                            d.cardAlign === 'right' && 'right-0',
                            d.cardAlign === 'center' && 'left-1/2 -translate-x-1/2',
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <img src="/assets/album-01.png" alt="" className="h-8 w-8 rounded-md" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-ghost">Midnight Circuit</p>
                              <p className="truncate font-mono text-[0.65rem] tracking-[0.04em] text-smoke">
                                Vector Aurora
                              </p>
                            </div>
                            <SpectrumBars bars={3} className="h-4" duration={0.7} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )
            })}
          </div>

          {/* YOU chip */}
          <div className="mt-12 flex justify-center md:absolute md:left-1/2 md:top-[54%] md:mt-0 md:-translate-x-1/2 md:-translate-y-1/2">
            <motion.div
              ref={youRef}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.55 }}
              className="flex h-12 items-center gap-2 rounded-full border border-wave/50 bg-wave/10 px-5"
            >
              <span className="h-1.5 w-1.5 animate-dot-pulse rounded-full bg-wave" />
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-wave">YOU</span>
            </motion.div>
          </div>

          {/* session token in flight */}
          {flight && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-30 h-4 w-4 rounded-full bg-wave shadow-glow-wave"
              style={{ x: tokenX, y: tokenY }}
            />
          )}

          {/* event log */}
          <div className="mt-10 md:absolute md:bottom-5 md:left-6 md:right-6 md:mt-0">
            <ul className="space-y-1 font-mono text-[0.72rem] tracking-[0.04em]" aria-live="polite">
              <AnimatePresence initial={false}>
                {log.map((l, i) => (
                  <motion.li
                    key={l.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                    className={i === log.length - 1 ? 'text-wave' : 'text-smoke'}
                  >
                    <span className="mr-2 text-line">&gt;</span>
                    {l.text}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </motion.div>

        <p className="mt-5 text-center font-mono text-[0.72rem] tracking-[0.04em] text-smoke">
          DOUBLE-CLICK THE LIVE DEVICE IF YOU DARE
        </p>
      </div>
    </section>
  )
}
