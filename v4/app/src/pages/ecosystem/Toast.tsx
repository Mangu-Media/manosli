import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

export interface ToastData {
  id: number
  message: string
}

/** Bottom-right glass pill toast, accent left edge, 3.5s hairline (design.md §8.5) */
export default function Toast({ toast, accent = 'bg-wave' }: { toast: ToastData | null; accent?: string }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[130]">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ x: '110%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '110%', opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="glass relative overflow-hidden rounded-xl py-3.5 pl-5 pr-6"
            role="status"
          >
            <span className={cn('absolute inset-y-0 left-0 w-[3px]', accent)} />
            <p className="font-mono text-[0.8125rem] tracking-[0.04em] text-ghost">{toast.message}</p>
            <motion.span
              className={cn('absolute bottom-0 left-0 h-[2px] opacity-60', accent)}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3.5, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
