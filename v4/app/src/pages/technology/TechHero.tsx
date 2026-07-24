import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import HudFrame from '@/components/HudFrame'
import NoiseText from './noise'
import { EASE_OUT_EXPO } from '@/lib/motion'

const LEDE =
  "Rust compiled to WebAssembly. gRPC streams instead of polling. Models that learn on your device and only share math. A catalog routed across decentralized storage. This is what 'built from scratch' actually means."

/** HUD corner label that types itself out (12ms/char, design §1) */
function TypeLabel({ text, delay, className }: { text: string; delay: number; className?: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined
    const start = setTimeout(() => {
      iv = setInterval(() => {
        setN((v) => {
          if (v >= text.length) {
            if (iv) clearInterval(iv)
            return v
          }
          return v + 1
        })
      }, 12)
    }, delay)
    return () => {
      clearTimeout(start)
      if (iv) clearInterval(iv)
    }
  }, [text, delay])
  return (
    <span className={className}>
      {text.slice(0, n)}
      {n < text.length && <span className="animate-caret-blink">▌</span>}
    </span>
  )
}

/** Technology §1 — blueprint grid hero with HUD chrome + noise headline */
export default function TechHero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // grid parallax 0.3×, fades by 80vh
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 260])
  const gridOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  return (
    <section ref={ref} className="relative -mt-[76px] flex min-h-[90dvh] items-center overflow-hidden">
      <style>{`
        @keyframes tech-scan { 0% { top: -2%; } 100% { top: 102%; } }
        @keyframes tech-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>

      {/* blueprint grid + vignette */}
      <motion.div aria-hidden="true" className="absolute inset-0" style={{ y: gridY, opacity: gridOpacity }}>
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, rgba(36,26,56,0.4) 0 1px, transparent 1px 48px), repeating-linear-gradient(to bottom, rgba(36,26,56,0.4) 0 1px, transparent 1px 48px)',
          }}
        />
        {/* entrance scanline sweep (400ms) */}
        <motion.div
          className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-wave/15 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 0.4, delay: 0.9, ease: 'easeInOut' }}
        />
        {/* continuous vertical scanline every 8s */}
        <div
          className="absolute left-0 h-[2px] w-full bg-wave/20"
          style={{ animation: 'tech-scan 8s linear infinite', animationDelay: '2s' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 45%, transparent 30%, #06030B 92%)' }}
        />
      </motion.div>

      {/* HUD corner frames + typed coordinates */}
      <motion.div
        className="pointer-events-none absolute inset-6 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        aria-hidden="true"
      >
        <HudFrame />
        <TypeLabel
          text="LAT 52.52 / LON 13.40"
          delay={600}
          className="absolute left-6 top-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke"
        />
        <TypeLabel
          text="REV 4.2.0"
          delay={800}
          className="absolute right-6 top-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke"
        />
        <TypeLabel
          text="BUILD STABLE"
          delay={1000}
          className="absolute bottom-0 left-6 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke"
        />
        <TypeLabel
          text="SYS.ONLINE // 40MS"
          delay={1200}
          className="absolute bottom-0 right-6 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-wave"
        />
      </motion.div>

      {/* center copy */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 text-center lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-wave" />
          The Technology
        </motion.p>

        <h1 className="mt-8 font-display text-[clamp(2.5rem,6vw,5.25rem)] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-ghost">
          <span className="block">
            <NoiseText text="BUILT LIKE" charDelay={40} startDelay={300} />
          </span>
          <span className="block">
            <NoiseText
              text="INFRASTRUCTURE."
              charDelay={40}
              startDelay={300 + 'BUILT LIKE'.length * 40 + 120}
              charClassName="text-wave"
              finalClassName="bg-clip-text text-transparent"
              finalStyle={{ backgroundImage: 'linear-gradient(120deg, #2EE6D6 0%, #7C5CFF 100%)' }}
            />
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-[62ch] text-lg leading-[1.7] text-mist">
          {LEDE.split(' ').map((word, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 1.3 + i * 0.018, ease: EASE_OUT_EXPO }}
            >
              {word}
              {' '}
            </motion.span>
          ))}
        </p>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3"
      >
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-smoke">Scroll</span>
        <span className="block h-10 w-[1px] animate-scroll-cue bg-ghost/60" />
      </motion.div>
    </section>
  )
}
