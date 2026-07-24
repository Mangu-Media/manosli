import { useState } from 'react'
import { motion } from 'framer-motion'
import { HardDrive, RefreshCw, Server, BrainCircuit, ListChecks, type LucideIcon } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO, EASE_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface Layer {
  icon: LucideIcon
  title: string
  body: string
  chip: string
  accent: string
}

const LAYERS: Layer[] = [
  {
    icon: HardDrive,
    title: 'ON-DEVICE VAULT',
    body: 'Play history, preferences, mood vectors, voice profiles — stored locally, AES-256-GCM, keys in the secure enclave.',
    chip: 'NEVER UPLOADED',
    accent: '#2EE6D6',
  },
  {
    icon: RefreshCw,
    title: 'E2EE CLOUD SYNC (OPTIONAL)',
    body: 'Multi-device sync, encrypted on-device before it leaves. Ciphertext at rest. Keys: yours.',
    chip: 'CIPHERTEXT ONLY',
    accent: '#7C5CFF',
  },
  {
    icon: Server,
    title: 'ZERO-KNOWLEDGE RELAYS',
    body: 'Our servers route and store encrypted blobs they cannot read. Blind by construction, not by promise.',
    chip: 'BLIND BY DESIGN',
    accent: '#7C5CFF',
  },
  {
    icon: BrainCircuit,
    title: 'FEDERATED LEARNING',
    body: 'Global models improve from encrypted gradient math with differential privacy — never from play events.',
    chip: 'MATH, NOT MUSIC',
    accent: '#2EE6D6',
  },
  {
    icon: ListChecks,
    title: 'TRANSPARENT TELEMETRY',
    body: 'Every byte we collect is listed publicly, field by field, and switchable. Off means off.',
    chip: 'YOU HOLD THE SWITCH',
    accent: '#FFB224',
  },
]

/** Privacy §2 — five layers between your life and the world */
export default function PrivacyStack() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.01 // THE STACK"
          title={['FIVE LAYERS BETWEEN', 'YOUR LIFE AND THE WORLD.']}
          accentWords={['FIVE']}
          accentDot="bg-spark"
        />

        <div className="relative mt-14" style={{ perspective: '1200px' }}>
          {/* side rail: YOU → WORLD */}
          <div className="absolute -left-2 bottom-0 top-0 hidden w-px bg-line lg:block" aria-hidden="true">
            <span className="absolute -left-[7px] -top-1 h-2.5 w-2.5 rounded-full bg-spark" />
            <span className="absolute -left-[7px] -bottom-1 h-2.5 w-2.5 rounded-full border border-smoke bg-void" />
            <span className="absolute -top-3 left-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-spark">YOU</span>
            <span className="absolute -bottom-3 left-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">WORLD</span>
          </div>

          <motion.div
            initial={{ rotateX: 6, opacity: 0 }}
            whileInView={{ rotateX: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
            className="space-y-4 lg:pl-12"
          >
            {LAYERS.map((l, i) => {
              const Icon = l.icon
              const isHover = hovered === i
              return (
                <motion.div
                  key={l.title}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -64 : 64 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-12%' }}
                  transition={{ duration: 0.8, delay: i * 0.12, ease: EASE_OUT_EXPO }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    'glass glass-sheen relative flex min-h-[88px] items-center gap-5 rounded-2xl px-6 py-4 transition-all duration-300',
                    isHover && '-translate-y-1',
                  )}
                  style={isHover ? { borderColor: `${l.accent}66`, boxShadow: `0 8px 40px ${l.accent}22` } : undefined}
                >
                  {/* hairline trace to the rail */}
                  <span
                    aria-hidden="true"
                    className="absolute -left-14 top-1/2 hidden h-px w-14 origin-left bg-wave transition-transform duration-300 lg:block"
                    style={{ transform: isHover ? 'scaleX(1)' : 'scaleX(0)' }}
                  />
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300"
                    style={{ borderColor: isHover ? `${l.accent}88` : '#241A38' }}
                  >
                    <Icon className="h-5 w-5 transition-colors duration-300" style={{ color: isHover ? l.accent : '#A79FBE' }} />
                  </span>
                  <span className="font-mono text-[0.7rem] text-smoke font-tabular">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans text-base font-bold tracking-[0.02em] text-ghost">{l.title}</h3>
                    <p className="mt-0.5 truncate text-sm text-mist sm:whitespace-normal">{l.body}</p>
                  </div>
                  {/* status chip stamps in after the layer lands */}
                  <motion.span
                    initial={{ scale: 1.4, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '-12%' }}
                    transition={{ duration: 0.3, delay: i * 0.12 + 0.55, ease: EASE_SPRING }}
                    className="hidden shrink-0 rounded-lg border px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.08em] sm:block"
                    style={{
                      borderColor: `${l.accent}70`,
                      color: l.accent,
                      boxShadow: `0 0 24px ${l.accent}18`,
                    }}
                  >
                    {l.chip}
                  </motion.span>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
