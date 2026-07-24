import { cn } from '@/lib/utils'

/** Infinite horizontal marquee ticker, mono uppercase items separated by amber + (design.md §7.7) */
export default function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span className="font-mono text-sm font-medium uppercase tracking-[0.18em] text-mist">{item}</span>
          <span className="mx-8 font-mono text-sm font-bold text-spark">+</span>
        </span>
      ))}
    </div>
  )
  return (
    <div className={cn('group overflow-hidden border-y border-line bg-abyss/60 py-6', className)}>
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
