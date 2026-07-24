import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun, Sunset } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { getLenis } from '@/lib/scroll'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface DayNode {
  time: string
  name: string
  body: string
  chip: string
  accent: string
}

const NODES: DayNode[] = [
  { time: '06:30', name: 'WAKE', body: 'Slow ramp. News-free, vocals-low, brightness rising with your screen.', chip: 'SUNRISE RAMP', accent: '#FFB224' },
  { time: '08:15', name: 'COMMUTE', body: 'Pre-cached, voice-first, announcement-aware ducking.', chip: 'TRANSIT MODE', accent: '#7C5CFF' },
  { time: '09:00', name: 'FOCUS', body: '62 BPM flow-state scaffolding, rebuilt hourly.', chip: 'DEEP FIELD MIX', accent: '#2EE6D6' },
  { time: '12:30', name: 'WALK', body: 'Open, spacious, lyric-forward. Pace-matched.', chip: 'AMBIENT ERRAND', accent: '#B14BFF' },
  { time: '18:30', name: 'TRAIN', body: 'Cadence-locked, phrase-perfect crossfades.', chip: 'RED LINE 168', accent: '#FF3D8A' },
  { time: '23:00', name: 'UNWIND', body: 'A 34-minute descent into sleep pressure.', chip: 'NIGHT ARC', accent: '#FFB224' },
]

const ARC_D = 'M 60 230 Q 600 -40 1140 230'
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function NodeCard({ node }: { node: DayNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-mono text-[0.8125rem] tracking-[0.04em] font-tabular" style={{ color: node.accent }}>
          {node.time}
        </p>
        <h3 className="mt-1.5 text-xl font-bold text-ghost">{node.name}</h3>
        <p className="mt-1 max-w-[52ch] text-sm leading-[1.7] text-mist">{node.body}</p>
      </div>
      <span
        className="rounded-lg border px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em]"
        style={{ borderColor: `${node.accent}55`, color: node.accent }}
      >
        {node.chip}
      </span>
    </div>
  )
}

