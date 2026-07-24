import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import SectionHeader from '@/components/SectionHeader'
import HudFrame from '@/components/HudFrame'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Mode = 'ribbons' | 'grid' | 'nebula'

const MODES: { key: Mode; label: string; anchors: number }[] = [
  { key: 'ribbons', label: 'AURORA RIBBONS', anchors: 14 },
  { key: 'grid', label: 'PULSE GRID', anchors: 22 },
  { key: 'nebula', label: 'NEBULA', anchors: 9 },
]

const GLYPHS = '█▓▒ABCDEHKNPRSTUXZ014+'

/** HUD caption scrambles to new text on mode switch */
function Scramble({ text }: { text: string }) {
  const [out, setOut] = useState(text)
  useEffect(() => {
    let frame = 0
    const id = setInterval(() => {
      frame += 1
      const n = Math.floor(frame * 1.4)
      setOut(
        text
          .split('')
          .map((c, i) => (c === ' ' || i < n ? c : GLYPHS[(i * 7 + frame) % GLYPHS.length]))
          .join(''),
      )
      if (n >= text.length) clearInterval(id)
    }, 28)
    return () => clearInterval(id)
  }, [text])
  return <>{out}</>
}

/** overlay layers — swapped per mode, never the base image */
function Ribbons() {
  return (
    <>
      <div className="spx-ribbon-a absolute left-[8%] top-[30%] h-24 w-[80%] rounded-full bg-gradient-to-r from-wave/40 via-pulse/30 to-transparent blur-xl" />
      <div className="spx-ribbon-b absolute left-[16%] top-[48%] h-16 w-[70%] rounded-full bg-gradient-to-r from-pulse/40 via-beat/25 to-transparent blur-lg" />
      <div className="spx-ribbon-a absolute left-[4%] top-[62%] h-12 w-[60%] rounded-full bg-gradient-to-r from-wave/30 to-transparent blur-md" style={{ animationDelay: '-4s' }} />
    </>
  )
}

function PulseGrid() {
  return (
    <>
      <div
        className="absolute inset-x-0 bottom-0 h-[55%]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(46,230,214,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(46,230,214,0.25) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          transform: 'perspective(420px) rotateX(56deg)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, black 55%, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black 55%, transparent)',
        }}
      />
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="spx-ring-out absolute bottom-[18%] left-1/2 h-24 w-24 rounded-full border border-wave/70"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </>
  )
}

function Nebula() {
  const blooms = [
    { l: '18%', t: '26%', s: 130, c: 'bg-pulse/45', d: 0 },
    { l: '62%', t: '20%', s: 100, c: 'bg-wave/40', d: -3 },
    { l: '40%', t: '52%', s: 160, c: 'bg-beat/35', d: -6 },
    { l: '74%', t: '58%', s: 90, c: 'bg-pulse/40', d: -9 },
    { l: '28%', t: '68%', s: 80, c: 'bg-wave/35', d: -4.5 },
    { l: '52%', t: '36%', s: 60, c: 'bg-spark/30', d: -7.5 },
  ]
  return (
    <>
      {blooms.map((b, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn('spx-bloom absolute rounded-full blur-2xl', b.c)}
          style={{ left: b.l, top: b.t, width: b.s, height: b.s, animationDelay: `${b.d}s` }}
        />
      ))}
    </>
  )
}

/** Spatial §3 — See Your Music: AR viewport with switchable overlay modes */
export default function ArVisual() {
  const [mode, setMode] = useState<Mode>('ribbons')
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(mx, { stiffness: 120, damping: 18 })
  const py = useSpring(my, { stiffness: 120, damping: 18 })
  const active = MODES.find((m) => m.key === mode)!

  return (
    <section className="border-y border-line bg-abyss py-28">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.02 // AR VISUALIZATION"
          title={['THE ROOM BECOMES', 'THE INSTRUMENT.']}
          accentWords={['INSTRUMENT']}
          accentDot="bg-wave"
          align="center"
        />

        <motion.div
          initial={{ clipPath: 'inset(8% 8% 8% 8%)', opacity: 0.6 }}
          whileInView={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
          viewport={{ once: true, margin: '-18%' }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          className="relative mx-auto mt-14 aspect-[16/10] max-w-5xl overflow-hidden rounded-2xl border border-line"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            mx.set(((e.clientX - r.left) / r.width - 0.5) * 20)
            my.set(((e.clientY - r.top) / r.height - 0.5) * 20)
          }}
          onPointerLeave={() => {
            mx.set(0)
            my.set(0)
          }}
        >
          {/* base image — never swapped */}
          <img
            src="/assets/glasses-ar.png"
            alt="First-person AR view: music visualizations floating above a living-room table"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* overlay layer with glasses-POV parallax */}
          <motion.div style={{ x: px, y: py }} className="absolute -inset-4" aria-hidden="true">
            <AnimatePresence>
              <motion.div
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {mode === 'ribbons' && <Ribbons />}
                {mode === 'grid' && <PulseGrid />}
                {mode === 'nebula' && <Nebula />}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* scanline sweep on switch */}
          <div key={`scan-${mode}`} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[4%] overflow-hidden">
            <div className="spx-scan h-full w-full bg-gradient-to-b from-transparent via-wave/40 to-transparent" />
          </div>

          {/* HUD caption chip */}
          <div className="absolute left-4 top-4 rounded-lg border border-wave/40 bg-void/70 px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.08em] text-wave backdrop-blur-sm">
            <Scramble text={`${active.label} · SPATIAL ANCHORS: ${active.anchors}`} />
          </div>
          <HudFrame className="m-4" />
        </motion.div>

        {/* mode switcher */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {MODES.map((m, i) => (
            <motion.button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: EASE_OUT_EXPO }}
              className={cn(
                'rounded-lg border px-4 py-2 font-mono text-xs tracking-[0.1em] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse',
                mode === m.key
                  ? 'border-wave/70 bg-wave/10 text-wave shadow-glow-wave'
                  : 'border-line text-mist hover:border-wave/40 hover:text-ghost',
              )}
            >
              {m.label}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
