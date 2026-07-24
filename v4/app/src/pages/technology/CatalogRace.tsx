import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* deterministic pseudo-random (mulberry32) for stable dot positions */
const mulberry = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const ROUTES = [
  { id: 'edge', label: 'EDGE', ms: 12, dur: 1.4, begin: 0, end: [58, 28] as const },
  { id: 'peer', label: 'PEER', ms: 47, dur: 2.1, begin: 0.45, end: [76, 68] as const },
  { id: 'dht', label: 'DHT', ms: 230, dur: 2.8, begin: 0.9, end: [93, 40] as const },
]
const ORIGIN = [8, 50] as const

const routePath = (end: readonly [number, number]) =>
  `M ${ORIGIN[0]} ${ORIGIN[1]} C ${ORIGIN[0] + 18} ${ORIGIN[1] - 26}, ${end[0] - 22} ${end[1] + 14}, ${end[0]} ${end[1]}`

/** Technology §7 — decentralized catalog multi-route race */
export default function CatalogRace() {
  const ref = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { margin: '-15% 0px' })
  const reduced = useReducedMotion()
  const [winner, setWinner] = useState(0)

  const dots = useMemo(() => {
    const r = mulberry(42)
    return Array.from({ length: 40 }, (_, i) => ({
      x: 6 + r() * 90,
      y: 8 + r() * 84,
      delay: r() * 0.4,
      pulseDelay: r() * 3,
      key: i,
    }))
  }, [])

  // winner cycles: edge 70% / peer 20% / dht 10%
  useEffect(() => {
    if (!inView || reduced) return
    const iv = setInterval(() => {
      const r = Math.random()
      setWinner(r < 0.7 ? 0 : r < 0.9 ? 1 : 2)
    }, 4000)
    return () => clearInterval(iv)
  }, [inView, reduced])

  // pause SMIL offscreen
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    if (reduced) {
      svg.pauseAnimations()
      return
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations()), {
      threshold: 0.05,
    })
    io.observe(svg)
    return () => io.disconnect()
  }, [reduced])

  const w = ROUTES[winner]

  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-6 lg:grid-cols-[55%_45%] lg:px-12">
        {/* routing visual */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="glass glass-sheen relative overflow-hidden rounded-3xl p-5"
        >
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">
            RESOLVE // CID bafy…9f3a
          </p>
          <div className="relative mt-4 aspect-[4/3] w-full">
            <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
              {/* node field */}
              {dots.map((d) => (
                <motion.circle
                  key={d.key}
                  cx={d.x}
                  cy={d.y}
                  r={0.5}
                  fill="#A79FBE"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 0.5 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: d.delay }}
                  style={{ transformOrigin: `${d.x}px ${d.y}px`, animation: `dot-pulse 3s ease-in-out ${d.pulseDelay}s infinite` }}
                />
              ))}
              {/* race routes */}
              {ROUTES.map((r, i) => {
                const isWinner = i === winner
                return (
                  <g key={r.id}>
                    <path
                      id={`race-${r.id}`}
                      d={routePath(r.end)}
                      fill="none"
                      stroke={isWinner ? '#2EE6D6' : 'rgba(255,255,255,0.16)'}
                      strokeWidth={isWinner ? 0.6 : 0.35}
                      strokeDasharray="1.8 1.6"
                      style={{ transition: 'stroke 0.4s' }}
                    />
                    {!reduced && (
                      <circle r="1" fill={isWinner ? '#2EE6D6' : '#7C5CFF'}>
                        <animateMotion dur={`${r.dur}s`} begin={`${r.begin}s`} repeatCount="indefinite">
                          <mpath href={`#race-${r.id}`} />
                        </animateMotion>
                      </circle>
                    )}
                    {/* destination node */}
                    <circle
                      cx={r.end[0]}
                      cy={r.end[1]}
                      r={isWinner ? 2.2 : 1.4}
                      fill="none"
                      stroke={isWinner ? '#2EE6D6' : '#6E6584'}
                      strokeWidth="0.4"
                      style={{ transition: 'all 0.4s' }}
                    />
                  </g>
                )
              })}
              {/* origin */}
              <circle cx={ORIGIN[0]} cy={ORIGIN[1]} r="2" fill="#F5F2FB" />
            </svg>
            {/* route labels */}
            {ROUTES.map((r, i) => (
              <span
                key={r.id}
                className={cn(
                  'absolute -translate-x-1/2 font-mono text-[0.6rem] tracking-[0.14em] transition-colors duration-300',
                  i === winner ? 'text-wave' : 'text-smoke',
                )}
                style={{ left: `${r.end[0]}%`, top: `${r.end[1] + 5}%` }}
              >
                {r.label}
              </span>
            ))}
            <span
              className="absolute -translate-x-1/2 font-mono text-[0.6rem] tracking-[0.14em] text-ghost"
              style={{ left: `${ORIGIN[0]}%`, top: `${ORIGIN[1] + 6}%` }}
            >
              YOU
            </span>
          </div>
          <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 font-mono text-[0.75rem] tracking-[0.06em]">
            <span className="text-smoke">MULTI-ROUTE RACE · WINNER:</span>
            <span className="text-wave font-tabular">
              {w.label} ({w.ms}MS)
            </span>
          </p>
        </motion.div>

        {/* copy */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
          >
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-wave" />
            SYS.05 // CATALOG
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-6 font-display text-[clamp(1.35rem,2.4vw,2rem)] font-bold uppercase leading-[1.15] tracking-[-0.01em] text-ghost"
          >
            THE CATALOG HAS NO SINGLE POINT OF FAILURE.
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.6, delay: 0.16, ease: EASE_OUT_EXPO }}
            className="mt-5 max-w-[52ch] leading-[1.7] text-mist"
          >
            Music metadata and artwork are content-addressed and distributed across IPFS with edge acceleration. If a
            datacenter sinks, the music doesn't notice. Neither do you.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.6, delay: 0.26, ease: EASE_OUT_EXPO }}
            className="mt-7 flex flex-wrap gap-2"
          >
            {['CID-ADDRESSED', 'VERIFIABLE INTEGRITY', 'NO REGION LOCKS'].map((c) => (
              <span
                key={c}
                className="rounded-lg border border-wave/40 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-wave/90"
              >
                {c}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
