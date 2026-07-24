import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import SonarRipple from '@/components/SonarRipple'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const WORDS: { t: string; g?: boolean }[][] = [
  [{ t: 'NOW' }, { t: 'FEEL' }, { t: 'WHAT' }],
  [{ t: 'IT' }, { t: 'MAKES' }, { t: 'POSSIBLE.', g: true }],
]

/** Technology §9 — CTA band */
export default function TechCta() {
  return (
    <section className="relative flex min-h-[70dvh] items-center justify-center overflow-hidden py-28">
      {/* optional dimmed aurora mesh */}
      <img
        src="/assets/mesh-aurora.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-30"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-void via-void/60 to-void" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 text-center lg:px-12">
        <h2 className="font-display text-[clamp(2rem,5.5vw,4.5rem)] font-black uppercase leading-[1.0] tracking-[-0.02em] text-ghost">
          {WORDS.map((line, li) => (
            <span key={li} className="block">
              {line.map((word, wi) => (
                <span key={wi} className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
                  <motion.span
                    className={cn('inline-block will-change-transform', word.g && 'text-aurora')}
                    initial={{ y: '110%', opacity: 0 }}
                    whileInView={{ y: '0%', opacity: 1 }}
                    viewport={{ once: true, margin: '-22%' }}
                    transition={{ duration: 0.8, delay: (li * 3 + wi) * 0.06, ease: EASE_OUT_EXPO }}
                  >
                    {word.t}
                    {wi < line.length - 1 ? ' ' : ''}
                  </motion.span>
                </span>
              ))}
            </span>
          ))}
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-25%' }}
          transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row"
        >
          <span className="relative inline-flex">
            <SonarRipple />
            <Link
              to="/experience"
              className="group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-aurora px-8 font-sans text-sm font-bold text-void transition-all duration-300 hover:scale-[1.03] hover:shadow-glow-pulse active:scale-[0.97]"
            >
              <span className="relative z-10">Experience it</span>
              <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform duration-[600ms] group-hover:translate-x-[340px]" />
            </Link>
          </span>
          <Link
            to="/privacy"
            className="group inline-flex items-center gap-1.5 font-sans text-sm font-bold text-mist transition-colors duration-300 hover:text-ghost"
          >
            How we protect it
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
