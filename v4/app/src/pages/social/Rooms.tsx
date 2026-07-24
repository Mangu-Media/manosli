import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import SectionHeader from '@/components/SectionHeader'
import SpectrumBars from '@/components/SpectrumBars'
import CountUp from '@/components/CountUp'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* live chip internals ----------------------------------------------------- */

function SeatTicker() {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  const [seats, setSeats] = useState(24)
  useEffect(() => {
    if (!inView) return
    const id = setInterval(() => {
      setSeats((s) => Math.min(32, Math.max(24, s + (Math.random() > 0.5 ? 1 : -1))))
    }, 3000)
    return () => clearInterval(id)
  }, [inView])
  return (
    <span ref={ref} className="font-mono text-sm tabular-nums text-pulse">
      {seats}/32 SEATS FILLED
    </span>
  )
}

function CohortTimer() {
  const [secs, setSecs] = useState(25 * 60)
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s <= 0 ? 25 * 60 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return (
    <span className="font-mono text-sm tabular-nums text-wave">
      NEXT BREAK {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

/* cards ------------------------------------------------------------------- */

const CARDS = [
  {
    index: '01',
    title: 'FRIEND ROOMS',
    body: "Up to 32 seats, invite-only, E2EE. Where the group chat's aux cord lives now.",
    chips: ['32 SEATS', 'E2EE'],
    accent: 'bg-pulse',
    accentBorder: 'group-hover:border-pulse/60',
    accentGlow: 'group-hover:shadow-glow-pulse',
    live: <SeatTicker />,
  },
  {
    index: '02',
    title: 'PUBLIC STAGES',
    body: 'Artist-hosted broadcasts with a live floor. Ten thousand people, one playhead.',
    chips: ['10K+ LISTENERS', 'HOST PINNED'],
    accent: 'bg-spark',
    accentBorder: 'group-hover:border-spark/60',
    accentGlow: 'group-hover:shadow-[0_0_48px_rgba(255,178,36,0.28)]',
    live: (
      <span className="flex items-center gap-3">
        <SpectrumBars bars={10} className="h-5" barClassName="w-[3px]" />
        <span className="font-mono text-sm tabular-nums text-spark">
          <CountUp to={10214} duration={2.2} /> LIVE
        </span>
      </span>
    ),
  },
  {
    index: '03',
    title: 'FOCUS COHORTS',
    body: 'Silent rooms for deep work. Same mix, shared timer, zero chat. Presence without noise.',
    chips: ['POMODORO SYNC', 'NO CHAT'],
    accent: 'bg-wave',
    accentBorder: 'group-hover:border-wave/60',
    accentGlow: 'group-hover:shadow-glow-wave',
    live: <CohortTimer />,
  },
]

/** Social §5 — Rooms for Every Orbit: three pillar cards */
export default function Rooms() {
  return (
    <section className="py-28">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.04 // ROOMS"
          title={['PICK YOUR GRAVITY.']}
          accentWords={['GRAVITY']}
          accentDot="bg-beat"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 56 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: EASE_OUT_EXPO }}
              className={cn(
                'glass glass-sheen group relative overflow-hidden rounded-2xl p-8 transition-all duration-500 hover:-translate-y-1.5',
                card.accentBorder,
                card.accentGlow,
              )}
            >
              {/* 3px accent top edge draws on enter */}
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: '-15%' }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: EASE_OUT_EXPO }}
                className={cn('absolute inset-x-0 top-0 h-[3px] origin-left', card.accent)}
              />
              <p className="font-mono text-xs tracking-[0.22em] text-smoke">{card.index}</p>
              <h3 className="mt-4 font-display text-xl font-normal uppercase tracking-[-0.01em] text-ghost">
                {card.title}
              </h3>
              <p className="mt-4 leading-[1.65] text-mist">{card.body}</p>
              <div className="mt-6 flex h-8 items-center">{card.live}</div>
              <div className="mt-6 flex flex-wrap gap-2">
                {card.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-lg border border-line px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-mist"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
