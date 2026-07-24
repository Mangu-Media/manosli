import { memo } from 'react'
import { cn } from '@/lib/utils'

/** Expanding sonar rings, 3× staggered on a 3s loop (design.md §7.4). Place inside a relative parent. */
function SonarRipple({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 animate-sonar rounded-full border border-pulse"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </span>
  )
}

export default memo(SonarRipple)
