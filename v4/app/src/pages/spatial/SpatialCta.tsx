import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { EASE_OUT_EXPO } from '@/lib/motion'

const HEADLINE: { t: string; g?: boolean }[][] = [
  [{ t: 'CLOSE' }, { t: 'YOUR' }, { t: 'EYES.' }],
  [{ t: 'OPEN' }, { t: 'THE' }, { t: 'ROOM.', g: true }],
]

const ORBS = [
  { left: '12%', top: '20%', size: 180, color: 'bg-wave/20', delay: '0s' },
  { left: '72%', top: '12%', size: 220, color: 'bg-pulse/25', delay: '-6s' },
  { left: '45%', top: '65%', size: 160, color: 'bg-wave/15', delay: '-3s' },
  { left: '82%', top: '62%', size: 130, color: 'bg-spark/15', delay: '-9s' },
  { left: '25%', top: '55%', size: 200, color: 'bg-pulse/20', delay: '-12s' },
]

/** Spatial §7 — CTA band with CSS orb-field reprise */
export default function SpatialCta() {
  return (
    <section className="relative overflow-hidden py-32">
      <div aria-hidden="true" className="absolute inset-0">
        {ORBS.map((o, i) => (
          <span
            key={i}
            className={`absolute animate-blob-drift rounded-full blur-[90px] ${o.color}`}
            style={{ left: o.left, top: o.top, width: o.size, height: o.size, animationDelay: o.delay }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 text-center lg:px-12">
        <h2 className="font-display text-[clamp(2.2rem,6vw,5rem)] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-ghost">
          {HEADLINE.map((line, li) => (
            <span key={li} className="block">
              {line.map((word, wi) => (
                <span key={wi} className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
                  <motion.span
                    className={word.g ? 'inline-block bg-[linear-gradient(120deg,#2EE6D6,#7C5CFF)] bg-clip-text text-transparent' : 'inline-block'}
                    initial={{ y: '110%', opacity: 0 }}
                    whileInView={{ y: '0%', opacity: 1 }}
                    viewport={{ once: true, margin: '-22%' }}
                    transition={{ duration: 0.8, delay: (li * 4 + wi) * 0.06, ease: EASE_OUT_EXPO }}
                  >
                    {word.t}
                    {wi < line.length - 1 ? '\u00A0' : ''}
                  </motion.span>
                </span>
              ))}
            </span>
          ))}
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            to="/download"
            className="group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-aurora px-8 font-sans text-sm font-bold text-void transition-all duration-300 hover:scale-[1.03] hover:shadow-glow-wave active:scale-[0.97]"
          >
            <span className="relative z-10">Get early access</span>
            <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform [transition-duration:600ms] group-hover:translate-x-[340px]" />
          </Link>
          <Link
            to="/ecosystem"
            className="group inline-flex items-center gap-2 font-sans text-sm font-medium text-mist transition-colors duration-300 hover:text-ghost"
          >
            See the ecosystem
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
