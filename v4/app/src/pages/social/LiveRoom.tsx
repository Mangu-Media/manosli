import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { ChevronDown, ChevronUp, Flame, GripVertical, Heart, Moon, Plus, UserPlus, Zap } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import SpectrumBars from '@/components/SpectrumBars'
import { useToast } from './Toast'
import { EASE_OUT_EXPO, EASE_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ data */

const LISTENERS = [
  { name: 'Maya', avatar: '/assets/avatar-01.png', ring: 'ring-beat' },
  { name: 'Darius', avatar: '/assets/avatar-02.png', ring: 'ring-wave' },
  { name: 'Lin', avatar: '/assets/avatar-03.png', ring: 'ring-beat' },
  { name: 'Ole', avatar: '/assets/avatar-04.png', ring: 'ring-spark' },
  { name: 'Ren', avatar: '/assets/avatar-05.png', ring: 'ring-wave' },
  { name: 'YOU', avatar: '/assets/avatar-06.png', ring: 'ring-pulse' },
]
const YOU = 5

interface QueueItem {
  id: number
  album: string
  title: string
  artist: string
  addedBy: number
  up: number
  down: number
}

let nextId = 100
const INITIAL_QUEUE: QueueItem[] = [
  { id: 1, album: '/assets/album-02.png', title: 'Glasshouse FM', artist: 'Condensation', addedBy: 2, up: 4, down: 0 },
  { id: 2, album: '/assets/album-03.png', title: 'Mariana', artist: 'Tidal Logic', addedBy: 1, up: 3, down: 1 },
  { id: 3, album: '/assets/album-04.png', title: 'Long Exposure', artist: 'Ember Drives', addedBy: 0, up: 5, down: 0 },
  { id: 4, album: '/assets/album-05.png', title: 'VHS Hearts', artist: 'Pastel Static', addedBy: 4, up: 2, down: 2 },
  { id: 5, album: '/assets/album-06.png', title: 'Neon Perennial', artist: 'Concrete Bloom', addedBy: YOU, up: 6, down: 1 },
  { id: 6, album: '/assets/album-08.png', title: 'Slow Gold', artist: 'Honey Waves', addedBy: 3, up: 3, down: 0 },
]

const ADD_TRACKS = [
  { album: '/assets/album-01.png', title: 'Midnight Circuit', artist: 'Vector Aurora' },
  { album: '/assets/album-03.png', title: 'Second Tide', artist: 'Tidal Logic' },
  { album: '/assets/album-05.png', title: 'Rewind Heart', artist: 'Pastel Static' },
  { album: '/assets/album-08.png', title: 'Amberline', artist: 'Honey Waves' },
]

const PRESENCE = [
  'Maya switched to her watch',
  'Darius is on the living-room speaker',
  'Lin rejoined from offline',
  'Ren turned on spatial audio',
  'Ole is driving — audio only',
]

type ReactionIcon = 'heart' | 'flame' | 'zap' | 'moon'
const REACTIONS: { key: ReactionIcon; Icon: typeof Heart; color: string }[] = [
  { key: 'heart', Icon: Heart, color: 'text-beat' },
  { key: 'flame', Icon: Flame, color: 'text-spark' },
  { key: 'zap', Icon: Zap, color: 'text-wave' },
  { key: 'moon', Icon: Moon, color: 'text-pulse' },
]

interface Floater {
  id: number
  icon: ReactionIcon
  x: number
  drift: number
}

const TRACK_SECONDS = 252 // 4:12

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

/* -------------------------------------------------------------- component */

/** Social §3 — the Live Room: fully simulated co-listening room */
export default function LiveRoom() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-15% 0px' })
  const reduced = useReducedMotion()
  const { show, host } = useToast()

  const [progress, setProgress] = useState(0.31)
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE)
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [addIdx, setAddIdx] = useState(0)
  const [voted, setVoted] = useState<Set<number>>(new Set())
  const [hopAvatar, setHopAvatar] = useState<number | null>(null)
  const [presence, setPresence] = useState('Maya is listening on AirPods')
  const [presencePulse, setPresencePulse] = useState<number | null>(null)

  const interacted = useRef(false)
  const hidden = useRef(false)
  const fine = useRef(true)
  useEffect(() => {
    fine.current = window.matchMedia('(pointer: fine)').matches
    const onVis = () => (hidden.current = document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const autoSim = inView && !reduced && (fine.current || interacted.current)

  /* playhead — rAF with tab-visibility + offscreen pause (page-level notes) */
  useEffect(() => {
    if (!inView) return
    let raf = 0
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.25)
      last = now
      if (!hidden.current) setProgress((p) => (p + dt / TRACK_SECONDS) % 1)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView])

  /* simulated listener reactions every 5–9s */
  useEffect(() => {
    if (!autoSim) return
    let alive = true
    let timer: ReturnType<typeof setTimeout>
    const fire = () => {
      if (!alive) return
      spawnReaction(REACTIONS[Math.floor(Math.random() * REACTIONS.length)].key, false)
      timer = setTimeout(fire, 5000 + Math.random() * 4000)
    }
    timer = setTimeout(fire, 5000 + Math.random() * 4000)
    return () => {
      alive = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSim])

  /* presence nudges every ~12s */
  useEffect(() => {
    if (!autoSim) return
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * (LISTENERS.length - 1))
      setPresence(PRESENCE[idx % PRESENCE.length])
      setPresencePulse(idx)
      setTimeout(() => setPresencePulse(null), 2400)
    }, 12000)
    return () => clearInterval(id)
  }, [autoSim])

  /* ---------------------------------------------------------- interactions */

  const spawnReaction = useCallback(
    (icon: ReactionIcon, mine: boolean) => {
      if (mine) interacted.current = true
      setFloaters((f) => {
        const capped = f.length >= 6 ? f.slice(f.length - 5) : f
        return [
          ...capped,
          { id: nextId++, icon, x: 20 + Math.random() * 60, drift: (Math.random() - 0.5) * 80 },
        ]
      })
    },
    [],
  )

  const addTrack = useCallback(() => {
    interacted.current = true
    const t = ADD_TRACKS[addIdx % ADD_TRACKS.length]
    setAddIdx((i) => i + 1)
    const id = nextId++
    setQueue((q) => [...q, { id, album: t.album, title: t.title, artist: t.artist, addedBy: YOU, up: 1, down: 0 }])
    // a simulated listener upvotes 0.8s later (avatar hops, count ticks)
    setTimeout(() => {
      const idx = Math.floor(Math.random() * (LISTENERS.length - 1))
      setHopAvatar(idx)
      setQueue((q) => q.map((item) => (item.id === id ? { ...item, up: item.up + 1 } : item)))
      setTimeout(() => setHopAvatar(null), 700)
    }, 800)
  }, [addIdx])

  const vote = useCallback(
    (id: number, dir: 'up' | 'down') => {
      interacted.current = true
      if (voted.has(id)) return
      setVoted((v) => new Set(v).add(id))
      setQueue((q) => q.map((item) => (item.id === id ? { ...item, [dir]: item[dir] + 1 } : item)))
    },
    [voted],
  )

  const invite = useCallback(async () => {
    interacted.current = true
    try {
      await navigator.clipboard.writeText('https://manosli.plus/room/night-drive')
    } catch {
      /* clipboard unavailable — toast anyway */
    }
    show('Room link copied. Six seats left.')
  }, [show])

  /* waveform bars (deterministic) */
  const bars = useMemo(
    () => Array.from({ length: 56 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 0.7) * 0.6 + Math.sin(i * 0.23) * 0.4)),
    [],
  )

  const now = progress * TRACK_SECONDS

  return (
    <section className="py-28">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.02 // LIVE DEMO"
          title={["THIS ROOM IS FAKE.", "THE FEELING ISN'T."]}
          accentWords={['FEELING']}
          accentDot="bg-beat"
        />

        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-12%' }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="glass glass-sheen relative mt-14 overflow-hidden rounded-3xl p-5 sm:p-8"
          style={{ minHeight: 640 }}
          onPointerDown={() => (interacted.current = true)}
        >
          {/* floating reactions layer */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            <AnimatePresence>
              {floaters.map((f) => {
                const R = REACTIONS.find((r) => r.key === f.icon)!
                return (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 0, x: f.x, scale: 0.8 }}
                    animate={
                      reduced
                        ? { opacity: [0, 1, 0], scale: 1 }
                        : { opacity: [0, 1, 1, 0], y: -240, x: f.x + f.drift, scale: [0.8, 1.2, 0.9] }
                    }
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, ease: 'easeOut' }}
                    onAnimationComplete={() => setFloaters((cur) => cur.filter((c) => c.id !== f.id))}
                    className="absolute bottom-20"
                    style={{ left: `${f.x}%` }}
                  >
                    <R.Icon className={cn('h-6 w-6 fill-current', R.color)} />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* header */}
          <div className="flex flex-wrap items-center gap-3">
            <Moon className="h-5 w-5 text-pulse" />
            <h3 className="font-sans text-xl font-bold tracking-[-0.01em] text-ghost">NIGHT DRIVE</h3>
            <span className="rounded-lg border border-beat/60 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-beat">
              6 LISTENING
            </span>
            <span className="rounded-lg border border-wave/60 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-wave">
              IN SYNC · 31MS
            </span>
            <button
              type="button"
              onClick={invite}
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 font-mono text-xs uppercase tracking-[0.14em] text-mist transition-all duration-300 hover:border-beat hover:bg-beat/10 hover:text-ghost focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse"
            >
              <UserPlus className="h-4 w-4" />
              Invite
            </button>
          </div>

          {/* avatar stack + presence */}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-3">
              {LISTENERS.map((l, i) => (
                <motion.div
                  key={l.name}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.45, delay: 0.2 + i * 0.07, ease: EASE_SPRING }}
                  animate={hopAvatar === i ? { y: [0, -8, 0] } : { y: 0 }}
                  className="relative"
                >
                  <img
                    src={l.avatar}
                    alt={l.name === 'YOU' ? 'Your avatar' : `${l.name}'s avatar`}
                    className={cn(
                      'h-10 w-10 rounded-full object-cover ring-2 ring-offset-2 ring-offset-panel transition-shadow duration-500',
                      l.ring,
                      presencePulse === i && 'shadow-glow-beat',
                    )}
                  />
                  {l.name === 'YOU' && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded bg-pulse px-1 font-mono text-[0.55rem] font-bold text-void">
                      YOU
                    </span>
                  )}
                  {presencePulse === i && (
                    <span aria-hidden="true" className="soc-ping absolute inset-0 rounded-full border border-beat" />
                  )}
                </motion.div>
              ))}
            </div>
            <p className="font-mono text-[0.8125rem] tracking-[0.04em] text-smoke">
              <span className="mr-2 inline-block h-1.5 w-1.5 animate-dot-pulse rounded-full bg-wave align-middle" />
              {presence}
            </p>
          </div>

          {/* body 60/40 */}
          <div className="mt-8 grid gap-8 lg:grid-cols-5">
            {/* now playing */}
            <div className="lg:col-span-3">
              <div className="relative">
                <div aria-hidden="true" className="soc-breathe absolute -inset-6 rounded-full bg-beat/25 blur-[70px]" />
                <motion.div
                  initial={{ filter: 'blur(12px)', opacity: 0.4 }}
                  whileInView={{ filter: 'blur(0px)', opacity: 1 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 1, ease: EASE_OUT_EXPO }}
                  className="relative overflow-hidden rounded-2xl border border-line"
                >
                  <img src="/assets/album-07.png" alt="Low Orbit — Aphelion album artwork" className="aspect-square w-full object-cover" />
                  <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-void/90 to-transparent" />
                  <SpectrumBars bars={24} className="absolute bottom-3 left-4 right-4 h-10 justify-between" barClassName="w-[4px]" playing={inView} />
                </motion.div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="font-sans text-2xl font-bold text-ghost">Low Orbit</p>
                  <p className="mt-1 text-sm text-mist">Aphelion</p>
                </div>
                <p className="font-mono text-[0.8125rem] tabular-nums tracking-[0.04em] text-smoke">
                  {fmtTime(now)} / {fmtTime(TRACK_SECONDS)}
                </p>
              </div>

              {/* waveform progress */}
              <div className="mt-3 flex h-12 items-end gap-[3px]" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Track progress">
                {bars.map((h, i) => {
                  const played = i / bars.length < progress
                  const nearHead = Math.abs(i / bars.length - progress) < 0.045
                  return (
                    <span
                      key={i}
                      aria-hidden="true"
                      className={cn(
                        'w-full origin-bottom rounded-full transition-colors duration-300',
                        played ? 'bg-spectrum' : 'bg-line',
                        played && nearHead && 'animate-eq-bar',
                      )}
                      style={{ height: `${h * 100}%` }}
                    />
                  )
                })}
              </div>
            </div>

            {/* shared queue */}
            <div className="lg:col-span-2">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">Shared queue</p>
              <ul className="mt-4 space-y-2">
                <AnimatePresence initial={false}>
                  {queue.map((item, i) => (
                    <motion.li
                      key={item.id}
                      layout="position"
                      initial={{ opacity: 0, x: 32, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, delay: i < 6 ? 0.3 + i * 0.06 : 0, ease: EASE_SPRING }}
                      className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors duration-300 hover:border-line hover:bg-line/30"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-smoke/50" aria-hidden="true" />
                      <img src={item.album} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ghost">{item.title}</p>
                        <p className="truncate text-xs text-smoke">{item.artist}</p>
                      </div>
                      <img
                        src={LISTENERS[item.addedBy].avatar}
                        alt={`added by ${LISTENERS[item.addedBy].name}`}
                        title={`added by ${LISTENERS[item.addedBy].name}`}
                        className={cn('h-5 w-5 shrink-0 rounded-full object-cover ring-1', LISTENERS[item.addedBy].ring)}
                      />
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => vote(item.id, 'up')}
                          aria-label={`upvote ${item.title}`}
                          className="flex items-center gap-0.5 rounded-md border border-line px-1.5 py-0.5 font-mono text-[0.7rem] tabular-nums text-mist transition-colors duration-200 hover:border-wave hover:text-wave"
                        >
                          <ChevronUp className="h-3 w-3" />
                          {item.up}
                        </button>
                        <button
                          type="button"
                          onClick={() => vote(item.id, 'down')}
                          aria-label={`downvote ${item.title}`}
                          className="flex items-center gap-0.5 rounded-md border border-line px-1.5 py-0.5 font-mono text-[0.7rem] tabular-nums text-mist transition-colors duration-200 hover:border-beat hover:text-beat"
                        >
                          <ChevronDown className="h-3 w-3" />
                          {item.down}
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>

          {/* bottom bar: reactions + add track */}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <div className="flex items-center gap-2">
              {REACTIONS.map(({ key, Icon, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => spawnReaction(key, true)}
                  aria-label={`send ${key} reaction`}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-line transition-all duration-200 hover:scale-110 hover:border-ghost/30 active:scale-95"
                >
                  <Icon className={cn('h-5 w-5', color)} />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={addTrack}
              className="group relative ml-auto inline-flex h-11 items-center gap-2 overflow-hidden rounded-full bg-aurora px-6 font-sans text-sm font-bold text-void transition-all duration-300 hover:scale-[1.03] hover:shadow-glow-beat active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              <span className="relative z-10">Add a track</span>
              <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform [transition-duration:600ms] group-hover:translate-x-[260px]" />
            </button>
          </div>
        </motion.div>
      </div>
      {host}
    </section>
  )
}
