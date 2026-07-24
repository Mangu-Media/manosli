import { motion, useMotionValue, useSpring } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

const CHIPS = ['120HZ IMU FUSION', 'PERSONAL HRTF', 'EAR-SCAN IN 30S', 'SPATIAL SPEAKER ARRAYS']

/** Spatial §5 — Head-Tracked Hardware: floating earbuds + echo rings + spec chips */
export default function Hardware() {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 120, damping: 16 })
  const sry = useSpring(ry, { stiffness: 120, damping: 16 })

  return (
    <section className="py-28">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-12">
        {/* floating product visual */}
        <motion.div
          initial={{ opacity: 0, y: 64, rotate: -6 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: '-18%' }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          className="relative mx-auto w-full max-w-[520px]"
          style={{ perspective: 800 }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            ry.set(((e.clientX - r.left) / r.width - 0.5) * 10)
            rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10)
          }}
          onPointerLeave={() => {
            rx.set(0)
            ry.set(0)
          }}
        >
          {/* echo rings */}
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className="spx-echo absolute left-1/2 top-1/2 h-[70%] w-[70%] rounded-full border border-wave/50"
              style={{ animationDelay: `${i * 0.8}s` }}
            />
          ))}
          <motion.img
            src="/assets/earbuds-spatial.png"
            alt="manosli+ wireless earbuds radiating spatial sound rings"
            style={{ rotateX: srx, rotateY: sry }}
            className="relative w-full drop-shadow-[0_0_60px_rgba(46,230,214,0.25)]"
          />
        </motion.div>

        {/* copy */}
        <motion.div
          initial={{ opacity: 0, x: 48 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        >
          <p className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-wave" />
            SYS.04 // HARDWARE
          </p>
          <h3 className="mt-6 font-sans text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ghost">
            THE STAGE STAYS PUT WHEN YOU DON'T.
          </h3>
          <p className="mt-6 max-w-[60ch] leading-[1.65] text-mist">
            Gyro-fused head tracking at 120Hz keeps the mix anchored to the room, not your skull. Personalized HRTF
            from a 30-second ear scan puts sources where your brain expects physics to put them.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {CHIPS.map((chip, i) => (
              <motion.span
                key={chip}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.08, ease: EASE_OUT_EXPO }}
                className="rounded-lg border border-wave/40 bg-wave/5 px-3 py-2.5 text-center font-mono text-[0.75rem] tracking-[0.06em] text-wave"
              >
                {chip}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
