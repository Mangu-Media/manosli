import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Pause, SkipBack, SkipForward } from 'lucide-react'
import HudFrame from '@/components/HudFrame'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useScrambledText } from './useScrambledText'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface ContextState {
  id: string
  time: string
  title: string
  body: string
  chip: string
  accent: string
}

const STATES: ContextState[] = [
  {
    id: 'focus',
    time: '09:00',
    title: 'DEEP FOCUS',
    body: 'Calendared into a deep-work block? The UI strips itself to lists and type. Artwork noise off. Flow mixes rebuild every hour from your actual skip behavior.',
    chip: 'FOCUS MIX · 62 BPM AVG',
    accent: '#2EE6D6',
  },
  {
    id: 'training',
    time: '18:30',
    title: 'TRAINING',
    body: 'Heart rate 128 and rising. BPM locks to stride, artwork pulses on-beat, and the next track crossfades exactly on phrase.',
    chip: 'HR 128 · CADENCE-LOCKED',
    accent: '#FF3D8A',
  },
  {
    id: 'commute',
    time: '08:15',
    title: 'COMMUTE',
    body: 'Hands on the wheel, eyes up. Voice-first controls, type you can read at a glance, every track cached before you leave Wi-Fi.',
    chip: 'OFFLINE READY',
    accent: '#7C5CFF',
  },
  {
    id: 'afterhours',
    time: '23:47',
    title: 'AFTER HOURS',
    body: "The interface dims itself below your screen's floor. Warm blacks, slow fades, and a wind-down arc the Mood Engine scored for sleep pressure.",
    chip: 'WIND-DOWN · 34 MIN',
    accent: '#FFB224',
  },
]

/* ── per-state environment surfaces (shared by desktop window + mobile cards) ── */

function FocusSurface({ accent }: { accent: string }) {
  const rows: [string, string, string, string][] = [
    ['01', 'Deep Field', 'Arrays', '4:12'],
    ['02', 'Monochrome', 'Kessler', '3:48'],
    ['03', 'Low Clock', 'Aphelion', '5:02'],
    ['04', 'Steady State', 'Nuwave', '4:36'],
  ]
  return (
    <div className="flex h-full flex-col justify-center px-6 sm:px-8">
      {rows.map(([n, t, a, d], i) => (
        <div
          key={n}
          className={cn(
            'flex items-baseline gap-4 py-2.5 sm:py-3',
            i > 0 && 'border-t border-line/60',
            i === 1 && 'bg-white/[0.02]',
          )}
        >
          <span className="font-mono text-[0.8125rem] text-smoke font-tabular">{n}</span>
          <span className="flex-1 truncate text-sm font-medium text-ghost">
            {t} <span className="text-mist">— {a}</span>
          </span>
          <span className="font-mono text-[0.8125rem] text-smoke font-tabular">{d}</span>
        </div>
      ))}
      <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-[0.22em]" style={{ color: accent }}>
        ARTWORK NOISE · OFF
      </p>
    </div>
  )
}

function TrainingSurface({ accent }: { accent: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-6 px-6 sm:gap-10 sm:px-10">
      <div className="relative">
        {/* pulsing ring, on-beat */}
        <span
          aria-hidden="true"
          className="xp-beat-ring absolute -inset-3 rounded-2xl border-2"
          style={{ borderColor: accent }}
        />
        <img
          src="/assets/album-01.png"
          alt="Midnight Circuit — Vector Aurora album artwork pulsing on the beat"
          className="xp-beat-art h-28 w-28 rounded-xl border border-line object-cover shadow-card-lift sm:h-44 sm:w-44"
        />
      </div>
      <div>
        <p className="font-mono text-[0.8125rem] uppercase tracking-[0.22em] text-smoke">NOW PLAYING</p>
        <p className="mt-2 text-base font-bold text-ghost sm:text-lg">Midnight Circuit</p>
        <p className="text-sm text-mist">Vector Aurora</p>
        <p className="mt-4 font-mono text-4xl font-bold tracking-[-0.03em] font-tabular sm:text-5xl" style={{ color: accent }}>
          128
          <span className="ml-2 text-sm font-medium tracking-[0.04em] text-mist">BPM · HR</span>
        </p>
      </div>
    </div>
  )
}

