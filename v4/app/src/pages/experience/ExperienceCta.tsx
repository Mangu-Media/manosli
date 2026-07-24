import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import SonarRipple from '@/components/SonarRipple'
import { EASE_OUT_EXPO } from '@/lib/motion'

/** Experience §8 — CTA band over the deep-field wash */
export default function ExperienceCta() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <div className="deep-field absolute inset-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="absolute left-[12%] top-[18%] h-80 w-80 animate-blob-drift rounded-full bg-beat/15 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[12%] right-[14%] h-72 w-72 animate-blob-drift rounded-full bg-pulse/20 blur-[110px]"
        style={{ animationDelay: '-9s' }}
      />

      <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col items-center px-6 text-center lg:px-12">
        <SectionHeader
          eyebrow="SYS.06 // READY WHEN YOU ARE"
          title={['YOUR LIBRARY ALREADY KNOWS YOU.', 'LET IT SHOW OFF.']}
          accentWords={['SHOW', 'OFF']}
          align="center"
          accentDot="bg-spark"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-25%' }}
          transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="mt-12 flex flex-col items-center gap-6"
        >
          {/* sonar ripple fires behind the CTA on a loop */}
          <span className="relative inline-flex">
            <SonarRipple />
            <Link
              to="/download"
              className="group relative inline-flex h-14 items-center overflow-hidden rounded-full bg-aurora px-10 font-sans text-base font-bold text-void transition-all duration-300 hover:scale-[1.03] hover:shadow-glow-pulse active:scale-[0.97]"
            >
              <span className="relative z-10">Get early access</span>
              <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform duration-[600ms] group-hover:translate-x-[380px]" />
            </Link>
          </span>

          <Link
            to="/technology"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-mist transition-colors duration-300 hover:text-ghost"
          >
            See the technology underneath
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
