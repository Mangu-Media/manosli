import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

const GLYPHS = '█▓▒░ABC0123456789#$%&/<>*+'

interface NoiseTextProps {
  text: string
  /** ms between each character resolving (design: 40 hero / 55 privacy) */
  charDelay?: number
  /** ms before the reveal starts */
  startDelay?: number
  /** class applied to resolved characters */
  charClassName?: string
  /** once fully resolved, swap to a single span with this class/style (for whole-word gradients) */
  finalClassName?: string
  finalStyle?: CSSProperties
  className?: string
}

/**
 * Noise Text Reveal (design.md §7.8) — characters resolve from scrambled glyphs
 * to final letters; mono font during scramble, snaps back on resolve.
 */
export default function NoiseText({
  text,
  charDelay = 40,
  startDelay = 0,
  charClassName,
  finalClassName,
  finalStyle,
  className,
}: NoiseTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const [resolved, setResolved] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!inView) return
    const interval = setInterval(() => setTick((t) => t + 1), 55)
    const timeouts: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i <= text.length; i++) {
      timeouts.push(setTimeout(() => setResolved(i), startDelay + i * charDelay))
    }
    timeouts.push(setTimeout(() => clearInterval(interval), startDelay + text.length * charDelay + 120))
    return () => {
      clearInterval(interval)
      timeouts.forEach(clearTimeout)
    }
  }, [inView, text, charDelay, startDelay])

  // deterministic pseudo-random glyph per (index, tick) so scramble feels alive but stable
  const glyph = (i: number) => GLYPHS[(i * 31 + tick * 17 + text.length * 7) % GLYPHS.length]

  const fullyResolved = resolved >= text.length
  return (
    <span ref={ref} className={cn('inline-block', className)} aria-label={text}>
      {fullyResolved && (finalClassName || finalStyle) ? (
        <span aria-hidden="true" className={finalClassName} style={finalStyle}>
          {text}
        </span>
      ) : (
        text.split('').map((ch, i) => {
          const done = i < resolved
          return (
            <span
              key={i}
              aria-hidden="true"
              className={cn('inline-block', done ? charClassName : 'font-mono opacity-70')}
            >
              {done ? (ch === ' ' ? ' ' : ch) : ch === ' ' ? ' ' : glyph(i)}
            </span>
          )
        })
      )}
    </span>
  )
}
