import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const GLYPHS = '█▓▒ABCDEFGHKMNPQRSTUVXYZ014789+'

/**
 * Noise Text Reveal (design.md §7.8) — characters resolve from scrambled
 * glyphs to final letters, ~40ms/char stagger; mono font during scramble,
 * snaps to display font on resolve.
 */
export default function NoiseText({
  text,
  active = true,
  baseDelay = 0,
  className,
}: {
  text: string
  active?: boolean
  baseDelay?: number
  className?: string
}) {
  const [resolved, setResolved] = useState(0)
  const [tick, setTick] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!active || started.current) return
    started.current = true
    let raf = 0
    const t0 = performance.now() + baseDelay * 1000
    const step = (now: number) => {
      const elapsed = now - t0
      if (elapsed >= 0) {
        const n = Math.floor(elapsed / 40)
        setResolved(Math.min(n, text.length))
        setTick((t) => (t + 1) % 7)
      }
      if (now - t0 < text.length * 40 + 400) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [active, baseDelay, text.length])

  return (
    <span className={cn('inline-block', className)} aria-label={text} role="text">
      {text.split('').map((ch, i) => {
        if (ch === ' ') return <span key={i}>&nbsp;</span>
        const done = i < resolved
        const glyph = done ? ch : GLYPHS[(i * 13 + tick * 5 + text.length) % GLYPHS.length]
        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn('inline-block', done ? 'font-display' : 'font-mono opacity-70')}
          >
            {glyph}
          </span>
        )
      })}
    </span>
  )
}
