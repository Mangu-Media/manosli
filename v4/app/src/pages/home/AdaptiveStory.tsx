import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/SectionHeader'
import HudFrame from '@/components/HudFrame'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const CONTEXTS = [
  {
    chip: 'DEEP FOCUS',
    time: '09:00',
    title: 'Distraction-free surface.',
    body: 'Denser lists, zero artwork noise, flow-state mixes rebuilt hourly. The UI gets out of the way.',
    accent: '#2EE6D6',
    filter: 'saturate(0.85) hue-rotate(140deg) brightness(1.05)',
  },
  {
    chip: 'TRAINING',
    time: '18:30',
    title: 'Heart-rate aware.',
    body: 'BPM locks to your stride; artwork pulses on the beat. Recovery tracks fade in as you cool down.',
    accent: '#FF3D8A',
    filter: 'saturate(1.45) contrast(1.06) hue-rotate(-12deg)',
  },
  {
    chip: 'COMMUTE',
    time: '08:15',
    title: 'Hands-free first.',
    body: 'Voice-forward controls, offline everything, glanceable type sized for a moving train.',
    accent: '#7C5CFF',
    filter: 'none',
  },
  {
    chip: 'AFTER HOURS',
    time: '23:47',
    title: 'The interface dims itself.',
    body: 'Warm blacks, slower motion, the Mood Engine winds you down instead of winding you up.',
    accent: '#FFB224',
    filter: 'sepia(0.4) hue-rotate(-12deg) brightness(0.78) saturate(1.35)',
  },
]

/** Home §4 — GSAP-pinned adaptive UI story (desktop); sticky phone + stacked cards (mobile) */
export default function AdaptiveStory() {
  const wrapRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const ctx = CONTEXTS[active]

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px)', () => {
        const st = ScrollTrigger.create({
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=220%',
          pin: pinRef.current,
          onUpdate: (self) => {
            if (fillRef.current) fillRef.current.style.width = `${self.progress * 100}%`
            const idx = Math.min(CONTEXTS.length - 1, Math.floor(self.progress * CONTEXTS.length))
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

  const chipRow = (c: (typeof CONTEXTS)[number]) => (
    <div className="flex items-center gap-3">
      <span
        className="rounded-lg border px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em]"
        style={{ borderColor: `${c.accent}55`, color: c.accent }}
      >
        {c.chip}
      </span>
      <span className="font-mono text-[0.8125rem] tracking-[0.04em] text-smoke font-tabular">{c.time}</span>
    </div>
  )

  return (
    <section ref={wrapRef} className="relative">
      {/* Desktop: pinned 55/45 split */}
      <div ref={pinRef} className="hidden min-h-[100dvh] items-center overflow-hidden lg:flex">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-16 px-6 lg:grid-cols-[55%_45%] lg:px-12">
          <div>
            <SectionHeader eyebrow="SYS.02 // ADAPTIVE" title={['ONE LIBRARY.', 'EVERY MOMENT.']} accentWords={['EVERY']} />
            {/* progress rail */}
            <div className="relative mt-12 h-[3px] w-full max-w-sm rounded-full bg-line">
              <div ref={fillRef} className="absolute inset-y-0 left-0 w-0 rounded-full bg-aurora" />
              {CONTEXTS.map((c, i) => (
                <span
                  key={c.chip}
                  className={cn(
                    'absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-abyss transition-colors duration-300',
                    i <= active && 'border-transparent bg-aurora',
                  )}
                  style={{ left: `${(i / (CONTEXTS.length - 1)) * 100}%` }}
                />
              ))}
            </div>
            {/* contexts crossfade stack */}
            <div className="relative mt-10 h-56">
              {CONTEXTS.map((c, i) => (
                <div
                  key={c.chip}
                  className={cn(
                    'absolute inset-0 transition-all duration-[400ms]',
                    i === active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
                  )}
                >
                  {chipRow(c)}
                  <h3 className="mt-5 font-display text-2xl font-normal text-ghost">{c.title}</h3>
                  <p className="mt-3 max-w-[46ch] leading-[1.7] text-mist">{c.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* phone */}
          <div className="relative flex justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 transition-all duration-700"
              style={{ background: `radial-gradient(ellipse 60% 50% at 50% 45%, ${ctx.accent}26, transparent 65%)` }}
            />
            <motion.div
              initial={{ y: 120, rotate: 6, opacity: 0 }}
              whileInView={{ y: 0, rotate: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-30%' }}
              transition={{ duration: 1, ease: EASE_OUT_EXPO }}
              className="relative"
            >
              <div className="relative p-5">
                <HudFrame />
                <span className="absolute -top-2 left-8 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">
                  ADAPTIVE UI // LIVE
                </span>
                <img
                  src="/assets/app-player.png"
                  alt="manosli+ player interface adapting to the current context"
                  className="h-[62vh] w-auto rounded-[2rem] border border-line object-cover shadow-card-lift transition-all duration-700"
                  style={{ filter: ctx.filter, transform: `rotate(${active % 2 === 0 ? -2 : 2}deg)` }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile: sticky phone + stacked context cards */}
      <div className="px-6 py-24 lg:hidden">
        <SectionHeader eyebrow="SYS.02 // ADAPTIVE" title={['ONE LIBRARY.', 'EVERY MOMENT.']} accentWords={['EVERY']} />
        <div className="sticky top-[88px] z-10 mt-10 flex justify-center">
          <img
            src="/assets/app-player.png"
            alt=""
            className="h-[46vh] w-auto rounded-[2rem] border border-line object-cover shadow-card-lift transition-[filter] duration-700"
            style={{ filter: ctx.filter }}
          />
        </div>
        <div className="mt-8 space-y-6">
          {CONTEXTS.map((c, i) => (
            <motion.div
              key={c.chip}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30%' }}
              onViewportEnter={() => {
                activeRef.current = i
                setActive(i)
              }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              className="glass glass-sheen rounded-2xl p-6"
            >
              {chipRow(c)}
              <h3 className="mt-4 font-display text-xl font-normal text-ghost">{c.title}</h3>
              <p className="mt-3 text-sm leading-[1.7] text-mist">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
