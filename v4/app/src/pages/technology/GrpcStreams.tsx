import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowUp, ArrowDown, Pause, Play } from 'lucide-react'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const TRACKS = ['Low Orbit', 'Tidal Logic', 'Glasshouse FM', 'Midnight Circuit', 'Ember Drives']
const NAMES = ['maya', 'jonas', 'rui', 'selin', 'okafor', 'ines']
const DEVICES = ['watch', 'speaker', 'laptop', 'car']

const rnd = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

function uplinkEvent(): string {
  return rnd([
    () => `playhead.ack ${6 + Math.floor(Math.random() * 14)}ms`,
    () => `queue.vote +1 '${rnd(TRACKS)}'`,
    () => `mood.vector update ε-local`,
    () => `handoff.offer ${rnd(DEVICES)}`,
    () => `presence.ping ${8 + Math.floor(Math.random() * 10)}ms`,
    () => `queue.add '${rnd(TRACKS)}'`,
    () => `sync.merge ok ${1 + Math.floor(Math.random() * 4)}ms`,
  ])()
}

function downlinkEvent(): string {
  return rnd([
    () => `presence.join ${rnd(NAMES)}`,
    () => `queue.state broadcast`,
    () => `handoff.accept ${rnd(DEVICES)}`,
    () => `presence.leave ${rnd(NAMES)}`,
    () => `room.state sync ${10 + Math.floor(Math.random() * 20)}ms`,
    () => `playhead.echo ${5 + Math.floor(Math.random() * 12)}ms`,
    () => `catalog.resolve bafy…${Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')}`,
  ])()
}

interface Line {
  id: number
  dir: 'up' | 'down'
  text: string
}

/** 60px live latency sparkline */
function Sparkline({ live }: { live: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dataRef = useRef<number[]>(Array.from({ length: 24 }, () => 26 + Math.random() * 10))

  useEffect(() => {
    if (!live) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = 60 * dpr
    canvas.height = 20 * dpr
    ctx.scale(dpr, dpr)

    const draw = () => {
      const data = dataRef.current
      data.push(26 + Math.random() * 10)
      if (data.length > 24) data.shift()
      ctx.clearRect(0, 0, 60, 20)
      ctx.beginPath()
      data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * 58 + 1
        const y = 18 - ((v - 20) / 20) * 16
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.strokeStyle = '#2EE6D6'
      ctx.lineWidth = 1.25
      ctx.stroke()
    }
    draw()
    const iv = setInterval(draw, 500)
    return () => clearInterval(iv)
  }, [live])

  return <canvas ref={canvasRef} style={{ width: 60, height: 20 }} aria-hidden="true" />
}

/** Technology §4 — gRPC bi-di stream console */
export default function GrpcStreams() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-15% 0px' })
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [lines, setLines] = useState<Line[]>(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      dir: i % 2 === 0 ? 'up' : 'down',
      text: i % 2 === 0 ? uplinkEvent() : downlinkEvent(),
    })),
  )
  const idRef = useRef(10)
  const live = inView && !paused && !reduced

  useEffect(() => {
    if (!live) return
    const iv = setInterval(() => {
      setLines((prev) => {
        const dir: Line['dir'] = Math.random() < 0.5 ? 'up' : 'down'
        const next = [...prev, { id: idRef.current++, dir, text: dir === 'up' ? uplinkEvent() : downlinkEvent() }]
        // keep last 8 per column
        const ups = next.filter((l) => l.dir === 'up').slice(-8)
        const downs = next.filter((l) => l.dir === 'down').slice(-8)
        return [...ups, ...downs]
      })
    }, 600)
    return () => clearInterval(iv)
  }, [live])

  const column = (dir: 'up' | 'down') => (
    <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-xl border border-line/60 bg-void/40 p-3">
      <p className="flex items-center gap-1.5 border-b border-line/60 pb-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">
        {dir === 'up' ? <ArrowUp className="h-3 w-3 text-wave" /> : <ArrowDown className="h-3 w-3 text-pulse" />}
        {dir === 'up' ? 'Uplink' : 'Downlink'}
      </p>
      <div className="mt-2 flex flex-1 flex-col justify-end gap-1.5 overflow-hidden">
        {lines
          .filter((l) => l.dir === dir)
          .map((l) => (
            <motion.p
              key={l.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="truncate font-mono text-[0.7rem] leading-[1.4] tracking-[0.02em] text-mist"
            >
              <span className={dir === 'up' ? 'text-wave/70' : 'text-pulse/70'}>{dir === 'up' ? '↑' : '↓'}</span> {l.text}
            </motion.p>
          ))}
      </div>
    </div>
  )

  return (
    <section className="relative bg-abyss py-24 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-6 lg:grid-cols-2 lg:px-12">
        {/* copy */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
          >
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-wave" />
            SYS.03 // TRANSPORT
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-6 font-display text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ghost"
          >
            STREAMS, NOT REQUESTS.
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.6, delay: 0.16, ease: EASE_OUT_EXPO }}
            className="mt-5 max-w-[54ch] leading-[1.7] text-mist"
          >
            One persistent bi-directional stream per session. Playback state, queue votes, presence, handoff —
            everything rides the same pipe, both directions, no polling. When your friend adds a track in Tokyo, it's
            in your queue before the snare lands.
          </motion.p>
        </div>

        {/* live stream console */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: 64 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          className="glass glass-sheen rounded-3xl p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-3 rounded-lg border border-line px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.04em] text-ghost">
              <Sparkline live={live} />
              <span className="font-tabular text-wave">p50 31ms</span>
              <span className="text-smoke">·</span>
              <span className="font-tabular">p99 74ms</span>
            </span>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.08em] transition-colors',
                paused ? 'border-wave/50 text-wave' : 'border-line text-mist hover:border-wave/40 hover:text-ghost',
              )}
            >
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {paused ? 'RESUME SIM' : 'PAUSE SIM'}
            </button>
          </div>
          <div className="mt-4 flex gap-3">
            {column('up')}
            {column('down')}
          </div>
          <p className="mt-4 font-mono text-[0.65rem] tracking-[0.08em] text-smoke">
            SIMULATED SESSION · 1 STREAM · 0 POLL REQUESTS
          </p>
        </motion.div>
      </div>
    </section>
  )
}
