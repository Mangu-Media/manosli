import { motion } from 'framer-motion'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO } from '@/lib/motion'

const PLEDGES = [
  {
    n: '01',
    title: 'WE WILL NEVER SELL DATA',
    body: "There is no ads business, no data brokerage, no 'anonymized' side door. The architecture makes betrayal a refactor, not a temptation.",
  },
  {
    n: '02',
    title: 'CLIENTS ARE OPEN',
    body: 'Every client app is source-available. Verify the encryption. Verify the vault. Verify us.',
  },
  {
    n: '03',
    title: 'YOU CAN LEAVE WHOLE',
    body: "Full export, full delete, no dark patterns. A platform you can't leave is a cage with good taste.",
  },
]

/** Privacy §7 — the charter, three pledges */
export default function Commitments() {
  return (
    <section className="relative py-24 lg:py-32" style={{ perspective: '1200px' }}>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.CHARTER // COMMITMENTS"
          title={['SIGNED IN PUBLIC.']}
          accentWords={['SIGNED']}
          accentDot="bg-spark"
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLEDGES.map((p, i) => (
            <motion.article
              key={p.n}
              initial={{ opacity: 0, y: 56, rotateX: 8 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: EASE_OUT_EXPO }}
              className="group glass glass-sheen relative flex min-h-[340px] flex-col overflow-hidden rounded-2xl p-8 transition-all duration-[450ms] hover:-translate-y-1.5 hover:border-spark/60 hover:shadow-card-lift"
            >
              {/* numeral watermark, drifts 10px parallax on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 -top-8 select-none font-mono text-[180px] font-bold leading-none text-ghost/[0.04] transition-transform duration-700 group-hover:translate-y-2.5"
              >
                {p.n}
              </span>
              <p className="font-mono text-[0.7rem] tracking-[0.18em] text-spark">PLEDGE {p.n}</p>
              <h3 className="mt-4 font-sans text-xl font-bold leading-[1.3] text-ghost">{p.title}</h3>
              <p className="mt-4 flex-1 text-sm leading-[1.75] text-mist">{p.body}</p>
              {/* signature line */}
              <div className="mt-8">
                <div className="h-px w-full bg-line" />
                <p className="mt-3 font-mono text-[0.65rem] tracking-[0.14em] text-smoke">— THE MANOSLI+ CHARTER</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
