import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EASE_IN_OUT_QUART } from '@/lib/motion'

/**
 * Branded "equalizer wipe" route transition (design.md §6):
 * 5 aurora bars cover the new page, then scaleY 1→0 toward the top with stagger.
 * Keyed by pathname so the wipe replays on every navigation — no state needed.
 */
export default function PageWipe() {
  const { pathname } = useLocation()

  return (
    <div key={pathname} className="pointer-events-none fixed inset-0 z-[96] flex" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="h-full flex-1 bg-aurora"
          style={{ filter: `hue-rotate(${i * 10}deg)` }}
          initial={{ scaleY: 1, transformOrigin: 'top' }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.5, delay: 0.05 + i * 0.045, ease: EASE_IN_OUT_QUART }}
        />
      ))}
    </div>
  )
}
