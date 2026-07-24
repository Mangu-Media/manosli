import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO, EASE_SPRING } from '@/lib/motion'
import { showToast } from '@/pages/technology/toast'
import { cn } from '@/lib/utils'

/* ---------- Toggle (design.md §8.5: 44×24 pill, 18px knob, wave on) ---------- */
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
        on ? 'bg-wave shadow-glow-wave' : 'bg-line',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <motion.span
        className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-ghost"
        initial={false}
        animate={{ x: on ? 22 : 3, scale: [1, 1.15, 1] }}
        transition={{ duration: 0.35, ease: EASE_SPRING }}
      />
    </button>
  )
}

/* ---------- wire line: types in (10ms/char); OFF → strike + fade (0.4s) → collapse ---------- */
function WireLine({ text, off }: { text: string; off: boolean }) {
  const [n, setN] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (off) {
      const t = setTimeout(() => setCollapsed(true), 400)
      return () => clearTimeout(t)
    }
    setCollapsed(false)
    setN(0)
    const iv = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(iv)
          return v
        }
        return v + 1
      })
    }, 10)
    return () => clearInterval(iv)
  }, [text, off])

  return (
    <motion.p
      initial={false}
      animate={{
        opacity: off ? 0.25 : 1,
        height: collapsed ? 0 : 'auto',
        marginBottom: collapsed ? 0 : 8,
      }}
      transition={{ duration: 0.4 }}
      className={cn(
        'overflow-hidden break-all font-mono text-[0.75rem] leading-[1.5] tracking-[0.02em]',
        off ? 'text-smoke line-through' : 'text-mist',
      )}
    >
      {off ? text : text.slice(0, n)}
      {!off && n < text.length && <span className="animate-caret-blink text-wave">▌</span>}
    </motion.p>
  )
}

/* ---------- data ---------- */
interface SwitchSpec {
  id: string
  label: string
  desc: string
  defaultOn: boolean
  locked?: boolean
  events: string[]
}

const SWITCHES: SwitchSpec[] = [
  {
    id: 'crash',
    label: 'CRASH REPORTS',
    desc: 'Stack traces, device class, build number. Nothing about content.',
    defaultOn: true,
    events: ['{"event":"crash","build":"4.2.0","device_class":"phone_arm64"}'],
  },
  {
    id: 'perf',
    label: 'PERFORMANCE METRICS',
    desc: 'Frame times, decode latency, battery draw. Aggregated, anonymous.',
    defaultOn: true,
    events: [
      '{"event":"perf.decode","p50_ms":88,"build":"4.2.0"}',
      '{"event":"perf.frame","p99_ms":11,"battery_ma":41}',
    ],
  },
  {
    id: 'funnels',
    label: 'USAGE FUNNELS',
    desc: 'Which screens get used. Never what you played on them.',
    defaultOn: false,
    events: ['{"event":"funnel.screen_view","screen":"library"}'],
  },
  {
    id: 'ads',
    label: 'PERSONALIZED ADS',
    desc: "We don't have an ads business. This switch controls nothing, and it stays.",
    defaultOn: false,
    locked: true,
    events: [],
  },
]

/** Privacy §3 — flip the switches, watch the wire */
export default function TelemetryToggles() {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SWITCHES.map((s) => [s.id, s.defaultOn])),
  )
  const [refused, setRefused] = useState(false)
  const [wiggle, setWiggle] = useState(0)
  const interacted = useRef(false)

  const flip = (s: SwitchSpec) => {
    if (s.locked) {
      setWiggle((w) => w + 1)
      setRefused(true)
      return
    }
    const next = !state[s.id]
    setState((prev) => ({ ...prev, [s.id]: next }))
    if (!interacted.current) {
      interacted.current = true
      if (!next) showToast(`${s.label.charAt(0) + s.label.slice(1).toLowerCase()} off. Off means off.`, '#FFB224')
      else showToast(`${s.label.charAt(0) + s.label.slice(1).toLowerCase()} on. Listed, field by field.`, '#2EE6D6')
    }
  }

  return (
    <section className="relative bg-abyss py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.02 // PROOF"
          title={['FLIP THE SWITCHES.', 'WATCH THE WIRE.']}
          accentWords={['SWITCHES']}
          accentDot="bg-spark"
          lede="This console shows exactly what would leave your device in the current configuration. Try it."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[45%_55%]">
          {/* toggle panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="glass glass-sheen rounded-3xl p-6 lg:p-8"
          >
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">TELEMETRY CONSOLE</p>
            <div className="mt-6 space-y-6">
              {SWITCHES.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-15%' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE_OUT_EXPO }}
                  className="flex items-start justify-between gap-6"
                >
                  <div>
                    <p className={cn('flex items-center gap-2 font-mono text-sm tracking-[0.04em]', s.locked ? 'text-smoke' : 'text-ghost')}>
                      {s.label}
                      {s.locked && <Lock className="h-3.5 w-3.5" />}
                    </p>
                    <p className="mt-1 max-w-[42ch] text-sm leading-[1.6] text-mist">{s.desc}</p>
                    {s.locked && refused && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 font-mono text-[0.65rem] tracking-[0.08em] text-spark"
                      >
                        HARD-CODED OFF. NO ADS BUSINESS EXISTS TO FEED.
                      </motion.p>
                    )}
                  </div>
                  <motion.span
                    key={wiggle}
                    animate={s.locked && wiggle > 0 ? { rotate: [0, -2, 2, -2, 0] } : {}}
                    transition={{ duration: 0.2 }}
                    className="mt-1 inline-block"
                  >
                    <Toggle on={state[s.id]} onChange={() => flip(s)} disabled={s.locked} />
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* the wire */}
          <motion.div
            initial={{ opacity: 0, x: 64 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className="glass glass-sheen flex flex-col rounded-3xl p-6 lg:p-8"
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2.5 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">
                <span className="h-2 w-2 animate-dot-pulse rounded-full bg-wave" />
                OUTBOUND — LIVE VIEW
              </p>
              <span className="font-mono text-[0.65rem] tracking-[0.08em] text-smoke">TLS 1.3</span>
            </div>

            <div className="mt-5 min-h-[220px] flex-1 rounded-xl border border-line/60 bg-void/50 p-4">
              <AnimatePresence initial={false}>
                {SWITCHES.flatMap((s) =>
                  s.events.map((e) => (
                    <WireLine key={e} text={e} off={!state[s.id]} />
                  )),
                )}
              </AnimatePresence>
              {SWITCHES.every((s) => !state[s.id] || s.events.length === 0) && (
                <p className="font-mono text-[0.75rem] text-smoke">// wire is silent. nothing is leaving.</p>
              )}
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <p className="font-mono text-[0.8125rem] tracking-[0.06em] text-spark">
                FIELDS CONTAINING YOUR LISTENING: <span className="font-tabular font-bold">0</span>
              </p>
              <p className="mt-1 font-mono text-[0.65rem] tracking-[0.06em] text-smoke">
                ALWAYS 0. INDEPENDENT OF SWITCH STATE.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