/** Experience §5 — "A Day, Scored": scroll-driven sun/moon arc across six moments */
export default function DayArc() {
  const wrapRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const fillRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGGElement>(null)
  const washCoolRef = useRef<HTMLDivElement>(null)
  const washWarmRef = useRef<HTMLDivElement>(null)
  const washNightRef = useRef<HTMLDivElement>(null)
  const mobileFillRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const activeRef = useRef(0)
  const lenRef = useRef(1)
  const [active, setActive] = useState(0)
  const [nodePos, setNodePos] = useState<{ x: number; y: number }[]>([])

  // measure the arc once: node positions + total length for the dash fill
  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const L = path.getTotalLength()
    lenRef.current = L
    setNodePos(
      NODES.map((_, i) => {
        const p = path.getPointAtLength((i / (NODES.length - 1)) * L)
        return { x: p.x, y: p.y }
      }),
    )
    if (fillRef.current) {
      fillRef.current.style.strokeDasharray = `${L}`
      fillRef.current.style.strokeDashoffset = `${L}`
    }
  }, [])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // desktop: pinned 100dvh stage, scrubbed over ~180vh of pin travel
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const path = pathRef.current
        const st = ScrollTrigger.create({
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=180%',
          pin: pinRef.current,
          onUpdate: (self) => {
            const p = self.progress
            const L = lenRef.current
            if (fillRef.current) fillRef.current.style.strokeDashoffset = `${L * (1 - p)}`
            if (path && dotRef.current) {
              const pt = path.getPointAtLength(p * L)
              dotRef.current.setAttribute('transform', `translate(${pt.x},${pt.y})`)
            }
            // background wash cycles cool → warm → night across the day
            if (washCoolRef.current) washCoolRef.current.style.opacity = `${clamp01(1 - p * 1.9)}`
            if (washWarmRef.current) washWarmRef.current.style.opacity = `${clamp01(1 - Math.abs(p - 0.74) / 0.3)}`
            if (washNightRef.current) washNightRef.current.style.opacity = `${clamp01((p - 0.78) / 0.22)}`
            const idx = Math.min(NODES.length - 1, Math.floor(p * NODES.length))
            if (idx !== activeRef.current) {
              activeRef.current = idx
              setActive(idx)
            }
          },
        })
        triggerRef.current = st
        return () => {
          st.kill()
          triggerRef.current = null
        }
      })

      // mobile / reduced-motion: unpinned scrub over the stacked cards
      mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
        const st = ScrollTrigger.create({
          trigger: '#xp-day-stack',
          start: 'top 75%',
          end: 'bottom 55%',
          onUpdate: (self) => {
            if (mobileFillRef.current) mobileFillRef.current.style.height = `${self.progress * 100}%`
            const idx = Math.min(NODES.length - 1, Math.floor(self.progress * NODES.length))
            if (idx !== activeRef.current) {
              activeRef.current = idx
              setActive(idx)
            }
          },
        })
        return () => st.kill()
      })

      return () => mm.revert()
    },
    { scope: wrapRef },
  )

  // clicking a node jumps the scrub position (Lenis scrollTo, 0.8s ease)
  const jumpTo = (i: number) => {
    const st = triggerRef.current
    if (st) {
      const y = st.start + (i / (NODES.length - 1)) * (st.end - st.start)
      getLenis()?.scrollTo(y, { duration: 0.8, easing: (t) => 1 - Math.pow(1 - t, 3) })
    }
  }

  const phase: 'sun' | 'sunset' | 'moon' = active < 4 ? 'sun' : active === 4 ? 'sunset' : 'moon'

  return (
    <section ref={wrapRef} className="relative overflow-hidden">
      {/* cycling background wash: cool → warm → night */}
      <div ref={washCoolRef} aria-hidden="true" className="absolute inset-0" style={{ opacity: 1, background: 'radial-gradient(ellipse 70% 55% at 50% 15%, rgba(46,230,214,0.10), transparent 65%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(124,92,255,0.08), transparent 60%)' }} />
      <div ref={washWarmRef} aria-hidden="true" className="absolute inset-0" style={{ opacity: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 25%, rgba(255,178,36,0.10), transparent 65%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(255,61,138,0.08), transparent 60%)' }} />
      <div ref={washNightRef} aria-hidden="true" className="absolute inset-0" style={{ opacity: 0, background: 'linear-gradient(180deg, rgba(12,7,20,0.0), rgba(12,7,20,0.6)), radial-gradient(ellipse 60% 45% at 50% 90%, rgba(124,92,255,0.08), transparent 60%)' }} />

      {/* Desktop: pinned arc stage */}
      <div ref={pinRef} className="relative hidden min-h-[100dvh] flex-col justify-center lg:flex motion-reduce:hidden">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
          <SectionHeader eyebrow="SYS.04 // ACTIVITY RECOGNITION" title={['YOUR DAY HAS A', 'SOUNDTRACK ARC.']} accentWords={['SOUNDTRACK']} accentDot="bg-spark" />

          <svg viewBox="0 0 1200 300" className="mt-8 w-full" role="img" aria-label="Timeline arc from 06:30 wake to 23:00 unwind">
            <defs>
              <linearGradient id="xp-day-aurora" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7C5CFF" />
                <stop offset="32%" stopColor="#B14BFF" />
                <stop offset="68%" stopColor="#FF3D8A" />
                <stop offset="100%" stopColor="#FFB224" />
              </linearGradient>
            </defs>

            {/* base arc + aurora fill that follows the traveler */}
            <path ref={pathRef} d={ARC_D} fill="none" stroke="#241A38" strokeWidth="2" />
            <path ref={fillRef} d={ARC_D} fill="none" stroke="url(#xp-day-aurora)" strokeWidth="2.5" strokeLinecap="round" />

            {/* nodes */}
            {nodePos.map((pos, i) => (
              <g key={NODES[i].time}>
                {/* activation ripple */}
                <AnimatePresence>
                  {active === i && (
                    <motion.circle
                      key={`ripple-${active}`}
                      cx={pos.x}
                      cy={pos.y}
                      r={8}
                      fill="none"
                      stroke={NODES[i].accent}
                      strokeWidth="1.5"
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 3, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                    />
                  )}
                </AnimatePresence>
                <motion.g
                  animate={{ scale: active === i ? [1, 1.6, 1] : 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={7}
                    fill={active >= i ? NODES[i].accent : '#0C0714'}
                    stroke={NODES[i].accent}
                    strokeWidth="1.5"
                    className="cursor-pointer transition-colors duration-300"
                    onClick={() => jumpTo(i)}
                  />
                </motion.g>
                {/* 44px hit target */}
                <circle cx={pos.x} cy={pos.y} r={22} fill="transparent" className="cursor-pointer" onClick={() => jumpTo(i)}>
                  <title>{`${NODES[i].time} ${NODES[i].name}`}</title>
                </circle>
                <text x={pos.x} y={pos.y - 24} textAnchor="middle" fill={active === i ? '#F5F2FB' : '#6E6584'} fontSize="13" fontFamily="'JetBrains Mono', monospace" className="transition-colors duration-300">
                  {NODES[i].time}
                </text>
                <text x={pos.x} y={pos.y + 34} textAnchor="middle" fill={active === i ? NODES[i].accent : '#6E6584'} fontSize="11" letterSpacing="2" fontFamily="'JetBrains Mono', monospace" className="transition-colors duration-300">
                  {NODES[i].name}
                </text>
              </g>
            ))}

            {/* traveling sun/moon indicator */}
            <g ref={dotRef} transform="translate(60,230)">
              <circle r="13" fill={NODES[active].accent} opacity="0.25" />
              <circle r="5" fill="#F5F2FB" />
              <g transform="translate(-11,-46)" style={{ transition: 'opacity 0.5s' }} opacity={phase === 'sun' ? 1 : 0}>
                <Sun width={22} height={22} color="#FFB224" />
              </g>
              <g transform="translate(-11,-46)" style={{ transition: 'opacity 0.5s' }} opacity={phase === 'sunset' ? 1 : 0}>
                <Sunset width={22} height={22} color="#FF3D8A" />
              </g>
              <g transform="translate(-11,-46)" style={{ transition: 'opacity 0.5s' }} opacity={phase === 'moon' ? 1 : 0}>
                <Moon width={22} height={22} color="#A79FBE" />
              </g>
            </g>
          </svg>

          {/* active node card */}
          <div className="mt-6 min-h-[7.5rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                className="glass glass-sheen rounded-2xl px-6 py-5"
              >
                <NodeCard node={NODES[active]} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile / reduced-motion: vertical line + stacked cards, scrubbed without pin */}
      <div id="xp-day-stack" className="relative py-20 lg:hidden motion-reduce:block">
        <div className="mx-auto max-w-[1440px] px-6">
          <SectionHeader eyebrow="SYS.04 // ACTIVITY RECOGNITION" title={['YOUR DAY HAS A', 'SOUNDTRACK ARC.']} accentWords={['SOUNDTRACK']} accentDot="bg-spark" />
          <div className="relative mt-12 pl-10">
            <div className="absolute bottom-2 left-[7px] top-2 w-[2px] rounded-full bg-line" />
            <div ref={mobileFillRef} className="absolute left-[7px] top-2 w-[2px] rounded-full bg-aurora" style={{ height: 0 }} />
            <div className="space-y-6">
              {NODES.map((node, i) => (
                <motion.article
                  key={node.time}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-15%' }}
                  transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                  className={cn('glass glass-sheen relative rounded-2xl px-5 py-5 transition-[border-color] duration-500')}
                  style={{ borderColor: active === i ? `${node.accent}66` : undefined }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[38px] top-7 h-3 w-3 rounded-full border-2 transition-colors duration-500"
                    style={{
                      borderColor: node.accent,
                      background: active >= i ? node.accent : '#0C0714',
                      boxShadow: active === i ? `0 0 16px ${node.accent}80` : undefined,
                    }}
                  />
                  <NodeCard node={node} />
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
