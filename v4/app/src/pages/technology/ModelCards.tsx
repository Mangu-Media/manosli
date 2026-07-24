import { motion } from 'framer-motion'
import SectionHeader from '@/components/SectionHeader'
import HudFrame from '@/components/HudFrame'
import { EASE_OUT_EXPO } from '@/lib/motion'

interface Model {
  name: string
  role: string
  specs: string[]
  /** 12-point sparkline path (0-100 x, 0-30 y) */
  spark: string
}

const sparkPath = (seed: number) => {
  const pts: string[] = []
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * 100
    const y = 15 + Math.sin(i * 1.1 + seed) * 8 * Math.cos(i * 0.5 + seed * 2) + Math.sin(i * 2.3 + seed) * 3
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

const MODELS: Model[] = [
  {
    name: 'MoodNet',
    role: 'Fuses HR, motion, time, and weather into a live mood vector.',
    specs: ['1.8M params', 'INT8 · 6ms', '0.4% battery/hr'],
    spark: sparkPath(1),
  },
  {
    name: 'ActivityNet',
    role: 'Classifies walk / run / commute / rest from motion alone.',
    specs: ['0.9M params', '4ms', 'on-wrist capable'],
    spark: sparkPath(4),
  },
  {
    name: 'VoiceNLU',
    role: 'Offline speech → intent & entities. No cloud round-trip.',
    specs: ['12M params', '11ms parse', '34 locales'],
    spark: sparkPath(7),
  },
  {
    name: 'TasteDelta',
    role: 'Your personal fine-tune, federated nightly.',
    specs: ['per-device', 'train on-charger', 'DP ε=2.1'],
    spark: sparkPath(11),
  },
]

/** Technology §6 — on-device model spec cards */
export default function ModelCards() {
  return (
    <section className="relative py-24 lg:py-32">
      <style>{`
        @keyframes radar-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .group:hover .radar-line { animation: radar-sweep 1s linear 1; }
        @media (prefers-reduced-motion: reduce) { .group:hover .radar-line { animation: none; } }
      `}</style>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.04 // ON-DEVICE ML"
          title={['FOUR SMALL BRAINS.', 'ZERO CLOUD.']}
          accentWords={['ZERO']}
          accentDot="bg-wave"
          lede="Every inference that shapes your listening happens on hardware you own. These are the specs."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {MODELS.map((m, i) => (
            <motion.article
              key={m.name}
              initial={{ opacity: 0, y: 56 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: EASE_OUT_EXPO }}
              className="group glass glass-sheen relative overflow-hidden rounded-2xl p-6 transition-all duration-[450ms] hover:-translate-y-1.5 hover:border-wave/50 hover:shadow-glow-wave"
            >
              <HudFrame />
              {/* radar sweep line (rotates once on hover) */}
              <span
                aria-hidden="true"
                className="radar-line pointer-events-none absolute left-1/2 top-1/2 h-[200%] w-[1px] origin-top bg-gradient-to-b from-wave/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">NET.{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 font-mono text-xl font-bold tracking-[0.02em] text-ghost">{m.name}</h3>
              <p className="mt-3 min-h-[3.4em] text-sm leading-[1.65] text-mist">{m.role}</p>

              {/* sparkline draws on enter */}
              <svg viewBox="0 0 100 30" className="mt-5 h-8 w-full" fill="none" aria-hidden="true">
                <motion.path
                  d={m.spark}
                  stroke="#2EE6D6"
                  strokeWidth="1.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true, margin: '-15%' }}
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: 'easeInOut' }}
                />
              </svg>

              <div className="mt-5 space-y-2 border-t border-line pt-4">
                {m.specs.map((s) => (
                  <p key={s} className="flex items-center gap-2 font-mono text-[0.75rem] tracking-[0.04em] text-ghost">
                    <span className="h-1 w-1 rounded-full bg-wave" />
                    {s}
                  </p>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
