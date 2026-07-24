import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const QA: { q: string; a: string }[] = [
  {
    q: 'Is my music library portable into manosli+?',
    a: "Yes. Import from files, playlists (M3U), or other services' exports. Matching runs on-device against the CID catalog.",
  },
  {
    q: 'What happens when wave 04 fills?',
    a: 'Wave 05. Handles are never re-released, so early is a real adjective.',
  },
  {
    q: 'Do free users get the privacy architecture?',
    a: 'All of it. Privacy is the platform, not a tier.',
  },
  {
    q: 'Can I use manosli+ without any wearables?',
    a: 'Completely. Signals are optional and per-source; the Mood Engine works beautifully on time, weather, and your skips alone.',
  },
  {
    q: 'Refund policy?',
    a: '30 days, no questions, export intact. Leaving should be easy — remember?',
  },
]

/** Download §7 — final objection-handling FAQ; max one open (design.md §8.5) */
export default function Faq() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-18%' }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="font-display text-[clamp(1.9rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.05] tracking-[-0.015em] text-ghost"
        >
          Last questions.
        </motion.h2>

        <div className="mt-10">
          {QA.map((item, i) => {
            const isOpen = open === i
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: EASE_OUT_EXPO }}
                className="border-t border-line last:border-b"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="font-sans text-lg font-medium text-ghost">{item.q}</span>
                  <Plus
                    className={cn(
                      'h-5 w-5 shrink-0 text-mist transition-transform duration-300',
                      isOpen && 'rotate-45 text-ghost',
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 170, damping: 26 }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[60ch] pb-6 leading-[1.65] text-mist">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
