import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

const GLYPHS = '█▓▒░ABCDEFXZ0147#/%+'

interface NoiseTextProps {
  text: string
  className?: string
  /** seconds before the reveal starts once in view */
  baseDelay?: number
  /** seconds per character (design.md §7.8 — 40ms/char) */
  charDelay?: number
}

/**
 * Noise Text Reveal (design.md §7.8): characters resolve from scrambled
 * glyphs to final letters, mono font during scramble, snap on resolve.
 */
export default function NoiseText({ text, className, baseDelay = 0, charDelay = 0.04 }: NoiseTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-12% 0px' })
  const [resolved, setResolved] = useState(0)
  const [tick, setTick] = useState(0)

  // advance the resolve pointer with rAF so timing stays smooth
  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now() + baseDelay * 1000
    const step = (now: number) => {
      const t = (now - start) / 1000
      const n = Math.max(0, Math.ceil(t / charDelay))
      setResolved(Math.min(n, text.length))
      if (n < text.length) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, text, baseDelay, charDelay])

  // re-randomize unresolved glyphs on a fixed cadence
  useEffect(() => {
    if (!inView || resolved >= text.length) return
    const id = window.setInterval(() => setTick((t) => t + 1), 45)
    return () => window.clearInterval(id)
  }, [inView, resolved, text.length])

  return (
    <span ref={ref} className={cn('inline-block', className)} aria-label={text} role="text">
      {text.split('').map((ch, i) => {
        if (ch === ' ') return <span key={i}>&nbsp;</span>
        const done = i < resolved
        const glyph = done ? ch : GLYPHS[(i * 31 + tick * 7) % GLYPHS.length]
        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn('inline-block', done ? 'font-display' : 'font-mono text-mist')}
          >
            {glyph}
          </span>
        )
      })}
    </span>
  )
}
