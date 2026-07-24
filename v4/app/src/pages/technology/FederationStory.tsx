import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion, useReducedMotion } from 'framer-motion'
import { Smartphone, Watch, Laptop, Tablet, Lock, X } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const STEPS = [
  {
    chip: 'STEP 01',
    title: 'TRAIN WHERE THE DATA LIVES',
    body: 'Every night, on your charger, your device fine-tunes a small model on your listening. The raw data never moves — it was never going to.',
  },
  {
    chip: 'STEP 02',
    title: 'ONLY GRADIENTS LEAVE',
    body: "What's uploaded is a tensor of weight deltas — math about the model, not about you. Play events, titles, timestamps: none of it is in there. It can't be.",
  },
  {
    chip: 'STEP 03',
    title: 'ENCRYPTED AGGREGATION',
    body: 'Updates combine inside a secure enclave with differential privacy noise (ε=2.1). No single update is ever visible to us — including to us.',
  },
  {
    chip: 'STEP 04',
    title: 'THE GLOBAL MODEL COMES HOME',
    body: 'The improved global model ships back to every device. Your recommendations get smarter because the network learned — not because anyone watched.',
  },
]

const DEVICES = [
  { icon: Smartphone, x: 8 },
  { icon: Watch, x: 27 },
  { icon: Laptop, x: 46 },
  { icon: Smartphone, x: 65 },
  { icon: Tablet, x: 84 },
]

/* dashed paths device → cloud (viewBox 0 0 100 100, preserveAspectRatio="none" ⇒ % coords) */
const PATHS = DEVICES.map((d, i) => ({
  id: `fed-path-${i}`,
  d: `M ${d.x + 4} 74 C ${d.x + 4} 52, 50 44, 50 26`,
}))

