import { motion } from 'framer-motion'
import CountUp from '@/components/CountUp'
import HudFrame from '@/components/HudFrame'
import { EASE_OUT_EXPO } from '@/lib/motion'

const SPECS = [
  { label: 'OBJECTS MAX', desc: 'Discrete sources placed per mix.', count: { to: 64 } },
  { label: 'PIPELINE', desc: 'Hi-res spatial bus end to end.', text: '48–96KHZ' },
  { label: 'MOTION-TO-SOUND', desc: 'Head moves, the field follows.', count: { to: 10, prefix: '<', suffix: 'MS' } },
  { label: 'ENVIRONMENTS', desc: 'Walk around inside the mix.', count: { to: 6, suffix: 'DoF' } },
  { label: 'PERSONALIZATION', desc: 'From a 30-second ear scan.', text: 'HRTF' },
  { label: 'MOMENTS CLIPS', desc: '15-second clips, mix intact.', text: 'SPATIAL' },
]

/** Spatial §6 — the Spatial Spec: mono spec strip of 6 HUD cards */
export default function SpecStrip() {
  return (
    <section className="border-y border-line bg-abyss py-24">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-wave" />
          SYS.05 // SPEC
        </motion.p>

        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
          {SPECS.map((spec, i) => (
            <motion.div
              key={spec.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12%' }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_OUT_EXPO }}
              className="relative min-w-[190px] shrink-0 snap-start rounded-xl border border-line bg-void/60 p-5 lg:min-w-0"
            >
              <HudFrame />
              <p className="font-mono text-[clamp(1.6rem,2.4vw,2.2rem)] font-bold leading-none tracking-[-0.03em] text-ghost">
                {spec.count ? (
                  <CountUp to={spec.count.to} prefix={spec.count.prefix ?? ''} suffix={spec.count.suffix ?? ''} duration={1.4} />
                ) : (
                  spec.text
                )}
              </p>
              <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-wave">{spec.label}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-smoke">{spec.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
