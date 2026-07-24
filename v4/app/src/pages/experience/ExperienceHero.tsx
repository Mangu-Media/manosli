import { memo, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { NoiseLine } from './NoiseText'

const LEDE =
  'manosli+ runs its neural engine on your device — reading context, mood, and motion to reshape the interface and the music, moment by moment. No cloud round-trips. No waiting.'

/** Fine particle dust — ~120 motes drifting ~6px/s, paused offscreen (experience.md §1) */
const DustCanvas = memo(function DustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let running = true
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const COUNT = 120
    const COLORS = ['167,159,190', '124,92,255', '46,230,214', '255,61,138']
    const particles = Array.from({ length: COUNT }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 1.3,
      // ~6px/s drift with per-particle variance and direction
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 0.5) * 9,
      a: 0.12 + Math.random() * 0.4,
      tw: 0.6 + Math.random() * 1.8,
      ph: Math.random() * Math.PI * 2,
      c: COLORS[i % COLORS.length],
    }))

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let last = performance.now()
    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        if (!reduced) {
          p.x += (p.vx * dt) / Math.max(width, 1)
          p.y += (p.vy * dt) / Math.max(height, 1)
          if (p.x < -0.02) p.x = 1.02
          if (p.x > 1.02) p.x = -0.02
          if (p.y < -0.02) p.y = 1.02
          if (p.y > 1.02) p.y = -0.02
        }
        const twinkle = reduced ? 1 : 0.65 + 0.35 * Math.sin(now / 1000 / p.tw + p.ph)
        ctx.beginPath()
        ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.c},${(p.a * twinkle).toFixed(3)})`
        ctx.fill()
      }
      if (!reduced && running) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    // pause the loop when the hero leaves the viewport (design.md §6 guardrails)
    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting
        if (running && !reduced) {
          cancelAnimationFrame(raf)
          last = performance.now()
          raf = requestAnimationFrame(draw)
        }
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
})

/** Experience §1 — 90vh centered hero: breathing aurora orb, dust, Noise Text Reveal */
export default function ExperienceHero() {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    // hold the reveal until the route wipe has lifted (PageWipe ≈ 0.5s)
    const t = window.setTimeout(() => setActive(true), 260)
    return () => window.clearTimeout(t)
  }, [])

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // orb parallax down 0.4× (hero is 90dvh) and dims as the hero exits
  const orbY = useTransform(scrollYProgress, [0, 1], ['0dvh', '36dvh'])
  const orbOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.08])

  return (
    <section ref={ref} className="relative -mt-[76px] flex min-h-[90dvh] items-center justify-center overflow-hidden">
      {/* scoped keyframes for the orb's continuous motion (6s breathe / 20s hue cycle) */}
      <style>{`
        @keyframes xp-orb-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes xp-orb-hue { 0%,100% { filter: hue-rotate(0deg); } 50% { filter: hue-rotate(48deg); } }
        .xp-orb-breathe { animation: xp-orb-breathe 6s ease-in-out infinite; }
        .xp-orb-hue { animation: xp-orb-hue 20s ease-in-out infinite; }
      `}</style>

      {/* breathing gradient orb — 60vmin radial aurora, blur 120px, opacity 0.35 */}
      <motion.div style={{ y: orbY, opacity: orbOpacity }} className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={active ? { scale: 1, opacity: 0.35 } : { scale: 0.6, opacity: 0 }}
          transition={{ duration: 1.4, ease: EASE_OUT_EXPO }}
          className="xp-orb-breathe"
        >
          <div
            className="xp-orb-hue h-[60vmin] w-[60vmin] rounded-full blur-[120px]"
            style={{ background: 'linear-gradient(120deg, #7C5CFF 0%, #B14BFF 32%, #FF3D8A 68%, #FFB224 100%)' }}
          />
        </motion.div>
      </motion.div>

      <DustCanvas />

      {/* content */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 text-center lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-beat" />
          The Experience
        </motion.p>

        <h1 className="mt-8 font-display text-[clamp(2.5rem,6vw,5.25rem)] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-ghost">
          <span className="block">
            <NoiseLine text="MUSIC THAT " active={active} delay={150} charMs={40} />
            <NoiseLine text="MOVES" active={active} delay={150 + 11 * 40} charMs={40} resolvedClassName="text-aurora" />
          </span>
          <span className="block">
            <NoiseLine text="WITH YOU." active={active} delay={150 + 17 * 40} charMs={40} />
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-[60ch] text-lg leading-[1.7] text-mist">
          {LEDE.split(' ').map((word, i) => (
            <motion.span
              key={i}
              className="inline-block"
              custom={i}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: (n: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.6 + n * 0.02, ease: EASE_OUT_EXPO } }),
              }}
              initial="hidden"
              animate={active ? 'show' : 'hidden'}
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
        animate={active ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-smoke">Scroll</span>
        <span className="block h-10 w-[1px] animate-scroll-cue bg-ghost/60" />
      </motion.div>
    </section>
  )
}
