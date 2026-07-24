import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ListMusic, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import SpectrumBars from './SpectrumBars'
import { cn } from '@/lib/utils'

const TRACKS = [
  { title: 'Midnight Circuit', artist: 'Vector Aurora', album: '/assets/album-01.png', duration: '3:42' },
  { title: 'Glasshouse FM', artist: 'Prism Waves', album: '/assets/album-02.png', duration: '4:05' },
  { title: 'Tidal Logic', artist: 'Nereus', album: '/assets/album-03.png', duration: '3:18' },
  { title: 'Ember Drives', artist: 'Solene', album: '/assets/album-04.png', duration: '2:57' },
  { title: 'Pastel Static', artist: 'VHS Ghost', album: '/assets/album-05.png', duration: '3:33' },
  { title: 'Concrete Bloom', artist: 'Brutal Soft', album: '/assets/album-06.png', duration: '4:21' },
  { title: 'Low Orbit', artist: 'Apogee', album: '/assets/album-07.png', duration: '5:02' },
  { title: 'Honey Waves', artist: 'Ambre', album: '/assets/album-08.png', duration: '3:47' },
  { title: 'Night Grid', artist: 'Vector Aurora', album: '/assets/album-01.png', duration: '3:29' },
  { title: 'Aurora Steps', artist: 'Prism Waves', album: '/assets/album-02.png', duration: '4:44' },
  { title: 'Velvet Machine', artist: 'Nereus', album: '/assets/album-03.png', duration: '3:11' },
  { title: 'Starlit Runner', artist: 'Solene', album: '/assets/album-04.png', duration: '4:36' },
]

/** Persistent simulated mini-player (design.md §8.2) — no real audio */
export default function PulseBar() {
  const [visible, setVisible] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [drawer, setDrawer] = useState(false)
  const [trackIndex, setTrackIndex] = useState(0)
  const track = TRACKS[trackIndex]

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const pastFirst = y > window.innerHeight * 0.9
      const nearFooter = y + window.innerHeight > document.documentElement.scrollHeight - 480
      setVisible(pastFirst && !nearFooter)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[95] w-[min(680px,calc(100vw-48px))] -translate-x-1/2">
      <AnimatePresence>
        {visible && (
          <motion.div
            key="pulse-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="pointer-events-auto relative"
          >
            {/* Track drawer */}
            <AnimatePresence>
              {drawer && (
                <motion.div
                  key="track-drawer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 320, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 34 }}
                  className="glass glass-sheen absolute bottom-full left-0 mb-3 w-full overflow-hidden rounded-2xl"
                >
                  <div className="h-[320px] overflow-y-auto p-2">
                    {TRACKS.map((t, i) => (
                      <button
                        key={`${t.title}-${i}`}
                        type="button"
                        onClick={() => setTrackIndex(i)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-line/40',
                          i === trackIndex && 'bg-line/30 shadow-[inset_3px_0_0_0] shadow-pulse',
                        )}
                      >
                        <img src={t.album} alt="" className="h-9 w-9 rounded-md object-cover" loading="lazy" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ghost">{t.title}</span>
                          <span className="block truncate text-xs text-smoke">{t.artist}</span>
                        </span>
                        <span className="font-mono text-xs text-smoke font-tabular">{t.duration}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bar */}
            <div className="glass glass-sheen relative h-16 overflow-hidden rounded-2xl">
              <div className="flex h-full items-center gap-4 px-4">
                <img
                  src={track.album}
                  alt=""
                  className="h-10 w-10 shrink-0 animate-spin-slow rounded-lg object-cover"
                  style={{ animationPlayState: playing ? 'running' : 'paused' }}
                />
                <button type="button" onClick={() => setDrawer((d) => !d)} className="min-w-0 flex-1 text-left" aria-expanded={drawer}>
                  <span className="block truncate text-sm font-medium text-ghost">{track.title}</span>
                  <span className="block truncate font-mono text-[0.8125rem] tracking-[0.04em] text-smoke">{track.artist}</span>
                </button>
                <SpectrumBars bars={5} playing={playing} className="hidden h-5 sm:flex" />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous track"
                    onClick={() => setTrackIndex((i) => (i - 1 + TRACKS.length) % TRACKS.length)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-mist transition-colors duration-200 hover:text-ghost"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={playing ? 'Pause' : 'Play'}
                    onClick={() => setPlaying((p) => !p)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-aurora text-void transition-shadow duration-300 hover:shadow-glow-pulse"
                  >
                    {playing ? <Pause className="h-4 w-4 animate-dot-pulse text-void" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
                  </button>
                  <button
                    type="button"
                    aria-label="Next track"
                    onClick={() => setTrackIndex((i) => (i + 1) % TRACKS.length)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-mist transition-colors duration-200 hover:text-ghost"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawer((d) => !d)}
                  className="hidden items-center gap-1.5 rounded-lg border border-line px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-mist transition-colors duration-200 hover:text-ghost sm:inline-flex"
                  aria-expanded={drawer}
                >
                  <ListMusic className="h-3.5 w-3.5" />Q 12
                </button>
              </div>
              {/* progress hairline */}
              <span
                aria-hidden="true"
                className="pb-progress absolute bottom-0 left-0 h-[2px] w-full origin-left bg-aurora"
                style={{ animationPlayState: playing ? 'running' : 'paused' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
