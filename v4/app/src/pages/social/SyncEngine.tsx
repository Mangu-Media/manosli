import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface City {
  name: string
  tz: string
  rtt: number
}

const CITIES: City[] = [
  { name: 'TOKYO', tz: 'Asia/Tokyo', rtt: 18 },
  { name: 'BERLIN', tz: 'Europe/Berlin', rtt: 12 },
  { name: 'NEW YORK', tz: 'America/New_York', rtt: 21 },
  { name: 'SÃO PAULO', tz: 'America/Sao_Paulo', rtt: 34 },
  { name: 'LAGOS', tz: 'Africa/Lagos', rtt: 29 },
  { name: 'SYDNEY', tz: 'Australia/Sydney', rtt: 26 },
]

const CONVERGE_MS = 3500

function randomOffsets() {
  return CITIES.map(() => Math.round((Math.random() * 2 - 1) * 380 + (Math.random() > 0.5 ? 40 : -40)))
}

function fmtOffset(ms: number) {
  const v = Math.round(ms)
  if (v >= 0) return `+${v}MS`
  return `\u2212${Math.abs(v)}MS`
}

/** Social §2 — the Sync Engine: six metronome city cards converge to <40ms unison */
export default function SyncEngine() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-25% 0px' })
  const [offsets, setOffsets] = useState<number[]>(randomOffsets)
  const [synced, setSynced] = useState(false)
  const [times, setTimes] = useState<string[]>(CITIES.map(() => '--:--:--'))
  const raf = useRef(0)

  const converge = useCallback(() => {
    cancelAnimationFrame(raf.current)
    const start = randomOffsets()
    let t0 = 0
    const step = (now: number) => {
      if (!t0) {
        t0 = now
        setSynced(false)
        setOffsets(start)
      }
      const t = Math.min((now - t0) / CONVERGE_MS, 1)
      // ease-out-expo toward zero, with small per-city targets (±1–9ms)
      const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setOffsets(start.map((s, i) => s * (1 - e) + (i % 2 === 0 ? 1 : -1) * (1 + i) * e))
      if (t < 1) raf.current = requestAnimationFrame(step)
      else setSynced(true)
    }
    raf.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => {
    if (inView) converge()
    return () => cancelAnimationFrame(raf.current)
  }, [inView, converge])

  // local clocks
  useEffect(() => {
    const fmt = () =>
      CITIES.map((c) =>
        new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: c.tz,
        }).format(new Date()),
      )
    const first = setTimeout(() => setTimes(fmt()), 0)
    const id = setInterval(() => setTimes(fmt()), 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  return (
    <section className="border-y border-line bg-abyss py-28">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.01 // SYNC FABRIC"
          title={['SIX CITIES. ONE DOWNBEAT.']}
          accentWords={['DOWNBEAT']}
          accentDot="bg-beat"
        />

        <div ref={ref} className="mt-16">
          {/* master beat line + drift chip */}
          <div className="mb-8 flex items-center gap-6">
            <div className="relative h-[2px] flex-1 overflow-visible rounded-full bg-line">
              <div
                className={cn('absolute inset-0 rounded-full bg-beat shadow-glow-beat', synced ? 'soc-master' : 'opacity-15')}
                aria-hidden="true"
              />
            </div>
            <span
              className={cn(
                'shrink-0 rounded-lg border px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] transition-colors duration-500',
                synced ? 'border-wave/70 text-wave' : 'border-spark/50 text-spark',
              )}
            >
              {synced ? 'IN SYNC · <40MS P50' : 'ROOM DRIFT: CONVERGING…'}
            </span>
          </div>

          {/* city cards */}
          <div className="relative">
            {synced && (
              <div aria-hidden="true" className="soc-rowflash pointer-events-none absolute -inset-4 z-10 rounded-3xl bg-aurora opacity-0" />
            )}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {CITIES.map((city, i) => (
                <motion.div
                  key={city.name}
                  initial={{ opacity: 0, y: 48 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-15%' }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_OUT_EXPO }}
                  className="glass glass-sheen group relative rounded-2xl p-5"
                >
                  {/* hover tooltip */}
                  <div className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-void/90 px-3 py-1 font-mono text-[0.65rem] tracking-[0.04em] text-wave opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                    RTT VIA NEAREST RELAY: {city.rtt}MS
                  </div>

                  {/* metronome pulse dot */}
                  <div className="flex justify-center">
                    <div className="relative flex h-12 w-12 items-center justify-center transition-transform duration-300 group-hover:scale-[1.3]">
                      <span
                        aria-hidden="true"
                        className="soc-beat-ring absolute inset-0 rounded-full border border-beat"
                        style={{ animationDelay: `${-offsets[i] / 1000}s` }}
                      />
                      <span
                        aria-hidden="true"
                        className={cn('soc-beat-dot h-4 w-4 rounded-full', synced ? 'bg-wave shadow-glow-wave' : 'bg-beat shadow-glow-beat')}
                        style={{ animationDelay: `${-offsets[i] / 1000}s` }}
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-center font-mono text-xs font-medium uppercase tracking-[0.18em] text-ghost">
                    {city.name}
                  </p>
                  <p
                    className={cn(
                      'mt-2 text-center font-mono text-xl font-bold tabular-nums transition-colors duration-500',
                      synced ? 'text-wave' : 'text-spark',
                    )}
                  >
                    {fmtOffset(offsets[i])}
                  </p>
                  <p className="mt-1 text-center font-mono text-[0.8125rem] tabular-nums tracking-[0.04em] text-smoke">
                    {times[i]} LOCAL
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* re-throw */}
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={converge}
              className="inline-flex h-11 items-center gap-2.5 rounded-full border border-line px-6 font-mono text-xs font-medium uppercase tracking-[0.18em] text-mist transition-all duration-300 hover:border-beat hover:bg-beat/10 hover:text-ghost focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-abyss"
            >
              <RotateCcw className="h-4 w-4" />
              Re-throw
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
