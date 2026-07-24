import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Flame, Heart, Moon } from 'lucide-react'
import { EASE_OUT_EXPO } from '@/lib/motion'

const HEADLINE: { t: string; g?: boolean }[][] = [
  [{ t: 'BRING' }, { t: 'YOUR' }, { t: 'PEOPLE.' }],
  [{ t: "WE'LL" }, { t: 'KEEP' }, { t: 'THE' }, { t: 'BEAT.', g: true }],
]

const AMBIENT = [
  { Icon: Heart, color: 'text-beat', left: '18%', delay: 0 },
  { Icon: Flame, color: 'text-spark', left: '50%', delay: 2.4 },
  { Icon: Moon, color: 'text-pulse', left: '80%', delay: 4.8 },
]

/** Social §8 — CTA band over magenta-tinted mesh aurora */
export default function SocialCta() {
  return (
    <section className="relative overflow-hidden py-32">
      {/* magenta-tinted mesh aurora */}
      <div aria-hidden="true" className="absolute inset-0">
        <img src="/assets/mesh-aurora.png" alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-beat/15" />
        <div className="absolute inset-0 bg-gradient-to-b from-void via-transparent to-void" />
      </div>

      {/* ambient floating reactions */}
      {AMBIENT.map(({ Icon, color, left, delay }, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          className={`absolute bottom-0 ${color} opacity-0`}
          style={{ left }}
          animate={{ y: [0, -420], opacity: [0, 0.7, 0.7, 0] }}
          transition={{ duration: 7, delay, repeat: Infinity, ease: 'easeOut' }}
        >
          <Icon className="h-7 w-7 fill-current" />
        </motion.div>
      ))}

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 text-center lg:px-12">
        <h2 className="font-display text-[clamp(2.2rem,6vw,5rem)] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-ghost">
          {HEADLINE.map((line, li) => (
            <span key={li} className="block">
              {line.map((word, wi) => (
                <span key={wi} className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
                  <motion.span
                    className={word.g ? 'inline-block bg-[linear-gradient(120deg,#FF3D8A,#FFB224)] bg-clip-text text-transparent' : 'inline-block'}
                    initial={{ y: '110%', opacity: 0 }}
                    whileInView={{ y: '0%', opacity: 1 }}
                    viewport={{ once: true, margin: '-22%' }}
                    transition={{ duration: 0.8, delay: (li * 4 + wi) * 0.06, ease: EASE_OUT_EXPO }}
                  >
                    {word.t}
                    {wi < line.length - 1 ? '\u00A0' : ''}
                  </motion.span>
                </span>
              ))}
            </span>
          ))}
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            to="/download"
            className="group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-aurora px-8 font-sans text-sm font-bold text-void transition-all duration-300 hover:scale-[1.03] hover:shadow-glow-beat active:scale-[0.97]"
          >
            <span className="relative z-10">Get early access</span>
            <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform [transition-duration:600ms] group-hover:translate-x-[340px]" />
          </Link>
          <Link
            to="/spatial"
            className="group inline-flex items-center gap-2 font-sans text-sm font-medium text-mist transition-colors duration-300 hover:text-ghost"
          >
            Step into spatial
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
