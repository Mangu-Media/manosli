import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Share2 } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import SpectrumBars from '@/components/SpectrumBars'
import { useToast } from './Toast'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const MOMENTS = [
  { album: '/assets/album-03.png', caption: 'NIGHT DRIVE · 2:14 AM · 6 LISTENERS' },
  { album: '/assets/album-05.png', caption: 'SUNDAY SLOWDOWN · 9:02 AM · 3 LISTENERS' },
  { album: '/assets/album-06.png', caption: 'FOCUS COHORT 7 · 4:45 PM · 11 LISTENERS' },
  { album: '/assets/album-08.png', caption: 'GOLDEN HOUR · 7:31 PM · 4 LISTENERS' },
]

/** Social §7 — Moments: horizontal scroll-snap cards with fake 15s playback */
export default function Moments() {
  const [playing, setPlaying] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const { show, host } = useToast()

  const play = (i: number) => {
    setPlaying(i)
    show('Moments are simulated here.')
  }

  return (
    <section className="py-28">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.06 // MOMENTS"
          title={['FIFTEEN SECONDS,', 'PERFECTLY FRAMED.']}
          accentWords={['FRAMED']}
          accentDot="bg-beat"
          lede="Clip the best 15 seconds of any track with its room context — who was there, what the mood ring looked like. Moments play inside the card, spatial mix intact."
        />
      </div>

      <div className="mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 lg:px-[max(3rem,calc((100vw-1440px)/2+3rem))]">
        {MOMENTS.map((m, i) => (
          <motion.button
            key={m.caption}
            type="button"
            onClick={() => play(i)}
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: EASE_OUT_EXPO }}
            className="group relative aspect-[4/5] w-[240px] shrink-0 snap-start overflow-hidden rounded-2xl border border-line text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse sm:w-[280px]"
            aria-label={`Play moment: ${m.caption}`}
          >
            {/* artwork */}
            <img
              src={m.album}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-void/95 via-void/20 to-void/40" />

            {/* play ring */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ghost/40 bg-void/40 backdrop-blur-sm transition-all duration-500',
                hovered === i || playing === i ? 'rotate-[360deg] border-beat opacity-100' : 'opacity-70',
              )}
            >
              <Play className={cn('h-6 w-6 fill-current', playing === i ? 'text-beat' : 'text-ghost')} />
            </span>

            {/* share icon */}
            <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-ghost/20 bg-void/40 backdrop-blur-sm transition-colors duration-300 group-hover:border-beat/60">
              <Share2 className="h-4 w-4 text-ghost" />
            </span>

            {/* bottom: waveform strip + caption */}
            <span className="absolute inset-x-0 bottom-0 p-4">
              <SpectrumBars bars={18} className="h-6 justify-between" barClassName="w-[3px]" playing={hovered === i || playing === i} />
              <span className="mt-3 block font-mono text-[0.7rem] tracking-[0.06em] text-mist">{m.caption}</span>
              {/* 15s fake progress sweep */}
              <span className="mt-2 block h-[2px] w-full overflow-hidden rounded-full bg-line">
                <motion.span
                  className="block h-full w-full origin-left bg-aurora"
                  initial={false}
                  animate={{ scaleX: playing === i ? 1 : 0 }}
                  transition={playing === i ? { duration: 15, ease: 'linear' } : { duration: 0.25 }}
                  onAnimationComplete={() => {
                    if (playing === i) setPlaying(null)
                  }}
                />
              </span>
            </span>
          </motion.button>
        ))}
      </div>
      {host}
    </section>
  )
}
