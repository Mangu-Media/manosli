import { memo, useRef } from 'react'
import type { ComponentType } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Car, Glasses, Headphones, Laptop, Smartphone, Speaker, Watch } from 'lucide-react'
import { EqGlyph } from '@/components/Logo'
import NoiseText from './NoiseText'
import { EASE_OUT_EXPO, EASE_SPRING } from '@/lib/motion'

interface GlyphSpec {
  Icon: ComponentType<{ className?: string }>
  label: string
  ring: number
  angle: number // degrees
}

const RINGS = [
  { size: 300, duration: 40, reverse: false },
  { size: 460, duration: 55, reverse: true },
  { size: 620, duration: 70, reverse: false },
  { size: 780, duration: 80, reverse: true },
]

const GLYPHS: GlyphSpec[] = [
  { Icon: Watch, label: 'WATCH', ring: 0, angle: 30 },
  { Icon: Smartphone, label: 'PHONE', ring: 1, angle: 200 },
  { Icon: Headphones, label: 'EARBUDS', ring: 1, angle: 80 },
  { Icon: Glasses, label: 'GLASSES', ring: 2, angle: 320 },
  { Icon: Laptop, label: 'LAPTOP', ring: 2, angle: 140 },
  { Icon: Speaker, label: 'SPEAKER', ring: 3, angle: 250 },
  { Icon: Car, label: 'CAR', ring: 3, angle: 20 },
]

/** One dashed orbit ring, perpetually rotating; isolated + memoized (perpetual animation rule) */
const OrbitRing = memo(function OrbitRing({
  size,
  duration,
  reverse,
  index,
}: {
  size: number
  duration: number
  reverse: boolean
  index: number
}) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: `min(94vw, ${size}px)`, height: `min(94vw, ${size}px)` }}
      initial={{ scale: 0.72, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.1, delay: 0.15 * index, ease: EASE_OUT_EXPO }}
    >
      <motion.div
        className="h-full w-full rounded-full border border-dashed border-line/80"
        animate={{ rotate: reverse ? -360 : 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  )
})

/** Device glyph riding a ring; counter-rotates to stay upright */
const OrbitGlyph = memo(function OrbitGlyph({ spec, index }: { spec: GlyphSpec; index: number }) {
  const ring = RINGS[spec.ring]
  const rad = (spec.angle * Math.PI) / 180
  const left = 50 + 50 * Math.cos(rad)
  const top = 50 + 50 * Math.sin(rad)
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ width: `min(94vw, ${ring.size}px)`, height: `min(94vw, ${ring.size}px)`, x: '-50%', y: '-50%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.5 + index * 0.08 }}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ rotate: ring.reverse ? -360 : 360 }}
        transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="absolute"
          style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
        >
          <motion.div
            animate={{ rotate: ring.reverse ? 360 : -360 }}
            transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
          >
            <motion.div
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-void/80 backdrop-blur-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.5 + index * 0.08 }}
              whileHover={{ borderColor: 'rgba(124,92,255,0.7)' }}
            >
              <spec.Icon className="h-[18px] w-[18px] text-mist" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
})

/** Center equalizer glyph with breathing violet glow */
const CenterGlyph = memo(function CenterGlyph() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pulse/30 blur-2xl"
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: EASE_SPRING }}
        className="relative flex h-20 w-20 items-center justify-center rounded-full border border-pulse/40 bg-void/70 backdrop-blur-sm"
      >
        <EqGlyph className="h-9 w-10" />
      </motion.div>
    </div>
  )
})

/** Ecosystem §1 — orbit diagram hero, "Every device. One pulse." */
export default function OrbitHero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const diagramScale = useTransform(scrollYProgress, [0, 1], [1, 1.25])
  const diagramOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  return (
    <section ref={ref} className="relative -mt-[76px] min-h-[90dvh] overflow-hidden">
      <div className="deep-field absolute inset-0" aria-hidden="true" />

      {/* orbit diagram — scales 1→1.25 and fades over the hero on scroll */}
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-[40%] h-0 w-0"
        style={{ scale: diagramScale, opacity: diagramOpacity }}
      >
        {RINGS.map((r, i) => (
          <OrbitRing key={i} size={r.size} duration={r.duration} reverse={r.reverse} index={i} />
        ))}
        {GLYPHS.map((g, i) => (
          <OrbitGlyph key={g.label} spec={g} index={i} />
        ))}
        <CenterGlyph />
      </motion.div>

      {/* content — overlaid center, below the glyph */}
      <div className="relative z-10 mx-auto flex min-h-[90dvh] w-full max-w-[1440px] flex-col items-center justify-end px-6 pb-20 pt-[54vh] text-center lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-pulse" />
          Ecosystem
        </motion.p>

        <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5.25rem)] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-ghost">
          <NoiseText text="EVERY DEVICE." className="block" baseDelay={0.45} />
          <span className="block">
            <NoiseText text="ONE " className="inline" baseDelay={0.95} />
            <NoiseText text="PULSE." className="text-aurora inline" baseDelay={1.15} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5, ease: EASE_OUT_EXPO }}
          className="mt-6 max-w-[60ch] text-lg leading-[1.7] text-mist"
        >
          Your session isn't on a device — it's on you. Start on the phone, move to the watch, walk
          into the room and the speaker takes over. The stream never breaks; it just changes bodies.
        </motion.p>
      </div>

      {/* bottom fade into next section */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-void" />
    </section>
  )
}
