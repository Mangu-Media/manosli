import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SonarRipple from '@/components/SonarRipple'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const LINE1: { t: string; g?: boolean }[] = [{ t: 'PRESS' }, { t: 'PLAY', g: true }]
const LINE2: { t: string; g?: boolean }[] = [{ t: 'ON' }, { t: 'THE' }, { t: 'FUTURE.' }]

function RevealWords({ words, charOffset }: { words: { t: string; g?: boolean }[]; charOffset: number }) {
  return (
    <span className="block">
      {words.map((word, wi) => {
        const start = charOffset + words.slice(0, wi).reduce((sum, w) => sum + w.t.length + 1, 0)
        return (
          <span key={wi} className="inline-block whitespace-nowrap">
            {word.t.split('').map((ch, ci) => (
              <span key={ci} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
                <motion.span
                  className={cn('inline-block will-change-transform', word.g && 'text-aurora animate-hue-shift')}
                  initial={{ y: '115%', opacity: 0 }}
                  whileInView={{ y: '0%', opacity: 1 }}
                  viewport={{ once: true, margin: '-25%' }}
                  transition={{ duration: 0.9, delay: (start + ci) * 0.024, ease: EASE_OUT_EXPO }}
                >
                  {ch}
                </motion.span>
              </span>
            ))}
            {wi < words.length - 1 && <span>&nbsp;</span>}
          </span>
        )
      })}
    </span>
  )
}

/** Home §8 — final CTA over drifting aurora field */
export default function FinalCta() {
  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden py-32">
      <div className="deep-field absolute inset-0" />
      <div aria-hidden="true" className="absolute left-[15%] top-[20%] h-96 w-96 animate-blob-drift rounded-full bg-pulse/25 blur-[120px]" />
      <div aria-hidden="true" className="absolute bottom-[15%] right-[15%] h-80 w-80 animate-blob-drift rounded-full bg-wave/15 blur-[120px]" style={{ animationDelay: '-9s' }} />
      <div className="relative z-10 mx-auto max-w-[1440px] px-6 text-center lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-25%' }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-spark" />
          SYS.READY // 08
        </motion.p>

        <h2 className="mt-8 font-display text-[clamp(2.6rem,7vw,6.5rem)] font-black uppercase leading-[0.98] tracking-[-0.02em] text-ghost">
          <RevealWords words={LINE1} charOffset={0} />
          <RevealWords words={LINE2} charOffset={11} />
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-25%' }}
          transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="mx-auto mt-8 max-w-[52ch] text-lg leading-[1.7] text-mist"
        >
          Early access opens in waves. Reserve your handle, bring your library, and hear what your music has been trying
          to tell you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-25%' }}
          transition={{ duration: 0.7, delay: 0.55, ease: EASE_OUT_EXPO }}
          className="mt-12"
        >
          <span className="relative inline-flex">
            <SonarRipple />
            <Link
              to="/download"
              className="group relative inline-flex h-14 items-center overflow-hidden rounded-full bg-aurora px-10 font-sans text-base font-bold text-void transition-all duration-300 hover:scale-[1.03] hover:shadow-glow-pulse active:scale-[0.97]"
            >
              <span className="relative z-10">Get early access</span>
              <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform duration-[600ms] group-hover:translate-x-[380px]" />
            </Link>
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-25%' }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="mt-8 font-mono text-[0.8125rem] tracking-[0.04em] text-smoke"
        >
          NO CARD · NO TRACKING · 2-MINUTE SETUP
        </motion.p>
      </div>
    </section>
  )
}
