import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const BLEND_PICKS = [
  { album: '/assets/album-02.png', title: 'Glasshouse FM', artist: 'Condensation' },
  { album: '/assets/album-04.png', title: 'Ember Drives', artist: 'Long Exposure' },
  { album: '/assets/album-06.png', title: 'Concrete Bloom', artist: 'Neon Perennial' },
]

const CHIPS = ['DEMOCRATIC QUEUE', 'VETO = 2 DOWNVOTES', 'BLEND ENGINE']

/** Social §4 — Co-Curation & Blend: copy + drifting taste orbs */
export default function CoCuration() {
  const [hovered, setHovered] = useState(false)
  const overlap = useMotionValue(61)
  const overlapText = useTransform(overlap, (v) => String(Math.round(v)))

  useEffect(() => {
    const controls = animate(overlap, hovered ? 34 : 61, { duration: 0.6, ease: EASE_OUT_EXPO })
    return () => controls.stop()
  }, [hovered, overlap])

  return (
    <section className="py-28">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-12">
        {/* copy */}
        <motion.div
          initial={{ opacity: 0, x: -48 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        >
          <p className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-beat" />
            SYS.03 // CO-CURATION
          </p>
          <h3 className="mt-6 font-sans text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ghost">
            THE QUEUE TAKES VOTES. THE BLEND TAKES LIBERTIES.
          </h3>
          <p className="mt-6 max-w-[60ch] leading-[1.65] text-mist">
            Anyone can add, everyone can nudge. Votes re-order the queue live — no host tyranny, no skip wars. And when
            two tastes collide, Blend builds the intersection neither of you would have found alone.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-lg border border-beat/50 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-beat/90"
              >
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        {/* blend visual */}
        <motion.div
          initial={{ opacity: 0, x: 48 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="glass glass-sheen relative overflow-hidden rounded-3xl p-6 sm:p-8"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">Taste intersection</p>
            <span className="rounded-lg border border-spark/60 px-3 py-1 font-mono text-[0.8125rem] tabular-nums tracking-[0.04em] text-spark">
              OVERLAP: <motion.span>{overlapText}</motion.span>%
            </span>
          </div>

          {/* orbs */}
          <div className="relative mx-auto mt-6 flex h-[190px] items-center justify-center">
            {/* amber overlap glow */}
            <motion.div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-spark/40 blur-[50px]"
              animate={{ opacity: hovered ? 0.15 : 0.55 }}
              transition={{ duration: 0.6 }}
            />
            <div className="soc-drift-a absolute left-1/2 top-1/2 -translate-x-[78%] -translate-y-1/2">
              <motion.div
                animate={{ x: hovered ? -20 : 0 }}
                transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                className="flex h-40 w-40 items-center justify-center rounded-full border border-pulse/60 bg-[radial-gradient(circle_at_35%_35%,rgba(124,92,255,0.55),rgba(124,92,255,0.12))] shadow-glow-pulse"
              >
                <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-ghost">You</span>
              </motion.div>
            </div>
            <div className="soc-drift-b absolute left-1/2 top-1/2 -translate-x-[22%] -translate-y-1/2">
              <motion.div
                animate={{ x: hovered ? 20 : 0 }}
                transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                className="flex h-40 w-40 items-center justify-center rounded-full border border-beat/60 bg-[radial-gradient(circle_at_65%_35%,rgba(255,61,138,0.55),rgba(255,61,138,0.12))] shadow-glow-beat"
              >
                <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-ghost">Maya</span>
              </motion.div>
            </div>
          </div>

          {/* blend picks */}
          <div className="mt-6 space-y-2">
            {BLEND_PICKS.map((pick, i) => (
              <motion.div
                key={pick.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.1, ease: EASE_OUT_EXPO }}
                className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-line bg-void/40 p-2.5"
              >
                <img src={pick.album} alt="" className="h-9 w-9 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ghost">{pick.title}</p>
                  <p className="truncate text-xs text-smoke">{pick.artist}</p>
                </div>
                <span className="shrink-0 rounded border border-spark/60 px-2 py-0.5 font-mono text-[0.65rem] tracking-[0.08em] text-spark">
                  BLEND PICK
                </span>
                <span
                  aria-hidden="true"
                  className={cn('soc-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent')}
                  style={{ animationDelay: `${0.4 + i * 0.15}s` }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
