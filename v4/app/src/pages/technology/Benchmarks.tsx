import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface Bench {
  label: string
  ours: number
  legacy: number
  unit: string
  decimals: number
  oursText: string
  legacyText: string
}

const BENCHES: Bench[] = [
  { label: 'Cold start to first sound', ours: 0.4, legacy: 2.8, unit: 's', decimals: 1, oursText: '0.4s', legacyText: '2.8s' },
  { label: 'Seek + decode', ours: 88, legacy: 640, unit: 'ms', decimals: 0, oursText: '88ms', legacyText: '640ms' },
  { label: 'Queue reorder (10k tracks)', ours: 3, legacy: 210, unit: 'ms', decimals: 0, oursText: '3ms', legacyText: '210ms' },
  { label: 'Sync merge conflict', ours: 1.2, legacy: 95, unit: 'ms', decimals: 1, oursText: '1.2ms', legacyText: '95ms' },
]

const CHIPS = ['ZERO-COPY BUFFERS', 'NO GC PAUSES', 'ONE CODEBASE']

/** mono count-up synced to the bar sweep */
function BenchValue({ bench, go, delay }: { bench: Bench; go: boolean; delay: number }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => `${v.toFixed(bench.decimals)}${bench.unit}`)
  useEffect(() => {
    if (!go) return
    const c = animate(mv, bench.ours, { duration: 1.1, delay, ease: EASE_OUT_EXPO })
    return () => c.stop()
  }, [go, mv, bench, delay])
  return <motion.span className="font-tabular">{text}</motion.span>
}

/** Technology §3 — Rust + WASM benchmark panel vs legacy stack */
export default function Benchmarks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-25% 0px' })
  const [tip, setTip] = useState<number | null>(null)

  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-6 lg:grid-cols-[40%_60%] lg:px-12">
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
            SYS.02 // CORE
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-6 font-display text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ghost"
          >
            THE HOT PATH IS RUST.
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.6, delay: 0.16, ease: EASE_OUT_EXPO }}
            className="mt-5 max-w-[52ch] leading-[1.7] text-mist"
          >
            Decode, DSP, gapless, sync merge — the entire hot path compiles to native on mobile and WebAssembly on the
            web. Same code, same behavior, no JavaScript in the signal chain.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.6, delay: 0.26, ease: EASE_OUT_EXPO }}
            className="mt-7 flex flex-wrap gap-2"
          >
            {CHIPS.map((c) => (
              <span
                key={c}
                className="rounded-lg border border-wave/40 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-wave/90"
              >
                {c}
              </span>
            ))}
          </motion.div>
        </div>

        {/* benchmark panel */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="glass glass-sheen relative rounded-3xl p-6 lg:p-8"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">BENCH // MANOSLI+ VS LEGACY STACK</p>
            <span className="hidden font-mono text-[0.65rem] tracking-[0.04em] text-smoke sm:block">LOWER IS FASTER</span>
          </div>

          <div className="mt-6 space-y-7">
            {BENCHES.map((b, i) => {
              const ratio = Math.max(0.02, b.ours / b.legacy)
              return (
                <div
                  key={b.label}
                  className="group relative"
                  onMouseEnter={() => setTip(i)}
                  onMouseLeave={() => setTip(null)}
                >
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono text-[0.8125rem] tracking-[0.04em] text-mist">{b.label}</p>
                    <p className="font-mono text-sm font-bold text-wave">
                      <BenchValue bench={b} go={inView} delay={i * 0.12} />
                    </p>
                  </div>
                  {/* manosli+ bar */}
                  <div className="mt-2 h-[10px] w-full overflow-hidden rounded-full bg-line/40">
                    <motion.div
                      className="h-full origin-left rounded-full"
                      style={{ backgroundImage: 'linear-gradient(90deg, #2EE6D6, #7C5CFF)', width: `${ratio * 100}%` }}
                      initial={{ scaleX: 0 }}
                      animate={inView ? { scaleX: 1 } : {}}
                      transition={{ duration: 1.1, delay: i * 0.12, ease: EASE_OUT_EXPO }}
                    />
                  </div>
                  {/* legacy baseline — slides after, the gap is the punchline */}
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="h-[6px] w-full overflow-hidden rounded-full bg-transparent">
                      <motion.div
                        className="h-full origin-left rounded-full bg-smoke/30"
                        initial={{ scaleX: 0 }}
                        animate={inView ? { scaleX: 1 } : {}}
                        transition={{ duration: 1.1, delay: 0.3 + i * 0.12, ease: EASE_OUT_EXPO }}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-[0.7rem] text-smoke font-tabular">
                      {b.legacyText}
                    </span>
                  </div>
                  {/* hover tooltip */}
                  <div
                    className={cn(
                      'pointer-events-none absolute -top-7 right-0 rounded-md border border-line bg-abyss px-2 py-1 font-mono text-[0.6rem] tracking-[0.08em] text-smoke transition-opacity duration-200',
                      tip === i ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    MEASURED ON MID-TIER HARDWARE · P50
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex items-center gap-5 border-t border-line pt-4 font-mono text-[0.65rem] tracking-[0.08em] text-smoke">
            <span className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-full" style={{ backgroundImage: 'linear-gradient(90deg,#2EE6D6,#7C5CFF)' }} />
              MANOSLI+
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-4 rounded-full bg-smoke/30" />
              LEGACY STACK
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
