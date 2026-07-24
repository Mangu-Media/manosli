import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Logo from './Logo'
import { EASE_IN_OUT_QUART } from '@/lib/motion'

const GLYPHS = '█▓▒<>/\\+—·01'
const WORD = 'manosli+'

function useScramble(active: boolean) {
  const [display, setDisplay] = useState(WORD.replace(/./g, '▒'))
  useEffect(() => {
    if (!active) return
    let tick = 0
    const id = window.setInterval(() => {
      tick += 1
      const resolved = Math.floor(tick / 2)
      if (resolved >= WORD.length) {
        setDisplay(WORD)
        window.clearInterval(id)
        return
      }
      let out = WORD.slice(0, resolved)
      for (let i = resolved; i < WORD.length; i++) {
        out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      setDisplay(out)
    }, 40)
    return () => window.clearInterval(id)
  }, [active])
  return display
}

/**
 * First-visit preloader (home §0): spectrum bars + noise-reveal wordmark,
 * counter 000→100, then splits into 5 vertical bars that lift away.
 */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'run' | 'exit' | 'done'>(() =>
    sessionStorage.getItem('manosli-preloader') ? 'done' : 'run',
  )
  const [count, setCount] = useState(0)
  const display = useScramble(phase === 'run')
  const finishRef = useRef<() => void>(() => {})
  finishRef.current = () => {
    sessionStorage.setItem('manosli-preloader', '1')
    setPhase((p) => (p === 'run' ? 'exit' : p))
    onDone()
  }

  useEffect(() => {
    if (phase === 'done') {
      onDone()
      return
    }
    // eased counter 0→100 over ~1.4s
    const start = performance.now()
    const id = window.setInterval(() => {
      const elapsed = performance.now() - start
      setCount((c) => {
        const next = c + (100 - c) * 0.06 + Math.random() * 2.2
        return Math.min(100, Math.round(next))
      })
      if (elapsed > 1500) {
        window.clearInterval(id)
        setCount(100)
        finishRef.current()
      }
    }, 30)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === 'exit') {
      const t = window.setTimeout(() => setPhase('done'), 1000)
      return () => window.clearTimeout(t)
    }
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      className="fixed inset-0 z-[200]"
      role="button"
      aria-label="Skip intro"
      tabIndex={0}
      onClick={() => finishRef.current()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && finishRef.current()}
    >
      {/* 5 void panels that scaleY 1→0 upward on exit */}
      <div className="absolute inset-0 flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="h-full flex-1 bg-void"
            style={{ transformOrigin: 'top' }}
            initial={{ scaleY: 1 }}
            animate={{ scaleY: phase === 'exit' ? 0 : 1 }}
            transition={{ duration: 0.5, delay: phase === 'exit' ? i * 0.05 : 0, ease: EASE_IN_OUT_QUART }}
          />
        ))}
      </div>

      <motion.div
        className="relative flex h-full flex-col items-center justify-center"
        animate={{ opacity: phase === 'run' ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex h-10 items-end gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-2 origin-bottom animate-eq-bar rounded-full bg-spectrum"
              style={{ height: '100%', animationDelay: `${i * 0.08}s`, animationDuration: '0.9s' }}
            />
          ))}
        </div>
        <div className="mt-6 flex items-baseline">
          {display === WORD ? (
            <span className="flex items-center gap-2.5">
              <Logo />
            </span>
          ) : (
            <span className="font-mono text-xl text-ghost">
              {display.slice(0, 7)}
              <span className="text-spark">{display.slice(7)}</span>
            </span>
          )}
        </div>
        <div className="pointer-events-none absolute bottom-8 left-8 font-mono text-sm text-smoke font-tabular">
          {String(count).padStart(3, '0')}%
        </div>
        <div className="pointer-events-none absolute bottom-8 right-8 font-mono text-xs uppercase tracking-[0.22em] text-smoke">
          Calibrating spatial engine
        </div>
      </motion.div>
    </div>
  )
}
