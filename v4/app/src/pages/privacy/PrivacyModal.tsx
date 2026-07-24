import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { EASE_OUT_EXPO } from '@/lib/motion'

interface PrivacyModalProps {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
}

/** Modal (design.md §8.5): scrim void/80% + blur, glass panel, ESC/scrim close */
export default function PrivacyModal({ open, onClose, title, eyebrow, children }: PrivacyModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[108] flex items-center justify-center bg-void/80 p-6 backdrop-blur-[8px]"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="glass glass-sheen w-full max-w-lg rounded-3xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                {eyebrow && (
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-spark">{eyebrow}</p>
                )}
                <h3 className="mt-2 font-sans text-xl font-bold text-ghost">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-mist transition-colors hover:border-pulse hover:text-ghost"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
