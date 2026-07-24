import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const QUOTES = [
  {
    text: 'The first streaming service that feels like it was designed this decade.',
    name: 'A. Okafor',
    role: 'EARLY LISTENER, LAGOS',
    avatar: '/assets/avatar-01.png',
  },
  {
    text: 'Federated learning on a music app. They actually shipped the paper.',
    name: 'D. Reyes',
    role: 'ML ENGINEER, BERLIN',
    avatar: '/assets/avatar-02.png',
  },
  {
    text: 'Our listening parties survived three continents of latency. Nothing else comes close.',
    name: 'M. Chen',
    role: 'ROOM HOST, TAIPEI',
    avatar: '/assets/avatar-03.png',
  },
]

/** Home §7 — rotating testimonial band over aurora mesh */
export default function QuoteBand() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setIdx((i) => (i + 1) % QUOTES.length), 5000)
    return () => window.clearInterval(id)
  }, [idx])

  const q = QUOTES[idx]

  return (
    <section className="relative overflow-hidden border-y border-line py-36">
      <img
        src="/assets/mesh-aurora.png"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.55]"
      />
      <div className="absolute inset-0 bg-void/60" />
      <span
        aria-hidden="true"
        className="text-aurora pointer-events-none absolute left-8 top-4 select-none font-display text-[200px] leading-none opacity-15"
      >
        &ldquo;
      </span>
      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-12">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={idx}
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          >
            <p className="text-2xl font-medium leading-[1.5] text-ghost sm:text-3xl">
              {q.text.split(' ').map((w, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.015, ease: EASE_OUT_EXPO }}
                >
                  {w}{' '}
                </motion.span>
              ))}
            </p>
            <footer className="mt-8">
              <p className="font-sans text-base font-bold text-ghost">{q.name}</p>
              <p className="mt-1 font-mono text-[0.8125rem] tracking-[0.04em] text-smoke">{q.role}</p>
            </footer>
          </motion.blockquote>
        </AnimatePresence>
        <div className="mt-10 flex items-center justify-center gap-4">
          {QUOTES.map((quote, i) => (
            <button
              key={quote.name}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Show quote from ${quote.name}`}
              className={cn(
                'rounded-full p-[2px] transition-all duration-500',
                i === idx ? 'bg-aurora' : 'bg-transparent opacity-40 hover:opacity-70',
              )}
            >
              <img src={quote.avatar} alt={quote.name} loading="lazy" className="h-12 w-12 rounded-full border-2 border-void object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
