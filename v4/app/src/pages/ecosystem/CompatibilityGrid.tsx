import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { Apple, Bot, Car, Glasses, Globe, Headset, Monitor, Watch } from 'lucide-react'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface Platform {
  name: string
  Icon: ComponentType<{ className?: string }>
  status: 'NATIVE' | 'WASM'
}

const PLATFORMS: Platform[] = [
  { name: 'iOS', Icon: Apple, status: 'NATIVE' },
  { name: 'ANDROID', Icon: Bot, status: 'NATIVE' },
  { name: 'WEB', Icon: Globe, status: 'WASM' },
  { name: 'WATCHOS', Icon: Watch, status: 'NATIVE' },
  { name: 'AR GLASSES', Icon: Glasses, status: 'NATIVE' },
  { name: 'VR HEADSETS', Icon: Headset, status: 'NATIVE' },
  { name: 'DESKTOP', Icon: Monitor, status: 'WASM' },
  { name: 'AUTOMOTIVE', Icon: Car, status: 'NATIVE' },
]

/** Ecosystem §6 — compatibility grid: if it has a speaker, we ship for it */
export default function CompatibilityGrid() {
  return (
    <section className="py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-18%' }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-pulse" />
          SYS.05 // PLATFORMS
        </motion.p>
        <motion.h3
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-18%' }}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT_EXPO }}
          className="mt-6 max-w-[24ch] font-sans text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ghost"
        >
          If it has a speaker, we probably ship for it.
        </motion.h3>

        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: EASE_OUT_EXPO }}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-panel/40 px-4 py-8 transition-colors duration-300 hover:border-pulse/70"
            >
              <p.Icon className="h-7 w-7 text-mist transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-ghost" />
              <p className="font-mono text-xs font-medium tracking-[0.16em] text-ghost">{p.name}</p>
              <span
                className={cn(
                  'rounded-lg border px-2.5 py-0.5 font-mono text-[0.62rem] font-bold tracking-[0.14em]',
                  p.status === 'NATIVE' ? 'border-wave/40 text-wave/90' : 'border-pulse/40 text-pulse/90',
                )}
              >
                {p.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
