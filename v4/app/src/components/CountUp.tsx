import { useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

interface CountUpProps {
  to: number
  from?: number
  duration?: number
  prefix?: string
  suffix?: string
  pad?: number
  className?: string
}

/** Mono count-up triggered on first entry into view; tabular-nums (design.md §4) */
export default function CountUp({ to, from = 0, duration = 1.6, prefix = '', suffix = '', pad = 0, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const mv = useMotionValue(from)
  const text = useTransform(mv, (v) => `${prefix}${String(Math.round(v)).padStart(pad, '0')}${suffix}`)

  useEffect(() => {
    if (!inView) return
    const controls = animate(mv, to, { duration, ease: EASE_OUT_EXPO })
    return () => controls.stop()
  }, [inView, mv, to, duration])

  return (
    <span ref={ref} className={className}>
      <motion.span className="font-tabular">{text}</motion.span>
    </span>
  )
}
