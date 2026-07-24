import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ToastState {
  id: number
  message: string
}

/** Toast host + hook (design.md §8.5): bottom-right glass pill, accent left
 *  edge, slides in x 100%→0, auto-dismiss 3.5s with progress hairline. */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ id: Date.now(), message })
    timer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  const host = (
    <div className="pointer-events-none fixed bottom-24 right-6 z-[96] flex flex-col items-end gap-2">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="glass glass-sheen relative overflow-hidden rounded-xl border-l-[3px] border-l-beat py-3 pl-4 pr-6"
            role="status"
          >
            <p className="font-mono text-[0.8125rem] tracking-[0.04em] text-ghost">{toast.message}</p>
            <span className={cn('soc-toastbar absolute bottom-0 left-0 h-[2px] w-full bg-beat/70')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return { show, host }
}
