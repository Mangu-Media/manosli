import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, Lock } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import CountUp from '@/components/CountUp'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const CHIP_CYCLE = ['FOCUS', 'TRAIN', 'COMMUTE', 'UNWIND']

function ChipsVisual() {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIP_CYCLE.map((c, i) => (
        <span
          key={c}
          className="chip-cycle rounded-lg border border-line px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-mist"
          style={{ animationDelay: `${i * 1.2}s` }}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

function EkgVisual() {
  return (
    <svg viewBox="0 0 220 48" className="h-12 w-full" fill="none" aria-hidden="true">
      <path
        d="M0 24 H60 L72 10 L84 38 L96 4 L108 44 L118 24 H160 L170 16 L180 32 L188 24 H220"
        stroke="#2EE6D6"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="ekg-draw"
      />
    </svg>
  )
}

function LockVisual() {
  return (
    <div className="relative h-14 w-14">
      <span className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-spark/70" style={{ animationDuration: '8s' }} />
      <Lock className="absolute inset-0 m-auto h-5 w-5 text-spark transition-transform duration-500 group-hover:scale-110" />
    </div>
  )
}

function DotsVisual() {
  return (
    <div className="flex items-center gap-3">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-3.5 w-3.5 animate-dot-pulse rounded-full bg-beat" />
      ))}
    </div>
  )
}

const PILLARS = [
  {
    n: 1,
    title: 'THE EXPERIENCE',
    body: 'An interface that reads the moment. Context-aware UI, offline voice, and a Mood Engine that scores your day in real time.',
    linkLabel: 'Feel it',
    to: '/experience',
    accent: 'text-pulse',
    hover: 'hover:border-pulse/60 hover:shadow-glow-pulse',
    Visual: ChipsVisual,
  },
  {
    n: 2,
    title: 'THE TECHNOLOGY',
    body: 'Rust + WebAssembly under the glass. gRPC streams, federated learning, and a catalog routed over IPFS.',
    linkLabel: 'Open the hood',
    to: '/technology',
    accent: 'text-wave',
    hover: 'hover:border-wave/60 hover:shadow-glow-wave',
    Visual: EkgVisual,
  },
  {
    n: 3,
    title: 'ZERO-KNOWLEDGE PRIVACY',
    body: "Your listening never leaves your device in the clear. We engineered ourselves blind — and that's the feature.",
    linkLabel: 'Verify it',
    to: '/privacy',
    accent: 'text-spark',
    hover: 'hover:border-spark/60 hover:shadow-card-lift',
    Visual: LockVisual,
  },
  {
    n: 4,
    title: 'LISTENING, TOGETHER',
    body: 'Rooms that sync six cities to the same beat, under 40 milliseconds. Co-curate queues in real time.',
    linkLabel: 'Join a room',
    to: '/social',
    accent: 'text-beat',
    hover: 'hover:border-beat/60 hover:shadow-glow-beat',
    Visual: DotsVisual,
  },
]

/** Home §3 — four pillar cards with per-column parallax (broken grid) */
export default function Pillars() {
  const gridRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: gridRef, offset: ['start end', 'end start'] })
  const y0 = useTransform(scrollYProgress, [0, 1], [20, -20])
  const y1 = useTransform(scrollYProgress, [0, 1], [-20, 20])
  const y2 = useTransform(scrollYProgress, [0, 1], [14, -14])
  const y3 = useTransform(scrollYProgress, [0, 1], [-14, 14])
  const offsets = [y0, y1, y2, y3]

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
      <SectionHeader eyebrow="SYS.01 // PILLARS" title={['A PLATFORM,', 'NOT A PLAYER.']} accentWords={['PLAYER']} />
      <div ref={gridRef} className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p, i) => (
          <motion.div key={p.n} style={{ y: offsets[i] }}>
            <motion.div
              initial={{ y: 64, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ duration: 0.9, delay: i * 0.12, ease: EASE_OUT_EXPO }}
              className={cn(
                'glass glass-sheen group flex h-full flex-col rounded-2xl p-7 transition-all duration-[450ms] hover:-translate-y-1.5',
                p.hover,
              )}
            >
              <CountUp to={p.n} pad={2} className={cn('font-mono text-sm font-bold', p.accent)} />
              <h3 className="mt-5 font-display text-lg font-normal uppercase leading-snug text-ghost">{p.title}</h3>
              <p className="mt-4 text-sm leading-[1.65] text-mist">{p.body}</p>
              <div className="mt-6 flex-1">
                <p.Visual />
              </div>
              <Link
                to={p.to}
                className="group/link mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-mist transition-colors duration-300 hover:text-ghost"
              >
                <span className={p.accent}>{p.linkLabel}</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/link:-translate-y-1 group-hover/link:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
