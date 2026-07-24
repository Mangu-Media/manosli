import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_OUT_EXPO } from '@/lib/motion'

interface SectionHeaderProps {
  eyebrow: string
  title: string[]
  /** words (punctuation stripped) to render in aurora gradient */
  accentWords?: string[]
  lede?: string
  align?: 'left' | 'center'
  accentDot?: string
  className?: string
}

/** Section scaffold: eyebrow + pulsing dot, H2 word-reveal, optional lede (design.md §8.6) */
export default function SectionHeader({
  eyebrow,
  title,
  accentWords = [],
  lede,
  align = 'left',
  accentDot = 'bg-pulse',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(align === 'center' && 'text-center', className)}>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20%' }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className={cn(
          'flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke',
          align === 'center' && 'justify-center',
        )}
      >
        <span className={cn('h-2 w-2 animate-dot-pulse rounded-full', accentDot)} />
        {eyebrow}
      </motion.p>
      <h2 className="mt-6 font-display text-[clamp(1.9rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.05] tracking-[-0.015em] text-ghost">
        {title.map((line, li) => {
          const words = line.split(' ')
          return (
            <span key={li} className="block">
              {words.map((word, wi) => (
                <span key={wi} className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
                  <motion.span
                    className={cn('inline-block', accentWords.includes(word.replace(/[.,]/g, '')) && 'text-aurora')}
                    initial={{ y: '110%', opacity: 0 }}
                    whileInView={{ y: '0%', opacity: 1 }}
                    viewport={{ once: true, margin: '-22%' }}
                    transition={{ duration: 0.8, delay: (li * 4 + wi) * 0.05, ease: EASE_OUT_EXPO }}
                  >
                    {word}
                    {wi < words.length - 1 ? ' ' : ''}
                  </motion.span>
                </span>
              ))}
            </span>
          )
        })}
      </h2>
      {lede && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT_EXPO }}
          className={cn('mt-6 max-w-[60ch] text-lg leading-[1.7] text-mist', align === 'center' && 'mx-auto')}
        >
          {lede}
        </motion.p>
      )}
    </div>
  )
}
