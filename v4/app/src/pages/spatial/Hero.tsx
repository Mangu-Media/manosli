import { lazy, Suspense, useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import NoiseText from '../social/NoiseText'
import { EASE_OUT_EXPO } from '@/lib/motion'

const OrbField = lazy(() => import('./OrbField'))

const LEDE =
  'Object-based mixes place every voice and instrument in real space around you. Turn your head and the stage stays put. Put on the glasses and the music becomes architecture.'

/** Spatial §1 — page hero: orb field shell around the content */
export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const fieldInView = useInView(fieldRef, { margin: '20% 0px' })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const shellScale = useTransform(scrollYProgress, [0, 1], [1, 1.4])
  const shellOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.25])

  return (
    <section ref={ref} className="relative -mt-[76px] flex min-h-[100dvh] items-center overflow-hidden">
      {/* background: deep-field fallback + blurred orbs + R3F orb shell */}
      <motion.div ref={fieldRef} style={{ scale: shellScale, opacity: shellOpacity }} className="absolute inset-0">
        <div className="deep-field absolute inset-0" />
        <div aria-hidden="true" className="absolute left-[20%] top-[18%] h-64 w-64 animate-blob-drift rounded-full bg-wave/15 blur-[100px]" />
        <div aria-hidden="true" className="absolute bottom-[16%] right-[18%] h-72 w-72 animate-blob-drift rounded-full bg-pulse/20 blur-[110px]" style={{ animationDelay: '-8s' }} />
        <div aria-hidden="true" className="absolute left-[55%] top-[55%] h-40 w-40 animate-blob-drift rounded-full bg-spark/10 blur-[90px]" style={{ animationDelay: '-4s' }} />
        {fieldInView && (
          <Suspense fallback={null}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }} className="absolute inset-0">
              <OrbField />
            </motion.div>
          </Suspense>
        )}
      </motion.div>

      {/* content */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 pt-[76px] text-center lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-wave" />
          Spatial audio &amp; AR
        </motion.p>

        <h1 className="mt-8 font-display text-[clamp(2.5rem,6vw,5.25rem)] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-ghost">
          <NoiseText text="SOUND HAS" baseDelay={0.2} className="block" />
          <NoiseText
            text="A PLACE."
            baseDelay={0.5}
            className="block bg-[linear-gradient(120deg,#2EE6D6,#7C5CFF)] bg-clip-text text-transparent"
          />
        </h1>

        <p className="mx-auto mt-8 max-w-[58ch] text-lg leading-[1.7] text-mist">
          {LEDE.split(' ').map((word, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 + i * 0.02, ease: EASE_OUT_EXPO }}
            >
              {word}
              {'\u00A0'}
            </motion.span>
          ))}
        </p>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-void" />
    </section>
  )
}
