/* eslint-disable react-hooks/purity --
   Dot delays are precomputed once (useMemo) from Math.random — the same
   precompute-once pattern as AuroraField (react-dev.md). */
import { useMemo, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import NoiseText from './NoiseText'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* Low-res equirectangular world bitmap (64 × 32) rendered as a dot grid */
const MAP = [
  '................................................................',
  '....xxxxxxxx......................................................',
  '..xxxxxxxxxxxx.....................xxxxxxxxxx.....................',
  '.xxxxxxxxxxxxxxx......xx......xxxxxxxxxxxxxxxxxxxxx...............',
  '.xxxxxxxxxxxxxxxxx...xxxx...xxxxxxxxxxxxxxxxxxxxxxxxxx............',
  '..xxxxxxxxxxxxxxxxxx..xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxx...........',
  '...xxxxxxxxxxxxxxxxxx..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx..........',
  '....xxxxxxxxxxxxxxxx...xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx..........',
  '.....xxxxxxxxxxxxxx.....xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx..........',
  '......xxxxxxxxxxxx.......xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...........',
  '.......xxxxxxxxxx.........xxxxxxxxxxxxxxxxxxxxxxxxxx..............',
  '........xxxxxxxx...........xxxxxxxxxxxxxxxxxxxxxx.................',
  '.........xxxxxx.............xxxxxxxxxxxxxxxxxxxx..................',
  '..........xxxxx..............xxxxxxxxxxxxxxxxx....................',
  '..........xxxxxx..............xxxxxxxxxxxxxxxx......xx............',
  '...........xxxxxx.............xxxxxxxxxxxxxxxx.....xxxx...........',
  '...........xxxxxx.............xxxxxxxxxxxxxxx......xxxxxx.........',
  '............xxxxx..............xxxxxxxxxxxxx........xxxxxx........',
  '............xxxxx...............xxxxxxxxxx..........xxxxxx........',
  '.............xxxx...............xxxxxxxxxx...........xxxx.........',
  '.............xxxx................xxxxxxxxx............xxx.........',
  '..............xxx.................xxxxxxx.........................',
  '..............xx...................xxxxx..........................',
  '...............x....................xxx...........................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
]

const CELL = 20
const W = 1280
const H = 640

interface RoomDot {
  x: number
  y: number
  amber: boolean
  delay: number
  city?: string
}

const CITIES: [string, number, number][] = [
  ['TOKYO', 54, 8],
  ['BERLIN', 34, 5],
  ['NEW YORK', 16, 7],
  ['SÃO PAULO', 13, 18],
  ['LAGOS', 34, 13],
  ['SYDNEY', 55, 20],
]

const EXTRA_ROOMS: [number, number][] = [
  [8, 4], [12, 6], [6, 8], [20, 9], [31, 6], [37, 7], [44, 5], [48, 7],
  [52, 9], [58, 6], [35, 12], [37, 15], [33, 16], [15, 15], [16, 20],
  [52, 14], [54, 15], [57, 19],
]

const ARCS = [
  // New York → Tokyo (over the top)
  'M330,150 Q710,-60 1090,170',
  // Berlin → São Paulo
  'M690,110 Q420,330 270,370',
  // Lagos → Sydney
  'M690,270 Q950,340 1110,410',
]

const LEDE =
  'Rooms that hold six cities on the same beat. Queues that take votes. A blend engine that finds the record both of you forgot you loved. Under 40 milliseconds apart — close enough to share a breath.'

/** Social §1 — page hero: dot-grid world map, pulsing rooms, great arcs */
export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const mapY = useTransform(scrollYProgress, [0, 1], [0, 260])
  const mapOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.12])

  const { landDots, roomDots } = useMemo(() => {
    const land: { x: number; y: number; delay: number }[] = []
    MAP.forEach((row, r) => {
      row.split('').forEach((c, col) => {
        if (c === 'x') land.push({ x: col * CELL + 10, y: r * CELL + 10, delay: Math.random() * 1.4 })
      })
    })
    const rooms: RoomDot[] = [
      ...CITIES.map(([city, cx, cy], i) => ({
        x: cx * CELL + 10,
        y: cy * CELL + 10,
        amber: i % 2 === 1,
        delay: 0.5 + Math.random() * 2,
        city,
      })),
      ...EXTRA_ROOMS.map(([cx, cy], i) => ({
        x: cx * CELL + 10,
        y: cy * CELL + 10,
        amber: i % 3 === 0,
        delay: 0.5 + Math.random() * 2,
      })),
    ]
    return { landDots: land, roomDots: rooms }
  }, [])

  return (
    <section ref={ref} className="relative -mt-[76px] flex min-h-[90dvh] items-center overflow-hidden">
      {/* dot-grid world map */}
      <motion.div style={{ y: mapY, opacity: mapOpacity }} className="absolute inset-0" aria-hidden="true">
        <div className="deep-field absolute inset-0" />
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          {landDots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={2.4} fill="#241A38" className="soc-dot" style={{ animationDelay: `${d.delay}s` }} />
          ))}
          {/* great arcs */}
          {ARCS.map((d, i) => (
            <g key={i}>
              <motion.path
                d={d}
                fill="none"
                stroke="#FF3D8A"
                strokeOpacity={0.45}
                strokeWidth={1.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: 1 + i * 0.2, ease: EASE_OUT_EXPO }}
              />
              <path
                d={d}
                fill="none"
                stroke={i === 1 ? '#FFB224' : '#FF3D8A'}
                strokeWidth={2}
                pathLength={100}
                className="soc-arc-travel"
                style={{ animationDelay: `${i * 1.3}s` }}
              />
            </g>
          ))}
          {/* room dots with sonar ping */}
          {roomDots.map((r, i) => (
            <g key={i} className="soc-dot" style={{ animationDelay: `${0.6 + i * 0.02}s` }}>
              <circle
                cx={r.x}
                cy={r.y}
                r={5}
                fill="none"
                stroke={r.amber ? '#FFB224' : '#FF3D8A'}
                strokeWidth={1.2}
                className="soc-ping"
                style={{ animationDelay: `${r.delay}s` }}
              />
              <circle cx={r.x} cy={r.y} r={3.2} fill={r.amber ? '#FFB224' : '#FF3D8A'} />
            </g>
          ))}
        </svg>
      </motion.div>

      {/* content */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pt-[76px] text-center lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-beat" />
          Together
        </motion.p>

        <h1 className="mt-8 font-display text-[clamp(2.5rem,6vw,5.25rem)] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-ghost">
          <NoiseText text="ALONE," baseDelay={0.2} className="block" />
          <NoiseText
            text="TOGETHER."
            baseDelay={0.55}
            className="block bg-[linear-gradient(120deg,#FF3D8A,#FFB224)] bg-clip-text text-transparent"
          />
        </h1>

        <p className="mx-auto mt-8 max-w-[60ch] text-lg leading-[1.7] text-mist">
          {LEDE.split(' ').map((word, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 + i * 0.02, ease: EASE_OUT_EXPO }}
            >
              {word}
              {'\u00A0'}
            </motion.span>
          ))}
        </p>
      </div>

      {/* bottom fade into next section */}
      <div aria-hidden="true" className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-void')} />
    </section>
  )
}
