import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Check, X } from 'lucide-react'
import { EASE_OUT_EXPO, EASE_SPRING } from '@/lib/motion'

const PAIRS = [
  { bad: 'CONTACT UPLOADS', good: 'PROXIMITY + LINKS' },
  { bad: 'HISTORY SHARING', good: 'QUEUE + PRESENCE' },
  { bad: 'ENGAGEMENT TRACKING', good: "NOTHING. ROOMS DON'T REPORT" },
]

/** Social §6 — Social Without Surveillance: contrast pairs */
export default function PrivacyBand() {
  return (
    <section className="border-y border-line bg-abyss py-28">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-14 px-6 lg:grid-cols-[55fr_45fr] lg:gap-20 lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: -48 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        >
          <p className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-beat" />
            SYS.05 // PRIVATE BY DEFAULT
          </p>
          <h3 className="mt-6 font-sans text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ghost">
            SOCIAL GRAPH, ZERO SURVEILLANCE.
          </h3>
          <p className="mt-6 max-w-[60ch] leading-[1.65] text-mist">
            Discovery is proximity-based and opt-in — Bluetooth-local and invite links, not contact uploads. Rooms
            carry a queue and presence, never histories. What you played last night is none of the room's business.
          </p>
          <Link
            to="/privacy"
            className="group mt-8 inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-mist transition-all duration-300 hover:border-pulse hover:bg-pulse/10 hover:text-ghost"
          >
            See the privacy model
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <div className="space-y-3">
          {PAIRS.map((pair, i) => (
            <motion.div
              key={pair.bad}
              initial={{ opacity: 0, x: 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT_EXPO }}
              className="glass glass-sheen flex items-center justify-between gap-4 rounded-xl p-4"
            >
              {/* crossed-out item */}
              <motion.span
                animate={{ x: [0, 2, -2, 0] }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.1, repeat: 1 }}
                className="flex items-center gap-2 font-mono text-[0.8125rem] tracking-[0.04em] text-smoke line-through decoration-beat/60"
              >
                <X className="h-4 w-4 shrink-0 text-beat/70" aria-hidden="true" />
                {pair.bad}
              </motion.span>
              {/* wave-checked item */}
              <span className="flex items-center gap-2 text-right font-mono text-[0.8125rem] tracking-[0.04em] text-wave">
                {pair.good}
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true, margin: '-15%' }}
                  transition={{ duration: 0.45, delay: 0.35 + i * 0.1, ease: EASE_SPRING }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wave/15"
                >
                  <Check className="h-3 w-3" aria-hidden="true" />
                </motion.span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
