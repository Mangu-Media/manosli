import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const GLYPHS = '█▓▒░ABDEFHKMNPRSTUVXZ0123456789+/<>'

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
}

interface NoiseLineProps {
  text: string
  /** start revealing */
  active: boolean
  /** ms before first char begins */
  delay?: number
  /** ms stagger per character (design: 40ms) */
  charMs?: number
  className?: string
  /** applied to each character once resolved (e.g. text-aurora) */
  resolvedClassName?: string
}

/**
 * NoiseLine — one line of the Noise Text Reveal (design.md §7.8): characters
 * scramble through mono glyphs then snap to the display font. Whitespace passes
 * straight through so wrapping never shifts mid-reveal.
 */
export function NoiseLine({ text, active, delay = 0, charMs = 40, className, resolvedClassName }: NoiseLineProps) {
  const [resolvedCount, setResolvedCount] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    const start = performance.now() + delay
    const step = (now: number) => {
      const elapsed = now - start
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(step)
        return
      }
      const count = Math.min(text.length, Math.floor(elapsed / charMs) + 1)
      setResolvedCount(count)
      if (count < text.length) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, text, delay, charMs])

  if (!active) {
    // reserve layout space before the reveal starts
    return (
      <span className={cn('inline-block opacity-0', className)} aria-label={text}>
        {text}
      </span>
    )
  }

  return (
    <span className={cn('inline-block', className)} aria-label={text}>
      {text.split('').map((ch, i) => {
        const resolved = i < resolvedCount
        if (ch === ' ') return <span key={i}>&nbsp;</span>
        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn('inline-block', resolved ? resolvedClassName : 'font-mono text-mist')}
          >
            {resolved ? ch : randomGlyph()}
          </span>
        )
      })}
    </span>
  )
}