function CommuteSurface({ accent }: { accent: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6">
      <p className="font-mono text-3xl font-bold tracking-[-0.03em] text-ghost font-tabular sm:text-5xl">
        07:42 <span className="text-smoke">/ 12:18</span>
      </p>
      <p className="text-sm text-mist">
        Glasshouse FM <span className="text-smoke">— Mira Solis</span>
      </p>
      <div className="flex items-center gap-5 sm:gap-8">
        <button
          type="button"
          aria-label="Previous track"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-line text-mist transition-colors duration-300 hover:text-ghost sm:h-16 sm:w-16"
        >
          <SkipBack className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="Pause"
          className="flex h-20 w-20 items-center justify-center rounded-full text-void transition-transform duration-300 hover:scale-105 sm:h-24 sm:w-24"
          style={{ background: accent }}
        >
          <Pause className="h-8 w-8 fill-current" />
        </button>
        <button
          type="button"
          aria-label="Next track"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-line text-mist transition-colors duration-300 hover:text-ghost sm:h-16 sm:w-16"
        >
          <SkipForward className="h-6 w-6" />
        </button>
      </div>
      <p className="flex items-center gap-2 font-mono text-[0.8125rem] tracking-[0.04em]" style={{ color: accent }}>
        <Mic className="h-3.5 w-3.5" /> “NEXT” · “LOUDER” · “CALL HOME”
      </p>
    </div>
  )
}

function AfterHoursSurface({ accent }: { accent: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-black/45 px-6">
      <p className="font-mono text-[0.8125rem] uppercase tracking-[0.22em] text-smoke">WINDING DOWN</p>
      <p className="text-base font-medium text-[#C9BBA9]">Honey Waves — Gold Hour</p>
      {/* slow wind-down arc */}
      <div className="relative h-1 w-48 overflow-hidden rounded-full bg-white/10 sm:w-64">
        <div className="absolute inset-y-0 left-0 w-[38%] rounded-full" style={{ background: accent, opacity: 0.75 }} />
      </div>
      <p className="font-mono text-[0.8125rem] tracking-[0.04em] text-smoke font-tabular">34 MIN TO SILENCE</p>
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em]" style={{ color: `${accent}99` }}>
        BRIGHTNESS −62% · MOTION SLOWED
      </p>
    </div>
  )
}

function Surface({ id, accent }: { id: string; accent: string }) {
  switch (id) {
    case 'focus':
      return <FocusSurface accent={accent} />
    case 'training':
      return <TrainingSurface accent={accent} />
    case 'commute':
      return <CommuteSurface accent={accent} />
    default:
      return <AfterHoursSurface accent={accent} />
  }
}

/* ── desktop pinned story ─────────────────────────────────────────────────── */

