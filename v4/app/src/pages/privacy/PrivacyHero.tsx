import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import NoiseText from '@/pages/technology/noise'
import { EASE_OUT_EXPO } from '@/lib/motion'

const LEDE =
  "Zero-knowledge isn't a policy you have to trust. It's an architecture you can check. Your listening lives on your device; what syncs is encrypted before it leaves, with keys only you hold."

/** Privacy §1 — the transparent vault: glass ring + rotating aurora segment */
export default function PrivacyHero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // ring scales 1→1.2, opacity→0 over first 90vh (scrub)
  const ringScale = useTransform(scrollYProgress, [0, 0.9], [1, 1.2])
  const ringOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0])

  return (
    <section ref={ref} className="relative -mt-[76px] flex min-h-[90dvh] items-center justify-center overflow-hidden">
      <style>{`
        @keyframes vault-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .vault-segment { animation: vault-rotate 24s linear infinite; transform-origin: center; transform-box: fill-box; }
        .vault-ring:hover .vault-segment { filter: brightness(1.2); }
        @media (prefers-reduced-motion: reduce) { .vault-segment { animation: none; } }
      `}</style>

      {/* the transparent vault */}
      <motion.div
        aria-hidden="true"
        className="vault-ring absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ scale: ringScale, opacity: ringOpacity }}
      >
        <svg width="720" height="720" viewBox="0 0 720 720" className="h-[min(82dvh,720px)] w-[min(82dvh,720px)] max-w-[94vw]">
          <defs>
            <linearGradient id="vault-aurora" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7C5CFF" />
              <stop offset="0.5" stopColor="#FF3D8A" />
              <stop offset="1" stopColor="#FFB224" />
            </linearGradient>
          </defs>
          {/* glass torus outline — draws on entrance */}
          <motion.circle
            cx="360"
            cy="360"
            r="300"
            fill="none"
            stroke="#241A38"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="360"
            cy="360"
            r="284"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, delay: 0.2, ease: 'easeInOut' }}
          />
          {/* slow-rotating aurora segment */}
          <motion.g
            className="vault-segment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.2 }}
            style={{ transition: 'filter 0.4s' }}
          >
            <circle
              cx="360"
              cy="360"
              r="300"
              fill="none"
              stroke="url(#vault-aurora)"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="22 78"
            />
          </motion.g>
        </svg>
      </motion.div>

      {/* center copy */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 text-center lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-spark" />
          Zero-Knowledge Privacy
        </motion.p>

        <h1 className="mt-8 font-display text-[clamp(1.9rem,4.6vw,4.25rem)] font-bold uppercase leading-[1.04] tracking-[-0.02em] text-ghost">
          <span className="block">
            <NoiseText text="WE CAN'T SEE YOUR DATA." charDelay={55} startDelay={400} />
          </span>
          <span className="block">
            <NoiseText
              text="WE ENGINEERED IT THAT WAY."
              charDelay={55}
              startDelay={400 + "WE CAN'T SEE YOUR DATA.".length * 55 + 150}
              charClassName="text-pulse"
              finalClassName="bg-clip-text text-transparent"
              finalStyle={{ backgroundImage: 'linear-gradient(120deg, #7C5CFF 0%, #FFB224 100%)' }}
            />
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-[58ch] text-lg leading-[1.7] text-mist">
          {LEDE.split(' ').map((word, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.02, ease: EASE_OUT_EXPO }}
            >
              {word}
              {' '}
            </motion.span>
          ))}
        </p>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.4 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3"
      >
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-smoke">Scroll</span>
        <span className="block h-10 w-[1px] animate-scroll-cue bg-ghost/60" />
      </motion.div>
    </section>
  )
}
