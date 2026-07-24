import { cn } from '@/lib/utils'

/** Corners-only HUD frame: 4 × 16px L-strokes (design.md §7.5). Place inside a relative parent. */
export default function HudFrame({ className }: { className?: string }) {
  const base = 'absolute h-4 w-4 border-line'
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)}>
      <span className={cn(base, 'left-0 top-0 border-l-[1.5px] border-t-[1.5px]')} />
      <span className={cn(base, 'right-0 top-0 border-r-[1.5px] border-t-[1.5px]')} />
      <span className={cn(base, 'bottom-0 left-0 border-b-[1.5px] border-l-[1.5px]')} />
      <span className={cn(base, 'bottom-0 right-0 border-b-[1.5px] border-r-[1.5px]')} />
    </div>
  )
}
