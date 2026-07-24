import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 180, damping: 22 })
  const sry = useSpring(ry, { stiffness: 180, damping: 22 })

  const onMove = (e: ReactPointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * 12)
    rx.set(-py * 12)
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

const CARDS = [
  {
    kicker: 'MOOD ENGINE',
    body: 'On-device neural nets read your signals and re-score your library in real time. The math stays home.',
    linkLabel: 'Meet the Mood Engine',
    to: '/experience',
    img: '/assets/app-mood.png',
    alt: 'Mood Engine screen with live signal readout',
    mode: 'float' as const,
    accent: 'text-pulse',
    hover: 'hover:border-pulse/60 hover:shadow-glow-pulse',
  },
  {
    kicker: 'ROOMS IN SYNC',
    body: 'Six cities, one beat. Shared queues everyone can steer, reactions that land on the drop — never after it.',
    linkLabel: 'Enter a room',
    to: '/social',
    img: '/assets/app-queue.png',
    alt: 'Shared queue screen with co-listeners',
    mode: 'float' as const,
    accent: 'text-beat',
    hover: 'hover:border-beat/60 hover:shadow-glow-beat',
  },
  {
    kicker: 'SEE YOUR MUSIC',
    body: 'Spatial audio you can watch. AR visualizations hang in your room; VR venues turn albums into places.',
    linkLabel: 'Step inside',
    to: '/spatial',
    img: '/assets/glasses-ar.png',
    alt: 'AR visualization floating in a living room',
    mode: 'bg' as const,
    accent: 'text-wave',
    hover: 'hover:border-wave/60 hover:shadow-glow-wave',
  },
]

/** Home §6 — triptych of feature previews with pointer-tracked tilt */
export default function Triptych() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
      <SectionHeader eyebrow="SYS.03 // PREVIEW" title={['THE APP,', 'IN THREE CUTS.']} accentWords={['THREE']} />
      <div className="mt-16 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.kicker}
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.9, delay: i * 0.12, ease: EASE_OUT_EXPO }}
            className={cn('min-w-[85vw] snap-center sm:min-w-[420px] lg:min-w-0', i === 1 && 'lg:mt-10')}
          >
            <Tilt className="group relative aspect-[4/5] overflow-hidden rounded-2xl">
              {c.mode === 'bg' && (
                <>
                  <img
                    src={c.img}
                    alt={c.alt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-[600ms] group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-void/40" />
                </>
              )}
              <div
                className={cn(
                  'relative flex h-full flex-col rounded-2xl p-8 transition-all duration-[450ms]',
                  c.mode === 'bg' ? 'border border-white/10 bg-void/30 backdrop-blur-[6px]' : 'glass glass-sheen',
                  c.hover,
                )}
              >
                <span className={cn('font-mono text-xs font-medium uppercase tracking-[0.22em]', c.accent)}>{c.kicker}</span>
                <p className="mt-5 max-w-[36ch] text-lg leading-[1.7] text-ghost">{c.body}</p>
                {c.mode === 'float' && (
                  <img
                    src={c.img}
                    alt={c.alt}
                    loading="lazy"
                    className="mt-auto h-[52%] w-full object-contain object-bottom drop-shadow-[0_24px_40px_rgba(0,0,0,0.55)] transition-transform duration-[600ms] group-hover:scale-[1.06]"
                  />
                )}
                <div className={c.mode === 'float' ? 'mt-6' : 'mt-auto'}>
                  <Link
                    to={c.to}
                    className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-mist transition-colors duration-300 hover:text-ghost"
                  >
                    <span className={c.accent}>{c.linkLabel}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/link:-translate-y-1 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </Tilt>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
