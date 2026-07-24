import { lazy, Suspense, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Play } from 'lucide-react'
import HudFrame from '@/components/HudFrame'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const AuroraField = lazy(() => import('@/components/AuroraField'))

const CHIPS = ['RUST+WASM CORE', 'ON-DEVICE AI', 'ZERO-KNOWLEDGE']
const LEDE =
  'manosli+ listens the way you live — on-device intelligence that reads the moment, zero-knowledge privacy that keeps it yours, and spatial audio that places music in the room around you.'

function SplitChars({ text, active, gradient = false, baseDelay = 0 }: { text: string; active: boolean; gradient?: boolean; baseDelay?: number }) {
  return (
    <span className={cn('block', gradient && 'animate-hue-shift')}>
      {text.split('').map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
          <motion.span
            className={cn('inline-block will-change-transform', gradient && 'text-aurora')}
            style={{ transformPerspective: 800 }}
            custom={i}
            variants={{
              hidden: { y: '120%', opacity: 0, rotateX: -70 },
              show: (i: number) => ({
                y: '0%',
                opacity: 1,
                rotateX: 0,
                transition: { duration: 1, delay: baseDelay + i * 0.028, ease: EASE_OUT_EXPO },
              }),
            }}
            initial="hidden"
            animate={active ? 'show' : 'hidden'}
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** Home §1 — full-bleed hero with Aurora Field particle backdrop */
export default function Hero({ active }: { active: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 0.6], [0, -240])
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const fieldScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const fieldOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4])

  return (
    <section ref={ref} className="relative -mt-[76px] flex min-h-[100dvh] items-center overflow-hidden">
      {/* background: deep-field fallback + aurora blobs + particle canvas */}
      <motion.div className="absolute inset-0" style={{ scale: fieldScale, opacity: fieldOpacity }}>
        <div className="deep-field absolute inset-0" />
        <div aria-hidden="true" className="absolute left-[8%] top-[12%] h-80 w-80 animate-blob-drift rounded-full bg-pulse/20 blur-[110px]" />
        <div aria-hidden="true" className="absolute bottom-[8%] right-[12%] h-72 w-72 animate-blob-drift rounded-full bg-wave/10 blur-[110px]" style={{ animationDelay: '-9s' }} />
        <Suspense fallback={null}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.3 }} className="absolute inset-0">
            <AuroraField />
          </motion.div>
        </Suspense>
      </motion.div>

      {/* HUD frame 24px inset, fades out after 6s */}
      <motion.div
        className="pointer-events-none absolute inset-6 z-10"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: [0, 1, 0] } : { opacity: 0 }}
        transition={{ duration: 6.6, times: [0, 0.25, 1], delay: 1 }}
      >
        <HudFrame />
        <span className="absolute left-6 top-0 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">LAT 00.00 // LON 00.00</span>
        <span className="absolute bottom-0 right-6 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">SIG 64-BAND</span>
      </motion.div>

      {/* content */}
      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 mx-auto w-full max-w-[1440px] px-6 text-center lg:px-12">
        <motion.p
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } } }}
          initial="hidden"
          animate={active ? 'show' : 'hidden'}
          className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-pulse" />
          The next-generation music platform
        </motion.p>

        <h1 className="mt-8 font-display text-[clamp(3rem,8.5vw,8rem)] font-black uppercase leading-[0.98] tracking-[-0.02em] text-ghost">
          <SplitChars text="SOUND," active={active} baseDelay={0.1} />
          <SplitChars text="UNDERSTOOD." active={active} gradient baseDelay={0.35} />
        </h1>

        <p className="mx-auto mt-8 max-w-[56ch] text-lg leading-[1.7] text-mist">
          {LEDE.split(' ').map((word, i) => (
            <motion.span
              key={i}
              className="inline-block"
              custom={i}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.5 + i * 0.02, ease: EASE_OUT_EXPO } }),
              }}
              initial="hidden"
              animate={active ? 'show' : 'hidden'}
            >
              {word}
              {' '}
            </motion.span>
          ))}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {[
            { label: 'Get early access', to: '/download', primary: true },
            { label: 'Explore the experience', to: '/experience', primary: false },
          ].map((cta, i) => (
            <motion.div
              key={cta.label}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.8 + i * 0.1, ease: EASE_OUT_EXPO } },
              }}
              initial="hidden"
              animate={active ? 'show' : 'hidden'}
            >
              {cta.primary ? (
                <Link
                  to={cta.to}
                  className="group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-aurora px-8 font-sans text-sm font-bold text-void transition-all duration-300 hover:scale-[1.03] hover:shadow-glow-pulse active:scale-[0.97]"
                >
                  <span className="relative z-10">{cta.label}</span>
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform duration-[600ms] group-hover:translate-x-[340px]" />
                </Link>
              ) : (
                <Link
                  to={cta.to}
                  className="inline-flex h-12 items-center gap-2.5 rounded-full border border-line px-8 font-sans text-sm font-bold text-ghost transition-all duration-300 hover:border-pulse hover:bg-pulse/10 hover:shadow-glow-pulse"
                >
                  <Play className="h-4 w-4" />
                  {cta.label}
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, delay: 1.2 } } }}
        initial="hidden"
        animate={active ? 'show' : 'hidden'}
        className="absolute bottom-8 left-6 z-10 flex items-center gap-3 lg:left-12"
      >
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-smoke">Scroll</span>
        <span className="block h-10 w-[1px] animate-scroll-cue bg-ghost/60" />
      </motion.div>

      {/* live chips */}
      <div className="absolute bottom-8 right-6 z-10 hidden gap-2 sm:flex lg:right-12">
        {CHIPS.map((chip, i) => (
          <motion.span
            key={chip}
            custom={i}
            variants={{
              hidden: { opacity: 0, x: 40 },
              show: (i: number) => ({ opacity: 1, x: 0, transition: { duration: 0.5, delay: 1 + i * 0.08, ease: EASE_OUT_EXPO } }),
            }}
            initial="hidden"
            animate={active ? 'show' : 'hidden'}
            className="rounded-lg border border-line bg-void/40 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-mist backdrop-blur-sm"
          >
            {chip}
          </motion.span>
        ))}
      </div>
    </section>
  )
}
