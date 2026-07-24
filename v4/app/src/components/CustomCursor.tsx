import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/** Spark-amber dot + lagging pulse-violet ring; desktop (pointer:fine) only (design.md §6) */
export default function CustomCursor() {
  const [enabled] = useState(
    () =>
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [hovering, setHovering] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  // ring follows with ~0.15 lerp lag via spring
  const ringX = useSpring(x, { stiffness: 380, damping: 38, mass: 0.7 })
  const ringY = useSpring(y, { stiffness: 380, damping: 38, mass: 0.7 })

  useEffect(() => {
    if (!enabled) return
    document.body.classList.add('cursor-custom')
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      setHovering(!!t?.closest('a, button, [role="button"], input, textarea, [data-cursor]'))
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('mouseover', over, { passive: true })
    return () => {
      document.body.classList.remove('cursor-custom')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('mouseover', over)
    }
  }, [enabled, x, y])

  if (!enabled) return null
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[110] h-2 w-2 rounded-full bg-spark"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: hovering ? 0.4 : 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[110] h-9 w-9 rounded-full border-[1.5px] border-pulse/40"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          mixBlendMode: hovering ? 'difference' : 'normal',
        }}
        animate={{ scale: hovering ? 56 / 36 : 1 }}
        transition={{ duration: 0.25 }}
      />
    </>
  )
}
