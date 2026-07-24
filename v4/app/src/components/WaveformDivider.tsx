import { useMemo, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Full-width SVG polyline (120 points) that draws itself on scroll,
 * with a 60px aurora segment traveling along it (design.md §7.3).
 */
export default function WaveformDivider({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 45%'] })
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1])

  const d = useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i <= 120; i++) {
      const x = (i / 120) * 1200
      const y = 30 + Math.sin(i * 0.32) * 10 * Math.sin(i * 0.045) + Math.sin(i * 0.11) * 6
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    }
    return pts.join(' ')
  }, [])

  return (
    <div ref={ref} aria-hidden="true" className={cn('overflow-hidden', className)}>
      <svg viewBox="0 0 1200 60" className="h-[60px] w-full" fill="none" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wf-aurora" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7C5CFF" />
            <stop offset="0.32" stopColor="#B14BFF" />
            <stop offset="0.68" stopColor="#FF3D8A" />
            <stop offset="1" stopColor="#FFB224" />
          </linearGradient>
        </defs>
        <motion.path d={d} stroke="#241A38" strokeWidth="1.5" style={{ pathLength }} />
        <path
          d={d}
          stroke="url(#wf-aurora)"
          strokeWidth="1.5"
          pathLength={100}
          strokeDasharray="5 95"
          className="wf-travel"
        />
      </svg>
    </div>
  )
}
