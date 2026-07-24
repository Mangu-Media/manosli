import { memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { EASE_OUT_EXPO } from '@/lib/motion'

/** orbit ring motif reprise — 3 slow rings */
const SlowRings = memo(function SlowRings() {
  return (
    <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {[420, 640, 860].map((size, i) => (
        <motion.div
          key={size}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line/70"
          style={{ width: `min(96vw, ${size}px)`, height: `min(96vw, ${size}px)` }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 50 + i * 15, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  )
})

const TITLE = ['ONE SESSION.', 'EVERY SURFACE YOU OWN.']

/** Ecosystem §7 — CTA band with orbit reprise + device family backdrop */
export default function CtaBand() {
  return (
    <section className="relative overflow-hidden border-t border-line py-36">
      <div className="deep-field absolute inset-0" aria-hidden="true" />
      <SlowRings />
      {/* device family at 20%, right-aligned, violet mask */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] md:block">
        <img
          src="/assets/device-family.png"
          alt=""
          className="h-full w-full object-contain object-right opacity-20 [mask-image:linear-gradient(to_left,black_30%,transparent_85%)]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-pulse/10 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-12">
        <h2 className="font-display text-[clamp(1.9rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.05] tracking-[-0.015em] text-ghost">
          {TITLE.map((line, li) => (
            <span key={li} className="block">
              {line.split(' ').map((word, wi) => (
                <span key={wi} className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
                  <motion.span
                    className="inline-block"
                    initial={{ y: '110%', opacity: 0 }}
                    whileInView={{ y: '0%', opacity: 1 }}
                    viewport={{ once: true, margin: '-22%' }}
                    transition={{ duration: 0.8, delay: (li * 4 + wi) * 0.05, ease: EASE_OUT_EXPO }}
                  >
                    {word}
                    {wi < line.split(' ').length - 1 ? ' ' : ''}
                  </motion.span>
                </span>
              ))}
            </span>
          ))}
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE_OUT_EXPO }}
          className="mt-10 flex flex-wrap items-center gap-6"
        >
          <Link
            to="/download"
            className="group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-aurora px-8 font-sans text-sm font-bold text-void transition-all duration-300 hover:scale-[1.03] hover:shadow-glow-pulse active:scale-[0.97]"
          >
            <span className="relative z-10">Get early access</span>
            <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform duration-[600ms] group-hover:translate-x-[340px]" />
          </Link>
          <Link
            to="/technology"
            className="group inline-flex items-center gap-1.5 font-sans text-sm font-medium text-mist transition-colors duration-300 hover:text-ghost"
          >
            How sync stays under 40ms
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
