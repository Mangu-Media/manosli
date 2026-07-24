import { cn } from '@/lib/utils'

/** 4-bar equalizer glyph, bars at 40/85/60/100% with aurora gradient (design.md §2) */
export function EqGlyph({ className, animated = true }: { className?: string; animated?: boolean }) {
  const bars = [40, 85, 60, 100]
  return (
    <svg viewBox="0 0 44 40" className={cn('h-7 w-8 shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient id="eq-aurora" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7C5CFF" />
          <stop offset="0.32" stopColor="#B14BFF" />
          <stop offset="0.68" stopColor="#FF3D8A" />
          <stop offset="1" stopColor="#FFB224" />
        </linearGradient>
      </defs>
      {bars.map((h, i) => {
        const height = (h / 100) * 36
        return (
          <rect
            key={i}
            x={2 + i * 11}
            y={38 - height}
            width="7"
            height={height}
            rx="2"
            fill="url(#eq-aurora)"
            className={animated ? 'animate-eq-bar' : undefined}
            style={
              animated
                ? {
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '1.8s',
                    transformBox: 'fill-box',
                    transformOrigin: '50% 100%',
                  }
                : undefined
            }
          />
        )
      })}
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-sans text-xl font-bold tracking-tight text-ghost', className)}>
      manosli
      <span className="inline-block animate-spark-pulse text-spark">+</span>
    </span>
  )
}

export default function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <EqGlyph />
      <Wordmark />
    </span>
  )
}
