import { useEffect, useRef, useState } from 'react'

const GLYPHS = '█▓▒░ABDEFHKMNPRSTUVXZ0123456789+/<>'

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
}

/**
 * useScrambledText — returns a display string that resolves from random glyphs
 * to `target` left→right. Re-runs whenever `target` changes (30ms/char default).
 * Used for mono timestamps, mood-vector readouts and re-score counters.
 */
export function useScrambledText(target: string, active = true, charMs = 30) {
  const [display, setDisplay] = useState(target)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const tick = (now: number) => {
      const resolved = Math.floor((now - start) / charMs)
      if (resolved >= target.length) {
        setDisplay(target)
        return
      }
      let out = ''
      for (let i = 0; i < target.length; i++) {
        const ch = target[i]
        if (i < resolved || ch === ' ' || ch === ':' || ch === '.' || ch === '=' || ch === '+' || ch === '-' || ch === '/') {
          out += ch
        } else {
          out += randomGlyph()
        }
      }
      setDisplay(out)
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, active, charMs])

  return active ? display : target
}