/** Experience §2 — context-aware UI: pinned 4-state environment window (scrub 0.6) */
export default function ContextStory() {
  const wrapRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const ctx = STATES[active]
  const scrambledTime = useScrambledText(ctx.time, true, 30)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const st = ScrollTrigger.create({
          trigger: wrapRef.current,
          start: 'top top',
          // pinned story ≈ 260vh of scroll (design.md §6: pins run 150–220vh)
          end: '+=160%',
          pin: pinRef.current,
          onUpdate: (self) => {
            if (fillRef.current) fillRef.current.style.width = `${self.progress * 100}%`
            const idx = Math.min(STATES.length - 1, Math.floor(self.progress * STATES.length))
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

  return (
    <section ref={wrapRef} className="relative">
      {/* scoped keyframes for the on-beat training pulse */}
      <style>{`
        @keyframes xp-beat { 0%,100% { transform: scale(1); } 12% { transform: scale(1.045); } 24% { transform: scale(1); } }
        @keyframes xp-beat-ring { 0%,100% { transform: scale(1); opacity: .55; } 12% { transform: scale(1.07); opacity: 1; } 30% { transform: scale(1); opacity: .55; } }
        .xp-beat-art { animation: xp-beat 1.76s ease-in-out infinite; }
        .xp-beat-ring { animation: xp-beat-ring 1.76s ease-in-out infinite; }
      `}</style>

      {/* Desktop: pinned 40/60 stage */}
      <div ref={pinRef} className="hidden min-h-[100dvh] items-center overflow-hidden lg:flex motion-reduce:hidden">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-14 px-6 lg:grid-cols-[2fr_3fr] lg:px-12">
          {/* copy rail */}
          <div>
            <p className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">
              <span className="h-2 w-2 animate-dot-pulse rounded-full bg-pulse" />
              SYS.01 // CONTEXT-AWARE UI
            </p>
            <div className="relative mt-10 h-72">
              <AnimatePresence mode="wait">
                <motion.div
                  key={ctx.id}
                  initial={{ y: 40, opacity: 0, filter: 'blur(4px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: -40, opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                  className="absolute inset-0"
                >
                  <p className="font-mono text-sm tracking-[0.04em] font-tabular" style={{ color: ctx.accent }}>
                    {ctx.time}
                  </p>
                  <h3 className="mt-3 font-display text-[clamp(1.9rem,3vw,2.75rem)] font-bold uppercase leading-[1.05] tracking-[-0.015em] text-ghost">
                    {ctx.title}
                  </h3>
                  <p className="mt-5 max-w-[46ch] leading-[1.7] text-mist">{ctx.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* environment window + progress rail */}
          <div>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
              className="relative"
            >
              <div
                className="glass glass-sheen relative h-[54vh] max-h-[560px] overflow-hidden rounded-[24px] transition-[border-color] duration-500"
                style={{ borderColor: `${ctx.accent}40` }}
              >
                {/* per-state ambient washes, crossfaded */}
                {STATES.map((s, i) => (
                  <div
                    key={s.id}
                    aria-hidden="true"
                    className="absolute inset-0 transition-opacity duration-700"
                    style={{
                      opacity: i === active ? 1 : 0,
                      background: `radial-gradient(ellipse 90% 80% at 50% 0%, ${s.accent}1F, transparent 65%)`,
                    }}
                  />
                ))}

                {/* window header */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] px-6 py-3.5">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">ENV // UI SURFACE</span>
                  <span className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.22em]" style={{ color: ctx.accent }}>
                    <span className="h-1.5 w-1.5 animate-dot-pulse rounded-full" style={{ background: ctx.accent }} />
                    LIVE
                  </span>
                </div>

                {/* state surfaces — layout crossfade (FLIP-approximated shared elements) */}
                <div className="relative h-[calc(100%-7.5rem)]">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={ctx.id}
                      initial={{ opacity: 0, scale: 0.985, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 1.015, filter: 'blur(4px)' }}
                      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                      className="absolute inset-0"
                    >
                      <Surface id={ctx.id} accent={ctx.accent} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* window footer: context chip + scrambled timestamp */}
                <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between border-t border-white/[0.06] px-6 py-3.5">
                  <span
                    className="rounded-lg border px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] transition-colors duration-500"
                    style={{ borderColor: `${ctx.accent}55`, color: ctx.accent }}
                  >
                    {ctx.chip}
                  </span>
                  <span className="font-mono text-[0.8125rem] tracking-[0.04em] text-mist font-tabular">{scrambledTime}</span>
                </div>

                <HudFrame className="m-3" />
              </div>
            </motion.div>

            {/* 4-stop progress rail with mono timestamps */}
            <div className="mt-8 px-1">
              <div className="relative h-[3px] w-full rounded-full bg-line">
                <div ref={fillRef} className="absolute inset-y-0 left-0 w-0 rounded-full bg-aurora" />
                {STATES.map((s, i) => (
                  <motion.span
                    key={s.id}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: '-20%' }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: EASE_OUT_EXPO }}
                    className={cn(
                      'absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-abyss transition-colors duration-300',
                      i <= active && 'border-transparent',
                    )}
                    style={{ left: `${(i / (STATES.length - 1)) * 100}%`, background: i <= active ? STATES[i].accent : undefined }}
                  />
                ))}
              </div>
              <div className="relative mt-3 h-4">
                {STATES.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      'absolute -translate-x-1/2 font-mono text-[0.8125rem] tracking-[0.04em] font-tabular transition-colors duration-300',
                      i === active ? 'text-ghost' : 'text-smoke',
                      i === 0 && 'translate-x-0',
                      i === STATES.length - 1 && '-translate-x-full',
                    )}
                    style={{ left: `${(i / (STATES.length - 1)) * 100}%` }}
                  >
                    {s.time}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/tablet: vertical stack of 4 glass cards with static themed windows */}
      <div className="mx-auto max-w-[1440px] px-6 py-20 lg:hidden motion-reduce:block">
        <p className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-pulse" />
          SYS.01 // CONTEXT-AWARE UI
        </p>
        <h2 className="mt-6 font-display text-[clamp(1.9rem,8vw,2.6rem)] font-bold uppercase leading-[1.05] tracking-[-0.015em] text-ghost">
          The interface reads the moment.
        </h2>
        <div className="mt-10 space-y-6">
          {STATES.map((s, i) => (
            <motion.article
              key={s.id}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12%' }}
              transition={{ duration: 0.7, delay: (i % 2) * 0.08, ease: EASE_OUT_EXPO }}
              className="glass glass-sheen overflow-hidden rounded-2xl"
              style={{ borderColor: `${s.accent}33` }}
            >
              <div className="relative h-56" style={{ background: `radial-gradient(ellipse 90% 80% at 50% 0%, ${s.accent}1A, transparent 65%)` }}>
                <Surface id={s.id} accent={s.accent} />
              </div>
              <div className="border-t border-white/[0.06] p-5">
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-lg border px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em]"
                    style={{ borderColor: `${s.accent}55`, color: s.accent }}
                  >
                    {s.chip}
                  </span>
                  <span className="font-mono text-[0.8125rem] text-smoke font-tabular">{s.time}</span>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold uppercase text-ghost">{s.title}</h3>
                <p className="mt-2 text-sm leading-[1.7] text-mist">{s.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
