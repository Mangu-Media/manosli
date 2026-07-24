import { memo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import HudFrame from '@/components/HudFrame'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const CHIPS = ['OFFLINE PLAYBACK', 'ON-WRIST ACTIVITYNET', 'HAPTIC BEAT-COUNT', 'CROWN WAVEFORM SCRUB']

/** pointer-tracked 3D tilt, max 6°, spring return (design.md §7.9) */
function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 200, damping: 24 })
  const sry = useSpring(ry, { stiffness: 200, damping: 24 })

  const onMove = (e: ReactPointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 12)
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 12)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** gentle perpetual float, isolated + memoized */
const FloatWrap = memo(function FloatWrap({ children }: { children: ReactNode }) {
  return (
    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
      {children}
    </motion.div>
  )
})

/** Ecosystem §3 — wearables deep dive: the watch is a real player */
export default function Wearables() {
  const [buzz, setBuzz] = useState(false)
  const buzzTimer = useRef<number | null>(null)

  const hapticDemo = () => {
    if (buzzTimer.current) window.clearTimeout(buzzTimer.current)
    setBuzz(true)
    buzzTimer.current = window.setTimeout(() => setBuzz(false), 600)
  }

  return (
    <section className="py-32">
      <div className="mx-auto grid max-w-[1440px] items-center gap-16 px-6 lg:grid-cols-[45%_55%] lg:px-12">
        {/* watch visual */}
        <motion.div
          initial={{ x: -64, opacity: 0, rotate: -8 }}
          whileInView={{ x: 0, opacity: 1, rotate: 0 }}
          viewport={{ once: true, margin: '-18%' }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          className="relative mx-auto w-full max-w-[380px]"
        >
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pulse/20 blur-[90px]" />
          <Tilt>
            <FloatWrap>
              <motion.div
                onPointerEnter={hapticDemo}
                animate={buzz ? { x: [0, -1.5, 1.5, -1.5, 1.5, 0] } : { x: 0 }}
                transition={{ duration: 0.48 }}
                className="relative rounded-3xl p-6"
              >
                <HudFrame />
                <span className="absolute left-8 top-0 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-smoke">
                  WRIST.01 // FULL STACK
                </span>
                <img
                  src="/assets/watch-ui.png"
                  alt="manosli+ on smartwatch — now playing with progress ring and crown controls"
                  className="relative mx-auto w-full max-w-[300px] drop-shadow-[0_24px_48px_rgba(0,0,0,0.6)]"
                />
                {/* 170 BPM chip flashes with the haptic demo */}
                <motion.span
                  animate={
                    buzz
                      ? { opacity: [0.5, 1, 0.5, 1], scale: [1, 1.08, 1, 1.05] }
                      : { opacity: 0.55, scale: 1 }
                  }
                  transition={{ duration: 0.5 }}
                  className={cn(
                    'absolute right-2 top-16 rounded-lg border px-2.5 py-1 font-mono text-[0.68rem] font-bold tracking-[0.12em]',
                    buzz ? 'border-spark/70 text-spark' : 'border-line text-smoke',
                  )}
                >
                  170 BPM
                </motion.span>
              </motion.div>
            </FloatWrap>
          </Tilt>
        </motion.div>

        {/* copy */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-18%' }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
          >
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-wave" />
            SYS.02 // ON YOUR WRIST
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-18%' }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-6 font-sans text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ghost"
          >
            A real player, not a remote.
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-18%' }}
            transition={{ duration: 0.6, delay: 0.16, ease: EASE_OUT_EXPO }}
            className="mt-5 max-w-[60ch] leading-[1.65] text-mist"
          >
            The watch runs the full on-device stack: offline playlists, ActivityNet on-wrist, haptic
            beat-count you can feel at 170 BPM, and a crown that scrubs the waveform, not a slider
            pretending.
          </motion.p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {CHIPS.map((chip, i) => (
              <motion.span
                key={chip}
                initial={{ scale: 0.7, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: '-15%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 + i * 0.07 }}
                className="rounded-lg border border-line px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-mist"
              >
                {chip}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
