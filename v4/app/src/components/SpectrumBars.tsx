import { memo } from 'react'
import { cn } from '@/lib/utils'

interface SpectrumBarsProps {
  bars?: number
  className?: string
  barClassName?: string
  /** false = paused, settled to low idle */
  playing?: boolean
  duration?: number
}

/** Div-based equalizer bars with spectrum gradient (design.md §7.2) */
function SpectrumBars({ bars = 5, className, barClassName, playing = true, duration = 0.9 }: SpectrumBarsProps) {
  return (
    <div className={cn('flex items-end gap-[3px]', className)} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn('w-[3px] origin-bottom animate-eq-bar rounded-full bg-spectrum', barClassName)}
          style={{
            height: '100%',
            animationDelay: `${(i % 7) * 0.08}s`,
            animationDuration: `${duration + (i % 5) * 0.07}s`,
            animationPlayState: playing ? 'running' : 'paused',
            transform: playing ? undefined : 'scaleY(0.25)',
          }}
        />
      ))}
    </div>
  )
}

export default memo(SpectrumBars)
