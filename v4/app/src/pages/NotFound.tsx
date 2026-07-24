import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

/** 404 — aurora field + Display XL (design.md §9) */
export default function NotFound() {
  return (
    <section className="relative -mt-[76px] flex min-h-[100dvh] items-center justify-center overflow-hidden">
      <div className="deep-field absolute inset-0" aria-hidden="true" />
      <div aria-hidden="true" className="absolute left-[18%] top-[22%] h-80 w-80 animate-blob-drift rounded-full bg-pulse/25 blur-[110px]" />
      <div aria-hidden="true" className="absolute bottom-[18%] right-[18%] h-72 w-72 animate-blob-drift rounded-full bg-wave/15 blur-[110px]" style={{ animationDelay: '-9s' }} />
      <div className="relative z-10 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-spark"
        >
          ERR.404 // SIGNAL LOST
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="mt-6 font-display text-[clamp(3rem,9vw,9rem)] font-black uppercase leading-[0.98] tracking-[-0.02em] text-ghost"
        >
          OFF THE <span className="text-aurora animate-hue-shift">MAP.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT_EXPO }}
          className="mx-auto mt-6 max-w-[46ch] text-lg leading-[1.7] text-mist"
        >
          The track you were looking for isn't in this frequency range.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38, ease: EASE_OUT_EXPO }}
          className="mt-10"
        >
          <Link
            to="/"
            className="group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-aurora px-8 font-sans text-sm font-bold text-void transition-all duration-300 hover:scale-[1.03] hover:shadow-glow-pulse active:scale-[0.97]"
          >
            <span className="relative z-10">Back to the music</span>
            <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform duration-[600ms] group-hover:translate-x-[320px]" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
