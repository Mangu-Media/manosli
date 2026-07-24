import { motion, useScroll, useSpring } from 'framer-motion'

/** 3px aurora scroll-progress bar, fixed top (design.md §6) */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[100] h-[3px] origin-left bg-aurora"
      style={{ scaleX }}
    />
  )
}
