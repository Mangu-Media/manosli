import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const ENVS = [
  {
    img: '/assets/vr-observatory.png',
    name: 'THE OBSERVATORY',
    body: 'A glass dome above the treeline. Your library hangs as constellations you can reach for.',
    specs: ['6DoF', 'HAND TRACKING', 'UP TO 4 GUESTS'],
  },
  {
    img: '/assets/vr-cathedral.png',
    name: 'NEON CATHEDRAL',
    body: 'A nave of light that breathes with the low end. Stages host live spatial broadcasts here.',
    specs: ['LIVE EVENTS', '96KHZ SPATIAL BUS'],
  },
  {
    img: '/assets/vr-deepfield.png',
    name: 'DEEP FIELD',
    body: 'No floor, no walls. Just you, the mix, and a slow galaxy of sound. The best sleep story we make.',
    specs: ['ZERO-G DRIFT', 'SLEEP ARC COMPATIBLE'],
  },
]

function EnvCard({
  env,
  index,
  progress,
  reduced,
}: {
  env: (typeof ENVS)[number]
  index: number
  progress: MotionValue<number>
  reduced: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-7%', '7%'])
  const scale = useTransform(progress, [index / ENVS.length, (index + 1) / ENVS.length], [1, 0.94])

  return (
    <div ref={ref} className={cn(!reduced && 'sticky top-24')} style={{ zIndex: index }}>
      <motion.div
        style={reduced ? undefined : { scale }}
        className="group relative h-[70vh] origin-top overflow-hidden rounded-3xl border border-line"
      >
        {/* parallax image */}
        <motion.img
          src={env.img}
          alt={`${env.name} VR environment`}
          style={{ y: imgY }}
          className="absolute inset-0 h-[114%] w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/25 to-void/30" />
        {/* wave vignette deepens on hover */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{ background: 'radial-gradient(ellipse 90% 80% at 50% 100%, rgba(46,230,214,0.18), transparent 65%)' }}
        />

        {/* copy */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <p className="font-mono text-xs tracking-[0.22em] text-wave">ENV.0{index + 1}</p>
          <h3 className="mt-3 font-display text-[clamp(1.6rem,3.4vw,2.8rem)] font-bold uppercase tracking-[-0.015em] text-ghost">
            {env.name.split(' ').map((word, wi) => (
              <span key={wi} className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: '110%', opacity: 0 }}
                  whileInView={{ y: '0%', opacity: 1 }}
                  viewport={{ once: true, margin: '-20%' }}
                  transition={{ duration: 0.7, delay: wi * 0.06, ease: EASE_OUT_EXPO }}
                >
                  {word}
                  {wi < env.name.split(' ').length - 1 ? '\u00A0' : ''}
                </motion.span>
              </span>
            ))}
          </h3>
          <p className="mt-3 max-w-[52ch] leading-[1.65] text-mist">{env.body}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {env.specs.map((spec, si) => (
              <motion.span
                key={spec}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-15%' }}
                transition={{ duration: 0.5, delay: 0.2 + si * 0.07, ease: EASE_OUT_EXPO }}
                className="rounded-lg border border-wave/50 bg-void/50 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-wave backdrop-blur-sm"
              >
                {spec}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>
      {/* spacer so the next card slides over */}
      {index < ENVS.length - 1 && <div className="h-10" />}
    </div>
  )
}

/** Spatial §4 — Spatial Computing Environments: sticky-stacked card deck */
export default function Environments() {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })

  return (
    <section className="py-28">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.03 // ENVIRONMENTS"
          title={['GO SOMEWHERE', 'AND LISTEN.']}
          accentWords={['SOMEWHERE']}
          accentDot="bg-wave"
        />
        <div ref={containerRef} className="relative mt-14">
          {ENVS.map((env, i) => (
            <EnvCard key={env.name} env={env} index={i} progress={scrollYProgress} reduced={!!reduced} />
          ))}
        </div>
      </div>
    </section>
  )
}
