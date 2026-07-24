import { memo, useRef } from 'react'
import type { ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import SonarRipple from '@/components/SonarRipple'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { getLenis } from '@/lib/scroll'

function SplitChars({ text, gradient = false, baseDelay = 0 }: { text: string; gradient?: boolean; baseDelay?: number }) {
  return (
    <span className={cn('inline-block', gradient && 'animate-hue-shift')}>
      {text.split('').map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
          <motion.span
            className={cn('inline-block will-change-transform', gradient && 'text-aurora')}
            style={{ transformPerspective: 800 }}
            initial={{ y: '120%', opacity: 0, rotateX: -70 }}
            animate={{ y: '0%', opacity: 1, rotateX: 0 }}
            transition={{ duration: 1, delay: baseDelay + i * 0.03, ease: EASE_OUT_EXPO }}
          >
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** device family float loop, isolated + memoized */
const DeviceFloat = memo(function DeviceFloat({ children }: { children: ReactNode }) {
  return (
    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
      {children}
    </motion.div>
  )
})

function scrollToHash(hash: string) {
  const el = document.querySelector(hash)
  if (!(el instanceof HTMLElement)) return
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(el, { offset: -76, duration: 1.4 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

/** Download §1 — launch-event hero with the full device family */
export default function DownloadHero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // devices parallax at 0.5x scroll speed + slight rotate
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 260])
  const imgRotate = useTransform(scrollYProgress, [0, 1], [0, 4])

  const devices = (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.25, ease: EASE_OUT_EXPO }}
    >
      <DeviceFloat>
        <img
          src="/assets/device-family.png"
          alt="manosli+ device family — phone, watch, earbuds, AR glasses and speaker"
          className="w-full drop-shadow-[0_40px_80px_rgba(0,0,0,0.55)]"
        />
      </DeviceFloat>
    </motion.div>
  )

  return (
    <section ref={ref} className="relative -mt-[76px] overflow-hidden">
      <div className="deep-field absolute inset-0" aria-hidden="true" />
      <div aria-hidden="true" className="absolute right-[10%] top-[16%] h-80 w-80 animate-blob-drift rounded-full bg-pulse/20 blur-[110px]" />
      <div aria-hidden="true" className="absolute bottom-[20%] left-[8%] h-72 w-72 animate-blob-drift rounded-full bg-beat/10 blur-[110px]" style={{ animationDelay: '-9s' }} />

      {/* desktop: right-weighted device visual behind the headline, parallax 0.5x */}
      <motion.div
        aria-hidden="true"
        style={{ y: imgY, rotate: imgRotate }}
        className="absolute bottom-0 right-0 hidden w-[52%] max-w-[840px] lg:block"
      >
        <div className="[mask-image:linear-gradient(to_bottom,black_72%,transparent)]">{devices}</div>
      </motion.div>

      <div className="relative z-10 mx-auto flex min-h-[95dvh] w-full max-w-[1440px] flex-col justify-center px-6 pb-16 pt-32 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-spark" />
          Early access — Wave 04 open
        </motion.p>

        <h1 className="mt-8 font-display text-[clamp(3rem,8.5vw,8rem)] font-black uppercase leading-[0.98] tracking-[-0.02em] text-ghost">
          <span className="block">
            <SplitChars text="PRESS " baseDelay={0.1} />
            <SplitChars text="PLAY" gradient baseDelay={0.32} />
          </span>
          <span className="block">
            <SplitChars text="ON THE FUTURE." baseDelay={0.55} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85, ease: EASE_OUT_EXPO }}
          className="mt-8 max-w-[52ch] text-lg leading-[1.7] text-mist"
        >
          One account, every platform, zero tracking. Reserve your handle and download the build for
          everything you own.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1, ease: EASE_OUT_EXPO }}
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <span className="relative inline-flex w-fit">
            <SonarRipple />
            <button
              type="button"
              onClick={() => scrollToHash('#access')}
              className="group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-aurora px-8 font-sans text-sm font-bold text-void transition-all duration-300 hover:scale-[1.03] hover:shadow-glow-pulse active:scale-[0.97]"
            >
              <span className="relative z-10">Reserve your handle</span>
              <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform duration-[600ms] group-hover:translate-x-[340px]" />
            </button>
          </span>
          <button
            type="button"
            onClick={() => scrollToHash('#plans')}
            className="inline-flex h-12 w-fit items-center rounded-full border border-line px-8 font-sans text-sm font-bold text-ghost transition-all duration-300 hover:border-pulse hover:bg-pulse/10 hover:shadow-glow-pulse"
          >
            See plans
          </button>
        </motion.div>

        {/* mobile: devices below copy */}
        <div className="mt-14 lg:hidden">{devices}</div>
      </div>

      {/* bottom fade into void */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-void" />
    </section>
  )
}
