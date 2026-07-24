import { memo, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** IntersectionObserver gate — demos pause offscreen (design.md §6) */
function useInViewState() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, inView }
}

/* ---------------- demo 1: health & fitness ---------------- */

function HeartRateDemo({ active, speed }: { active: boolean; speed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bpmRef = useRef<HTMLSpanElement>(null)
  const chipRef = useRef<HTMLSpanElement>(null)
  const tRef = useRef(0)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf = 0
    let last = performance.now()

    const bpmAt = (t: number) => 149 + 16 * Math.sin(t * 0.6) + 3 * Math.sin(t * 2.7)

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      tRef.current += dt * speed
      const t = tRef.current
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const WINDOW = 7 // seconds visible
      const toY = (bpm: number) => h - 8 - ((bpm - 124) / 52) * (h - 16)
      // area fill
      ctx.beginPath()
      for (let x = 0; x <= w; x += 3) {
        const bt = bpmAt(t - ((w - x) / w) * WINDOW)
        const y = toY(bt)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, 'rgba(46,230,214,0.18)')
      grad.addColorStop(1, 'rgba(46,230,214,0)')
      ctx.fillStyle = grad
      ctx.fill()
      // line
      ctx.beginPath()
      for (let x = 0; x <= w; x += 3) {
        const bt = bpmAt(t - ((w - x) / w) * WINDOW)
        const y = toY(bt)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = '#2EE6D6'
      ctx.lineWidth = 1.5
      ctx.stroke()

      const bpm = Math.round(bpmAt(t))
      if (bpmRef.current) bpmRef.current.textContent = String(bpm)
      if (chipRef.current) chipRef.current.style.animationDuration = `${(60 / bpm).toFixed(3)}s`

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [active, speed])

  return (
    <div>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span ref={bpmRef} className="font-mono text-3xl font-bold tabular-nums text-wave">
            149
          </span>
          <span className="font-mono text-xs tracking-[0.08em] text-smoke">BPM</span>
        </div>
        <span className="flex items-center gap-2 rounded-lg border border-wave/40 px-3 py-1">
          <span ref={chipRef} className="h-1.5 w-1.5 animate-dot-pulse rounded-full bg-wave" />
          <span className="font-mono text-[0.68rem] font-bold tracking-[0.14em] text-wave">BPM LOCK</span>
        </span>
      </div>
      <canvas ref={canvasRef} className="mt-4 h-[92px] w-full" style={{ width: '100%', height: '92px' }} />
      <p className="mt-3 font-mono text-[0.68rem] tracking-[0.1em] text-smoke">CADENCE-LOCKED CROSSFADES</p>
    </div>
  )
}

/* ---------------- demo 2: smart home ---------------- */

const ROOMS = ['STUDIO', 'KITCHEN', 'PORCH']

const WaveSweep = memo(function WaveSweep({ speed }: { speed: number }) {
  return (
    <div className="relative h-[2px] overflow-hidden rounded-full bg-line">
      <motion.div
        className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-wave to-transparent"
        animate={{ x: ['-120%', '340%'] }}
        transition={{ duration: 1.8 / speed, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
})

function SmartHomeDemo({ active, speed }: { active: boolean; speed: number }) {
  const [on, setOn] = useState(false)

  // auto demo loop while visible
  useEffect(() => {
    if (!active) return
    let cancelled = false
    let timer: number
    const cycle = () => {
      if (cancelled) return
      setOn(true)
      timer = window.setTimeout(() => {
        if (cancelled) return
        setOn(false)
        timer = window.setTimeout(cycle, 1800 / speed)
      }, 3200 / speed)
    }
    cycle()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [active, speed])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {ROOMS.map((room, i) => (
            <span key={room} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1">
              <span
                className="h-1.5 w-1.5 rounded-full bg-spark"
                style={{
                  opacity: on ? 0.2 : 0.95,
                  transition: `opacity ${1.1 / speed}s ease ${(i * 0.35) / speed}s`,
                }}
              />
              <span className="font-mono text-[0.62rem] tracking-[0.12em] text-mist">{room}</span>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOn((o) => !o)}
          aria-label={on ? 'Pause Night Arc' : 'Start Night Arc'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-mist transition-colors duration-300 hover:border-pulse hover:text-ghost"
        >
          {on ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="mt-6">{on && <WaveSweep speed={speed} />}</div>
      <p className="mt-3 font-mono text-[0.68rem] tracking-[0.1em] text-smoke">
        {on ? 'NIGHT ARC — LIGHTS FOLLOWING' : 'PRESS PLAY — ROOMS GO DIM'}
      </p>
    </div>
  )
}

/* ---------------- demo 3: productivity ---------------- */

const FocusBar = memo(function FocusBar({ speed }: { speed: number }) {
  return (
    <div className="relative h-3 overflow-hidden rounded-full border border-line bg-void/60">
      <motion.div
        className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-spectrum"
        animate={{ scaleX: [0, 0.86, 1, 0.14] }}
        transition={{ duration: 6 / speed, times: [0, 0.55, 0.72, 1], repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="absolute inset-y-0 right-[14%] w-[2px] bg-spark/80" aria-hidden="true" />
    </div>
  )
})

function ProductivityDemo({ active, speed }: { active: boolean; speed: number }) {
  const [label, setLabel] = useState('T-5:00')

  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const id = window.setInterval(() => {
      const phase = (((performance.now() - start) / 1000) * speed) % 6
      if (phase < 4.3) {
        const remaining = Math.max(0, 300 - (phase / 4.3) * 300)
        const m = Math.floor(remaining / 60)
        const s = Math.floor(remaining % 60)
        setLabel(`T-${m}:${String(s).padStart(2, '0')}`)
      } else {
        setLabel('LANDED')
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [active, speed])

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.68rem] tracking-[0.12em] text-mist">FOCUS MIX — DEEP WORK</span>
        <span className="font-mono text-[0.68rem] font-bold tabular-nums tracking-[0.12em] text-wave">{label}</span>
      </div>
      <div className="mt-4">
        <FocusBar speed={speed} />
      </div>
      <div className="mt-2 flex justify-end">
        <span className="rounded border border-spark/40 bg-spark/10 px-2 py-0.5 font-mono text-[0.6rem] tracking-[0.12em] text-spark">
          MEETING
        </span>
      </div>
      <p className="mt-3 font-mono text-[0.68rem] tracking-[0.1em] text-smoke">MIX LANDS THE PLANE FOR YOU</p>
    </div>
  )
}

/* ---------------- section ---------------- */

interface CardSpec {
  title: string
  body: string
  accentHover: string
  demo: (active: boolean, speed: number) => ReactNode
}

const CARDS: CardSpec[] = [
  {
    title: 'HEALTH & FITNESS',
    body: 'Heart-rate-aware training mixes from your tracker.',
    accentHover: 'hover:border-wave/60 hover:shadow-glow-wave',
    demo: (a, s) => <HeartRateDemo active={a} speed={s} />,
  },
  {
    title: 'SMART HOME',
    body: 'Rooms that follow the music. Lights dim when Night Arc starts.',
    accentHover: 'hover:border-spark/60',
    demo: (a, s) => <SmartHomeDemo active={a} speed={s} />,
  },
  {
    title: 'PRODUCTIVITY',
    body: 'Calendar-aware focus. Meeting in 5? The mix lands the plane for you.',
    accentHover: 'hover:border-pulse/60 hover:shadow-glow-pulse',
    demo: (a, s) => <ProductivityDemo active={a} speed={s} />,
  },
]

function IntegrationCard({ card, index }: { card: CardSpec; index: number }) {
  const { ref, inView } = useInViewState()
  const [hover, setHover] = useState(false)
  const speed = hover ? 1.5 : 1

  return (
    <motion.div
      ref={ref}
      initial={{ y: 56, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-12%' }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: EASE_OUT_EXPO }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className={cn(
        'glass glass-sheen group rounded-2xl p-8 transition-all duration-[450ms] hover:-translate-y-1.5',
        card.accentHover,
      )}
    >
      <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">
        <span className="mr-2 text-line">0{index + 1}</span>
        {card.title}
      </p>
      <p className="mt-4 text-[0.95rem] leading-[1.6] text-mist">{card.body}</p>
      <div className="mt-7">{card.demo(inView, speed)}</div>
    </motion.div>
  )
}

/** Ecosystem §4 — third-party integrations with live micro-demos */
export default function Integrations() {
  return (
    <section className="py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.03 // INTEGRATIONS"
          title={['PLAYS WELL', 'WITH YOUR LIFE.']}
          accentWords={['LIFE']}
          accentDot="bg-beat"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {CARDS.map((card, i) => (
            <IntegrationCard key={card.title} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
