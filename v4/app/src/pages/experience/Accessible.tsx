import { motion } from 'framer-motion'
import { Hand, ToggleLeft, Type, Vibrate } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import HudFrame from '@/components/HudFrame'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface Tile {
  icon: LucideIcon
  label: string
  desc: string
  haptic?: boolean
}

const TILES: Tile[] = [
  { icon: ToggleLeft, label: 'SWITCH CONTROL', desc: 'Full navigation without touch.' },
  { icon: Vibrate, label: 'HAPTIC BEAT TRACK', desc: 'Beat-count you can feel.', haptic: true },
  { icon: Type, label: '200% DYNAMIC TYPE', desc: 'Type that scales with you.' },
  { icon: Hand, label: 'ONE-HAND REACH', desc: 'Every target in thumb range.' },
]

/** Experience §7 — Eyes-Free & Accessible */
export default function Accessible() {
  return (
    <section className="relative bg-abyss py-24 lg:py-32">
      {/* haptic vibration keyframe (hover on the haptic tile) */}
      <style>{`
        @keyframes xp-haptic { 0%,100% { transform: translateX(-1px); } 50% { transform: translateX(1px); } }
        .xp-haptic-tile:hover .xp-haptic-icon { animation: xp-haptic 0.1s linear infinite; }
      `}</style>

      <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        >
          <p className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-wave" />
            EYES-FREE &amp; ACCESSIBLE
          </p>
          <h3 className="mt-6 font-sans text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ghost">
            HANDS-FREE IS A FEATURE. SO IS EVERY OTHER WAY OF LISTENING.
          </h3>
          <p className="mt-5 max-w-[60ch] leading-[1.7] text-mist">
            Full switch control, dynamic type to 200%, haptic beat-count for deaf and hard-of-hearing listeners, and a
            one-hand mode that pulls every target into thumb reach. The adaptive UI isn&rsquo;t a theme — it&rsquo;s
            manners.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TILES.map((tile, i) => (
            <motion.div
              key={tile.label}
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE_OUT_EXPO }}
              className={cn(
                'glass glass-sheen relative rounded-xl p-5 transition-colors duration-300 hover:border-pulse/50',
                tile.haptic && 'xp-haptic-tile',
              )}
            >
              <HudFrame />
              <tile.icon className={cn('h-5 w-5 text-wave', tile.haptic && 'xp-haptic-icon')} />
              <p className="mt-4 font-mono text-[0.8125rem] font-medium tracking-[0.04em] text-ghost">{tile.label}</p>
              <p className="mt-1.5 text-sm leading-[1.6] text-mist">{tile.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
