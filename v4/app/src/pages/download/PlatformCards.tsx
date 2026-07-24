import { useState } from 'react'
import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { Apple, Bot, Glasses, Globe } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import Modal from './Modal'
import { EASE_OUT_EXPO } from '@/lib/motion'

interface Platform {
  name: string
  Icon: ComponentType<{ className?: string }>
  stack: string
  req: string
  size: string
  cta: string
  action: 'store' | 'web'
}

const PLATFORMS: Platform[] = [
  { name: 'iOS', Icon: Apple, stack: 'SwiftUI native', req: 'iOS 17+', size: '38 MB', cta: 'App Store', action: 'store' },
  { name: 'ANDROID', Icon: Bot, stack: 'Jetpack Compose', req: 'Android 12+', size: '41 MB', cta: 'Google Play', action: 'store' },
  { name: 'WEB', Icon: Globe, stack: 'React + WASM', req: 'Any modern browser', size: '0 MB — streams', cta: 'Launch web player', action: 'web' },
  { name: 'AR / VR', Icon: Glasses, stack: 'Glasses + headsets', req: 'Major runtimes', size: '212 MB', cta: 'Get the immersive build', action: 'store' },
]

const CHANGELOG = [
  '4.2.0 — handoff 2× faster across every surface',
  '4.2.0 — Night Arc visuals rebuilt on the spectrum engine',
  '4.2.0 — battery draw −11% on watch + buds',
  '4.2.0 — room queue voting lands in webhooks',
  '4.2.0 — zero tracking. as always. verified again.',
]

/** Download §2 — one pillar card per platform */
export default function PlatformCards() {
  const [webOpen, setWebOpen] = useState(false)
  const [changelogFor, setChangelogFor] = useState<string | null>(null)

  return (
    <section id="platforms" className="py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.01 // PLATFORMS"
          title={['EVERY SURFACE.', 'ONE DOWNLOAD EACH.']}
          accentWords={['DOWNLOAD']}
          accentDot="bg-spark"
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ y: 56, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-12%' }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: EASE_OUT_EXPO }}
              className="glass glass-sheen group flex flex-col rounded-2xl p-7 transition-all duration-[450ms] hover:-translate-y-1.5 hover:border-pulse/60 hover:shadow-card-lift"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.22em] text-smoke">0{i + 1}</span>
                <p.Icon className="h-6 w-6 text-mist transition-colors duration-300 group-hover:text-ghost" />
              </div>
              <h3 className="mt-6 font-display text-xl font-normal text-ghost">{p.name}</h3>
              <p className="mt-2 text-sm text-mist">{p.stack}</p>
              <p className="font-mono text-[0.72rem] tracking-[0.04em] text-smoke">{p.req}</p>

              <div className="mt-5 flex items-center gap-2.5">
                <span className="rounded-lg border border-line px-2.5 py-0.5 font-mono text-[0.65rem] font-bold tracking-[0.12em] text-mist">
                  v4.2.0
                </span>
                <span className="font-mono text-[0.72rem] tabular-nums tracking-[0.04em] text-smoke">{p.size}</span>
              </div>
              <button
                type="button"
                onClick={() => setChangelogFor(p.name)}
                className="mt-2 w-fit font-mono text-[0.72rem] tracking-[0.04em] text-smoke underline decoration-line underline-offset-4 transition-colors duration-300 hover:text-wave"
              >
                changelog
              </button>

              {/* ghost button → primary fill on card hover */}
              <button
                type="button"
                onClick={() => p.action === 'web' && setWebOpen(true)}
                className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 font-sans text-sm font-bold text-ghost transition-all duration-300 group-hover:border-transparent group-hover:bg-aurora group-hover:text-void"
              >
                <p.Icon className="h-4 w-4" />
                {p.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <Modal open={webOpen} onClose={() => setWebOpen(false)} title="Web player">
        <p className="leading-[1.65] text-mist">The web player is a demo here — imagine it glorious.</p>
        <p className="mt-4 font-mono text-[0.72rem] tracking-[0.04em] text-smoke">REACT + WASM · RUNS ANYWHERE WITH A TAB</p>
      </Modal>

      <Modal open={changelogFor !== null} onClose={() => setChangelogFor(null)} title={`Changelog — ${changelogFor ?? ''}`}>
        <ul className="space-y-2.5">
          {CHANGELOG.map((line) => (
            <li key={line} className="font-mono text-[0.78rem] leading-[1.6] tracking-[0.02em] text-mist">
              <span className="mr-2 text-wave">+</span>
              {line}
            </li>
          ))}
        </ul>
      </Modal>
    </section>
  )
}
