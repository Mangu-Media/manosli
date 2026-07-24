import { motion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

function RevealChars({ text, gradient = false, charOffset = 0 }: { text: string; gradient?: boolean; charOffset?: number }) {
  return (
    <span className={cn('block', gradient && 'animate-hue-shift')}>
      {text.split('').map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
          <motion.span
            className={cn('inline-block will-change-transform', gradient && 'text-aurora')}
            initial={{ y: '115%', opacity: 0 }}
            whileInView={{ y: '0%', opacity: 1 }}
            viewport={{ once: true, margin: '-25%' }}
            transition={{ duration: 0.9, delay: (charOffset + i) * 0.024, ease: EASE_OUT_EXPO }}
          >
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** Download §8 — closing statement over drifting aurora blobs */
export default function Closing() {
  return (
    <section className="relative flex min-h-[70dvh] items-center justify-center overflow-hidden border-t border-line">
      <div className="deep-field absolute inset-0" aria-hidden="true" />
      <div aria-hidden="true" className="absolute left-[18%] top-[22%] h-80 w-80 animate-blob-drift rounded-full bg-pulse/25 blur-[120px]" />
      <div aria-hidden="true" className="absolute bottom-[18%] right-[16%] h-72 w-72 animate-blob-drift rounded-full bg-beat/15 blur-[120px]" style={{ animationDelay: '-9s' }} />
      <div aria-hidden="true" className="absolute left-[45%] top-[55%] h-64 w-64 animate-blob-drift rounded-full bg-wave/10 blur-[110px]" style={{ animationDelay: '-4s' }} />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 text-center lg:px-12">
        <h2 className="font-display text-[clamp(2.5rem,6vw,5.25rem)] font-bold uppercase leading-[1.0] tracking-[-0.02em] text-ghost">
          <RevealChars text="THE FUTURE OF MUSIC" />
          <RevealChars text="IS ALREADY MIXED." gradient charOffset={19} />
        </h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-25%' }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-8 font-mono text-[0.8125rem] tracking-[0.22em] text-smoke"
        >
          SEE YOU IN WAVE 04
        </motion.p>
      </div>
    </section>
  )
}
