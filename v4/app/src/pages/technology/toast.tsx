import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

interface ToastItem {
  id: number
  message: string
  accent: string
}

type Listener = (t: ToastItem) => void
const listeners = new Set<Listener>()
let nextId = 1

/** Fire a toast from anywhere on the technology/privacy pages */
export function showToast(message: string, accent = '#2EE6D6') {
  const item = { id: nextId++, message, accent }
  listeners.forEach((l) => l(item))
}

/**
 * Toast host (design.md §8.5): bottom-right glass pill, mono caption,
 * accent left edge 3px, slides in x 100%→0, auto-dismiss 3.5s, progress hairline.
 * Mount once per page.
 */
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const add: Listener = (t) => {
      setToasts((prev) => [...prev.slice(-2), t])
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500)
    }
    listeners.add(add)
    return () => {
      listeners.delete(add)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[105] flex w-[min(360px,calc(100vw-48px))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ x: '110%', opacity: 0 }}
            animate={{ x: '0%', opacity: 1 }}
            exit={{ x: '110%', opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="glass glass-sheen relative overflow-hidden rounded-xl py-3 pl-5 pr-4"
            role="status"
          >
            <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: t.accent }} aria-hidden="true" />
            <p className="font-mono text-[0.8125rem] leading-[1.5] tracking-[0.04em] text-ghost">{t.message}</p>
            <motion.span
              className="absolute bottom-0 left-0 h-[2px] w-full origin-left"
              style={{ background: t.accent }}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 3.5, ease: 'linear' }}
              aria-hidden="true"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
