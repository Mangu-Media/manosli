import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FileDown } from 'lucide-react'
import Toast from '../ecosystem/Toast'
import type { ToastData } from '../ecosystem/Toast'
import { EASE_OUT_EXPO } from '@/lib/motion'

const ITEMS = ['LOGO PACK .ZIP', 'PRODUCT RENDERS .ZIP', 'BRAND SHEET .PDF']

/** Download §6 — press kit */
export default function PressKit() {
  const [toast, setToast] = useState<ToastData | null>(null)
  const timer = useRef<number | null>(null)

  const queue = () => {
    if (timer.current) window.clearTimeout(timer.current)
    setToast({ id: Date.now(), message: "Press kit item queued — this demo doesn't actually zip." })
    timer.current = window.setTimeout(() => setToast(null), 3500)
  }

  return (
    <section id="press" className="py-32">
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-6 lg:grid-cols-2 lg:px-12">
        <div>
          <motion.h3
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-18%' }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="font-sans text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ghost"
          >
            Talking about us?
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-18%' }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="mt-5 max-w-[52ch] leading-[1.65] text-mist"
          >
            Logos, product renders, the manifesto, and the correct pronunciation (mah-noh-slee).
            Take everything; misquote nothing.
          </motion.p>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
            {ITEMS.map((item, i) => (
              <motion.button
                key={item}
                type="button"
                onClick={queue}
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-15%' }}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.08, ease: EASE_OUT_EXPO }}
                className="inline-flex h-11 items-center gap-2.5 rounded-full border border-line px-5 font-mono text-[0.75rem] font-bold tracking-[0.1em] text-ghost transition-all duration-300 hover:border-pulse hover:bg-pulse/10 hover:shadow-glow-pulse"
              >
                <FileDown className="h-4 w-4 text-mist" />
                {item}
              </motion.button>
            ))}
          </div>
        </div>

        {/* press preview card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="group relative"
        >
          <div aria-hidden="true" className="absolute -inset-4 rounded-[28px] bg-pulse/10 blur-[50px]" />
          <div className="glass glass-sheen relative overflow-hidden rounded-2xl p-3 transition-transform duration-[450ms] group-hover:-translate-y-1.5">
            <img
              src="/assets/og-cover.png"
              alt="manosli+ social card — wordmark over a thin aurora waveform"
              className="w-full rounded-xl"
            />
            <div className="flex items-center justify-between px-2 py-3">
              <span className="font-mono text-[0.65rem] tracking-[0.18em] text-smoke">OG-COVER.PNG — 1200×630</span>
              <span className="font-mono text-[0.65rem] tracking-[0.18em] text-smoke">PRESS PREVIEW</span>
            </div>
          </div>
        </motion.div>
      </div>

      <Toast toast={toast} accent="bg-spark" />
    </section>
  )
}
