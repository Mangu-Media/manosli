import CountUp from '@/components/CountUp'
import { motion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

const STATS = [
  { from: 0, to: 40, prefix: '<', suffix: 'ms', label: 'CROSS-DEVICE SYNC LATENCY', accent: 'text-wave', underline: 'bg-wave', glow: 'rgba(46,230,214,0.55)' },
  { from: 24, to: 0, prefix: '', suffix: '', label: 'BYTES OF RAW LISTENING DATA THAT EVER LEAVE YOUR DEVICE', accent: 'text-pulse', underline: 'bg-pulse', glow: 'rgba(124,92,255,0.55)' },
  { from: 0, to: 100, prefix: '', suffix: '%', label: 'VOICE PROCESSING ON-DEVICE, EVEN OFFLINE', accent: 'text-spark', underline: 'bg-spark', glow: 'rgba(255,178,36,0.55)' },
  { from: 0, to: 8, prefix: '', suffix: '', label: 'PLATFORMS. ONE SESSION, HANDED OFF INSTANTLY', accent: 'text-beat', underline: 'bg-beat', glow: 'rgba(255,61,138,0.55)' },
]

/** Home §5 — proof stats band with count-up numerals */
export default function StatsBand() {
  return (
    <section className="border-y border-line bg-abyss py-24">
      <div className="mx-auto grid max-w-[1440px] gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-12">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-25%' }}
            transition={{ duration: 0.7, delay: i * 0.1, ease: EASE_OUT_EXPO }}
            style={{ '--glow': s.glow } as CSSProperties}
            className="group border-l border-line px-6 py-10 transition-colors duration-500 hover:bg-panel"
          >
            <CountUp
              from={s.from}
              to={s.to}
              prefix={s.prefix}
              suffix={s.suffix}
              className={cn(
                'font-mono text-[clamp(2.5rem,6vw,5rem)] font-bold leading-none tracking-[-0.03em] transition-[text-shadow] duration-500 group-hover:[text-shadow:0_0_32px_var(--glow)]',
                s.accent,
              )}
            />
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-25%' }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: EASE_OUT_EXPO }}
              className={cn('mt-6 block h-[3px] w-16 origin-left', s.underline)}
            />
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-25%' }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: EASE_OUT_EXPO }}
              className="mt-4 font-mono text-[0.8125rem] leading-[1.5] tracking-[0.04em] text-smoke"
            >
              {s.label}
            </motion.p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
