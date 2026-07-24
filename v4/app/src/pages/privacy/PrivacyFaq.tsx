import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    q: 'If everything is encrypted, how do recommendations work?',
    a: "On-device. Your models score your library locally; the global model improves via federated learning — encrypted gradient updates, differential privacy, zero play events. Smart doesn't require seen.",
  },
  {
    q: 'What exactly do your servers store?',
    a: 'Encrypted blobs for sync (if you enable it), account credentials as salted hashes, and the telemetry events listed in the manifest — nothing else.',
  },
  {
    q: 'Can a room host see my listening history?',
    a: 'No. Rooms share a queue and presence. History never leaves your vault — not even encrypted, because it never leaves at all.',
  },
  {
    q: 'What happens if you get breached?',
    a: "Attackers get ciphertext without keys and salted hashes. Your keys live in your devices' secure enclaves, not on our servers.",
  },
  {
    q: 'Do you comply with takedowns of my data?',
    a: "There's nothing readable to take down. Deleting your account orphans the blobs permanently.",
  },
]

/** Privacy §8 — straight-answer FAQ, single-open accordion */
export default function PrivacyFaq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="relative py-24 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        className="mx-auto max-w-3xl px-6"
      >
        <SectionHeader
          eyebrow="SYS.QA // STRAIGHT ANSWERS"
          title={['ASKED, ANSWERED.']}
          accentWords={['ANSWERED']}
          accentDot="bg-spark"
        />

        <div className="mt-12">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className={cn('font-sans text-lg font-medium transition-colors duration-300', isOpen ? 'text-ghost' : 'text-mist hover:text-ghost')}>
                    {f.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                    className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300', isOpen ? 'border-spark text-spark' : 'border-line text-mist')}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[62ch] pb-6 leading-[1.7] text-mist">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}
