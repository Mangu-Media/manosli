import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { EASE_OUT_EXPO } from '@/lib/motion'

interface StubPageProps {
  eyebrow: string
  title: string
  body: string
}

/** Placeholder for routes owned by page agents — keeps nav/links functional */
export default function StubPage({ eyebrow, title, body }: StubPageProps) {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden">
      <div className="deep-field absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-[1440px] px-6 py-24 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
        >
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-pulse" />
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT_EXPO }}
          className="mt-6 font-display text-[clamp(2.4rem,6vw,5rem)] font-black uppercase leading-[1.02] tracking-[-0.02em] text-ghost"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: EASE_OUT_EXPO }}
          className="mt-6 max-w-[56ch] text-lg leading-[1.7] text-mist"
        >
          {body}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: EASE_OUT_EXPO }}
          className="mt-10"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-sm tracking-[0.04em] text-mist transition-colors duration-300 hover:text-ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            BACK TO HOME
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