/** The federated-learning diagram (shared by desktop pin + mobile sticky) */
function FederationDiagram({ step }: { step: number }) {
  const reduced = useReducedMotion()
  return (
    <div className="relative aspect-[5/4] w-full max-w-[560px]">
      <style>{`
        @keyframes fed-flash { 0%,100% { box-shadow: 0 0 0 rgba(46,230,214,0); } 50% { box-shadow: 0 0 32px rgba(46,230,214,0.55); } }
        @keyframes fed-bar { 0%,100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
      `}</style>

      {/* dashed ascent paths */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {PATHS.map((p) => (
          <path
            key={p.id}
            id={p.id}
            d={p.d}
            fill="none"
            stroke={step >= 1 ? 'rgba(124,92,255,0.5)' : 'rgba(255,255,255,0.12)'}
            strokeWidth="0.35"
            strokeDasharray="1.6 1.8"
            style={{ transition: 'stroke 0.5s' }}
          />
        ))}
        {/* ∇w gradient packets ascend (steps 2 & 3) */}
        {!reduced && (step === 1 || step === 2) &&
          PATHS.map((p, i) => (
            <circle key={`up-${p.id}`} r="1.1" fill="#7C5CFF">
              <animateMotion dur="1.8s" begin={`${i * 0.36}s`} repeatCount="indefinite">
                <mpath href={`#${p.id}`} />
              </animateMotion>
            </circle>
          ))}
        {/* improved model rains back down (step 4) */}
        {!reduced && step === 3 &&
          PATHS.map((p, i) => (
            <circle key={`down-${p.id}`} r="1.2" fill="#2EE6D6">
              <animateMotion
                dur="1.6s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
                keyPoints="1;0"
                keyTimes="0;1"
                calcMode="linear"
              >
                <mpath href={`#${p.id}`} />
              </animateMotion>
            </circle>
          ))}
      </svg>

      {/* shielded cloud node */}
      <div
        className={cn(
          'absolute left-1/2 top-[8%] flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full border bg-panel/80 backdrop-blur-sm transition-all duration-700',
          step >= 2 ? 'border-wave/70 shadow-glow-wave' : 'border-line',
        )}
        style={step === 3 ? { animation: 'fed-flash 2s ease-in-out infinite' } : undefined}
      >
        <Lock
          className={cn('h-7 w-7 transition-all duration-700', step >= 2 ? 'rotate-90 text-wave' : 'text-mist')}
        />
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-[0.18em] text-smoke">
          secure enclave
        </span>
        {step >= 1 && step <= 2 && (
          <span className="absolute -right-2 -top-1 rounded-md border border-pulse/60 bg-void px-1.5 py-0.5 font-mono text-[0.6rem] text-pulse">
            ∇w
          </span>
        )}
      </div>

      {/* devices */}
      {DEVICES.map((d, i) => {
        const Icon = d.icon
        const training = step === 0
        const updated = step === 3
        return (
          <div
            key={i}
            className={cn(
              'absolute flex h-16 w-14 flex-col items-center justify-center rounded-xl border bg-panel/80 backdrop-blur-sm transition-all duration-500',
              training && 'border-wave/60 shadow-glow-wave',
              updated && 'border-wave/60',
              !training && !updated && 'border-line',
            )}
            style={{
              left: `${d.x}%`,
              top: '70%',
              animation: updated ? 'fed-flash 2s ease-in-out infinite' : undefined,
            }}
          >
            <Icon className={cn('h-5 w-5', training || updated ? 'text-wave' : 'text-mist')} />
            {/* mini training bars */}
            <span className="mt-1.5 flex h-3 items-end gap-[3px]">
              {[0, 1, 2].map((b) => (
                <span
                  key={b}
                  className={cn('w-[3px] origin-bottom rounded-sm', training ? 'bg-wave' : 'bg-line')}
                  style={
                    training
                      ? { height: '100%', animation: `fed-bar ${0.9 + b * 0.2}s ease-in-out ${b * 0.15}s infinite` }
                      : { height: '30%' }
                  }
                />
              ))}
            </span>
            {/* raw data stays put — red ✗ marks (step 2) */}
            {step === 1 && (
              <span className="absolute -right-3 -top-3 flex flex-col gap-1">
                {['history', 'titles'].map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 rounded border border-beat/50 bg-void px-1 py-0.5 font-mono text-[0.5rem] tracking-[0.04em] text-beat"
                  >
                    <X className="h-2 w-2" />
                    {t}
                  </span>
                ))}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Technology §5 — pinned 4-step federated learning story (240vh) */
export default function FederationStory() {
  const wrapRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px)', () => {
        const st = ScrollTrigger.create({
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=240%',
          pin: pinRef.current,
          scrub: 0.6,
          onUpdate: (self) => {
            if (fillRef.current) fillRef.current.style.width = `${self.progress * 100}%`
            const idx = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))
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
      {/* ---------- desktop: pinned stage ---------- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-30%' }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      >
        <div ref={pinRef} className="hidden min-h-[100dvh] items-center overflow-hidden lg:flex">
          <div className="mx-auto grid w-full max-w-[1440px] items-center gap-16 px-6 lg:grid-cols-2 lg:px-12">
            <div>
              <SectionHeader
                eyebrow="SYS.FL // FEDERATED LEARNING"
                title={['THE MODEL LEARNS.', 'YOU STAY PRIVATE.']}
                accentWords={['PRIVATE']}
                accentDot="bg-pulse"
              />
              {/* progress rail */}
              <div className="relative mt-12 h-[3px] w-full max-w-sm rounded-full bg-line">
                <div ref={fillRef} className="absolute inset-y-0 left-0 w-0 rounded-full bg-aurora" />
                {STEPS.map((s, i) => (
                  <span
                    key={s.chip}
                    className={cn(
                      'absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-abyss transition-colors duration-300',
                      i <= active && 'border-transparent bg-aurora',
                    )}
                    style={{ left: `${(i / (STEPS.length - 1)) * 100}%` }}
                  />
                ))}
              </div>
              {/* step copy crossfade */}
              <div className="relative mt-10 h-56">
                {STEPS.map((s, i) => (
                  <div
                    key={s.chip}
                    className={cn(
                      'absolute inset-0 transition-all duration-[400ms]',
                      i === active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
                    )}
                  >
                    <span className="rounded-lg border border-pulse/50 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-pulse">
                      {s.chip}
                    </span>
                    <h3 className="mt-5 font-sans text-2xl font-bold text-ghost">{s.title}</h3>
                    <p className="mt-3 max-w-[48ch] leading-[1.7] text-mist">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex flex-col items-center">
              <FederationDiagram step={active} />
            </div>
          </div>
          {/* persistent proof caption */}
          <p className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-lg border border-spark/40 bg-void/70 px-4 py-2 font-mono text-[0.75rem] tracking-[0.08em] text-spark backdrop-blur-sm">
            RAW DATA PACKETS SENT: 0
          </p>
        </div>
      </motion.div>

      {/* ---------- mobile: sticky diagram + stacked steps ---------- */}
      <div className="px-6 py-24 lg:hidden">
        <SectionHeader
          eyebrow="SYS.FL // FEDERATED LEARNING"
          title={['THE MODEL LEARNS.', 'YOU STAY PRIVATE.']}
          accentWords={['PRIVATE']}
          accentDot="bg-pulse"
        />
        <div className="sticky top-[88px] z-10 mt-10 flex justify-center rounded-2xl bg-void/80 py-4 backdrop-blur-sm">
          <FederationDiagram step={active} />
        </div>
        <div className="mt-8 space-y-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.chip}
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
              <span className="rounded-lg border border-pulse/50 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-pulse">
                {s.chip}
              </span>
              <h3 className="mt-4 font-sans text-xl font-bold text-ghost">{s.title}</h3>
              <p className="mt-3 text-sm leading-[1.7] text-mist">{s.body}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-8 text-center font-mono text-[0.75rem] tracking-[0.08em] text-spark">
          RAW DATA PACKETS SENT: 0
        </p>
      </div>
    </section>
  )
}
