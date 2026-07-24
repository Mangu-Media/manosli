import { useEffect, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Play, RefreshCw } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import CountUp from '@/components/CountUp'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* ── tilt card: pointer-tracked 3D tilt, max 6°, glare follows pointer ────── */

function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const srx = useSpring(rx, { stiffness: 260, damping: 22 })
  const sry = useSpring(ry, { stiffness: 260, damping: 22 })
  const glare = useTransform([gx, gy], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.09), transparent 55%)`)

  const onMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect()
    const px = (ev.clientX - rect.left) / rect.width
    const py = (ev.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 12) // ±6°
    rx.set((0.5 - py) * 12)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
    gx.set(50)
    gy.set(50)
  }

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={cn('relative will-change-transform', className)}
    >
      {children}
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: glare }} />
    </motion.div>
  )
}

/* ── data ─────────────────────────────────────────────────────────────────── */

type Row = [title: string, artist: string, duration: string]

interface Playlist {
  name: string
  descriptor: string
  accent: string
  match: number
  sets: Row[][]
}

const PLAYLISTS: Playlist[] = [
  {
    name: 'Deep Field',
    descriptor: 'FOCUS · 62 BPM AVG',
    accent: '#2EE6D6',
    match: 97,
    sets: [
      [
        ['Deep Field', 'Arrays', '4:12'],
        ['Monochrome', 'Kessler', '3:48'],
        ['Low Clock', 'Aphelion', '5:02'],
        ['Steady State', 'Nuwave', '4:36'],
      ],
      [
        ['Quiet Machines', 'Halcyon', '3:58'],
        ['Paper Satellites', 'Orbitline', '4:44'],
        ['Slow Math', 'Kessler', '5:12'],
        ['Night Desk', 'Nuwave', '3:36'],
      ],
      [
        ['Fathom', 'Deep Current', '4:22'],
        ['Still Air', 'Aphelion', '4:58'],
        ['Granite', 'Monolith', '3:44'],
        ['Window Seat', 'Arrays', '5:20'],
      ],
    ],
  },
  {
    name: 'Red Line',
    descriptor: 'TRAINING · 168 BPM',
    accent: '#FF3D8A',
    match: 98,
    sets: [
      [
        ['Red Line', 'Vector Aurora', '3:36'],
        ['Adrenal', 'Kessler', '3:22'],
        ['Stride Lock', 'Nuwave', '3:48'],
        ['168', 'Aphelion', '3:15'],
      ],
      [
        ['Phaser', 'Canyon Run', '3:30'],
        ['Lactic', 'Mira Solis', '3:41'],
        ['Kick Drum Heart', 'Vector Aurora', '3:27'],
        ['Sprint Interval', 'Kessler', '3:33'],
      ],
      [
        ['Overdrive', 'Gold Hour', '3:18'],
        ['Paceline', 'Arrays', '3:52'],
        ['Redline Riot', 'Kessler', '3:26'],
        ['Last Rep', 'Nuwave', '3:44'],
      ],
    ],
  },
  {
    name: 'Night Arc',
    descriptor: 'UNWIND · 34 MIN',
    accent: '#7C5CFF',
    match: 94,
    sets: [
      [
        ['Honey Waves', 'Gold Hour', '4:36'],
        ['Low Orbit', 'Aphelion', '5:12'],
        ['Pastel Static', 'Nuwave', '4:04'],
        ['Dim', 'Kessler', '4:48'],
      ],
      [
        ['Slow Descent', 'Deep Current', '5:02'],
        ['Amber Room', 'Gold Hour', '4:26'],
        ['Velvet Static', 'Nuwave', '3:58'],
        ['Half Moon', 'Aphelion', '4:40'],
      ],
      [
        ['Tidal Logic', 'Deep Current', '4:52'],
        ['Glasshouse (Night Mix)', 'Mira Solis', '4:18'],
        ['Sleep Pressure', 'Kessler', '5:08'],
        ['Ember Fade', 'Canyon Run', '4:30'],
      ],
    ],
  },
]

const INITIAL_STAMPS = [12, 27, 43] // minutes ago
const BOOT_TS = Date.now() // module-load timestamp; render stays pure

function stampLabel(ts: number, now: number) {
  const mins = Math.round((now - ts) / 60000)
  return mins < 1 ? 'JUST NOW' : `${mins} MIN AGO`
}

/* ── one generative playlist card ─────────────────────────────────────────── */

function PlaylistCard({ playlist, stampStart, index }: { playlist: Playlist; stampStart: number; index: number }) {
  const [setIndex, setSetIndex] = useState(0)
  const [spins, setSpins] = useState(0)
  const [regenAt, setRegenAt] = useState(stampStart)
  const [stamp, setStamp] = useState(() => stampLabel(stampStart, BOOT_TS))

  // stamp ticks over time ("JUST NOW" → "1 MIN AGO" → …)
  useEffect(() => {
    const id = window.setInterval(() => setStamp(stampLabel(regenAt, Date.now())), 15000)
    return () => window.clearInterval(id)
  }, [regenAt])

  const refresh = () => {
    setSetIndex((i) => (i + 1) % playlist.sets.length)
    setSpins((s) => s + 1)
    const now = Date.now()
    setRegenAt(now)
    setStamp('JUST NOW')
  }

  return (
    <motion.div
      initial={{ y: 56, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: EASE_OUT_EXPO }}
    >
      <TiltCard>
        <div className="glass glass-sheen rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2.5 text-xl font-bold text-ghost">
                <span className="h-2 w-2 rounded-full" style={{ background: playlist.accent }} />
                {playlist.name}
              </h3>
              <p className="mt-1 font-mono text-[0.8125rem] tracking-[0.04em] text-smoke">{playlist.descriptor}</p>
            </div>
            <span
              className="rounded-lg border px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em]"
              style={{ borderColor: `${playlist.accent}55`, color: playlist.accent }}
            >
              <CountUp to={playlist.match} suffix="%" duration={1.4} /> MATCH
            </span>
          </div>

          <div className="mt-5 min-h-[11.5rem]">
            <AnimatePresence mode="wait">
              <motion.ul
                key={setIndex}
                initial="enter"
                animate="show"
                exit="exit"
                variants={{
                  enter: {},
                  show: { transition: { staggerChildren: 0.05 } },
                  exit: { transition: { staggerChildren: 0.04 } },
                }}
              >
                {playlist.sets[setIndex].map(([title, artist, duration], ri) => (
                  <motion.li
                    key={`${setIndex}-${title}`}
                    variants={{
                      enter: { opacity: 0, x: 16 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT_EXPO } },
                      exit: { opacity: 0, x: -12, transition: { duration: 0.25, ease: EASE_OUT_EXPO } },
                    }}
                    className={cn(
                      'group flex items-center gap-3 py-2.5 transition-transform duration-300 hover:translate-x-1',
                      ri > 0 && 'border-t border-line/40',
                    )}
                  >
                    <span className="w-5 font-mono text-[0.8125rem] text-smoke font-tabular">{String(ri + 1).padStart(2, '0')}</span>
                    <Play className="h-3 w-3 fill-current text-ghost opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="flex-1 truncate text-sm text-ghost">
                      {title} <span className="text-mist">— {artist}</span>
                    </span>
                    <span className="font-mono text-[0.8125rem] text-smoke font-tabular">{duration}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4">
            <span className="font-mono text-[0.8125rem] tracking-[0.04em] text-smoke">
              REGENERATED <span className="text-mist font-tabular">{stamp}</span>
            </span>
            <button
              type="button"
              onClick={refresh}
              aria-label={`Regenerate the ${playlist.name} playlist`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-mist transition-all duration-300 hover:text-ghost"
              onPointerEnter={(ev) => (ev.currentTarget.style.borderColor = `${playlist.accent}88`)}
              onPointerLeave={(ev) => (ev.currentTarget.style.borderColor = '')}
            >
              <motion.span animate={{ rotate: spins * 360 }} transition={{ duration: 0.6, ease: EASE_OUT_EXPO }} className="flex">
                <RefreshCw className="h-4 w-4" />
              </motion.span>
            </button>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  )
}

/** Experience §6 — Always Fresh: generative playlists remade every hour */
export default function FreshPlaylists() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.05 // GENERATION"
          title={['MADE FOR YOU.', 'REMADE EVERY HOUR.']}
          accentWords={['REMADE']}
          accentDot="bg-pulse"
          lede="No playlist in your library is static. The engine re-cuts each one against your latest skips, saves, and sessions — on the hour, on-device."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {PLAYLISTS.map((p, i) => (
            <PlaylistCard key={p.name} playlist={p} stampStart={BOOT_TS - INITIAL_STAMPS[i] * 60000} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
