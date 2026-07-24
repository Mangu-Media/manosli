import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { getLenis } from '@/lib/scroll'

type Billing = 'monthly' | 'yearly'

interface Plan {
  name: string
  monthly: string
  yearly: string
  suffixMonthly: string
  suffixYearly: string
  blurb: string
  features: string[]
  cta: string
  style: 'ghost' | 'primary' | 'amber'
  popular?: boolean
  limited?: boolean
}

const PLANS: Plan[] = [
  {
    name: 'PULSE FREE',
    monthly: '$0',
    yearly: '$0',
    suffixMonthly: 'forever',
    suffixYearly: 'forever',
    blurb: 'Ad-free, because ads are surveillance with a jingle.',
    features: ['Full catalog (standard quality)', 'On-device Mood Engine', '1 device', 'Rooms: join'],
    cta: 'Start free',
    style: 'ghost',
  },
  {
    name: 'MANOSLI+',
    monthly: '$11',
    yearly: '$110',
    suffixMonthly: '/mo',
    suffixYearly: '/yr',
    blurb: 'The whole platform.',
    features: ['Lossless + spatial audio', 'Unlimited devices + handoff', 'Offline voice', 'Host rooms', 'Night Arc', 'Moments'],
    cta: 'Get manosli+',
    style: 'primary',
    popular: true,
  },
  {
    name: 'FAMILY',
    monthly: '$16',
    yearly: '$160',
    suffixMonthly: '/mo',
    suffixYearly: '/yr',
    blurb: 'Six vaults, zero mixing.',
    features: ['Everything in manosli+', '6 accounts, separate vaults', 'Family room', 'Per-member HRTF profiles'],
    cta: 'Bring the house',
    style: 'ghost',
  },
  {
    name: 'FOUNDERS',
    monthly: '$249',
    yearly: '$249',
    suffixMonthly: 'once',
    suffixYearly: 'once',
    blurb: 'Lifetime. Your handle etched in the credits screen.',
    features: ['Everything in manosli+, forever', 'Founders badge + amber handle color', 'Vote on the roadmap', 'The audacity, remembered'],
    cta: 'Claim a seat',
    style: 'amber',
    limited: true,
  },
]

/** price that scrambles digits for 0.4s when the value changes */
function ScramblePrice({ value, flash }: { value: string; flash: boolean }) {
  const [display, setDisplay] = useState(value)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return // initial display already equals value
    }
    const start = performance.now()
    const id = window.setInterval(() => {
      if (performance.now() - start >= 400) {
        setDisplay(value)
        window.clearInterval(id)
        return
      }
      setDisplay(
        value
          .split('')
          .map((ch) => (/[0-9]/.test(ch) ? String(Math.floor(Math.random() * 10)) : ch))
          .join(''),
      )
    }, 40)
    return () => window.clearInterval(id)
  }, [value])

  return (
    <span className={cn('transition-colors duration-700', flash && 'text-wave')}>
      {display}
    </span>
  )
}

function scrollToAccess() {
  const el = document.querySelector('#access')
  if (!(el instanceof HTMLElement)) return
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(el, { offset: -76, duration: 1.4 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

/** Download §3 — plans: pay for music, not for being watched */
export default function Plans() {
  const [billing, setBilling] = useState<Billing>('monthly')
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef<number | null>(null)

  const toggle = (next: Billing) => {
    if (next === billing) return
    setBilling(next)
    if (next === 'yearly') {
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
      setFlash(true)
      flashTimer.current = window.setTimeout(() => setFlash(false), 900)
    }
  }

  return (
    <section id="plans" className="py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeader
            eyebrow="SYS.02 // PLANS"
            title={['PAY FOR MUSIC.', 'NOT FOR BEING WATCHED.']}
            accentWords={['MUSIC']}
            accentDot="bg-beat"
          />
          {/* billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="flex rounded-full border border-line p-1"
            role="group"
            aria-label="Billing period"
          >
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => toggle(b)}
                aria-pressed={billing === b}
                className={cn(
                  'relative rounded-full px-5 py-2.5 font-mono text-[0.72rem] font-bold tracking-[0.14em] transition-colors duration-300',
                  billing === b ? 'text-ghost' : 'text-smoke hover:text-mist',
                )}
              >
                {billing === b && (
                  <motion.span
                    layoutId="billing-knob"
                    className="absolute inset-0 rounded-full border border-pulse/60 bg-pulse/15"
                    transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                  />
                )}
                <span className="relative">
                  {b === 'monthly' ? 'MONTHLY' : 'YEARLY (−17%)'}
                </span>
              </button>
            ))}
          </motion.div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:items-center">
          {PLANS.map((plan, i) => {
            const price = billing === 'monthly' ? plan.monthly : plan.yearly
            const suffix = billing === 'monthly' ? plan.suffixMonthly : plan.suffixYearly
            const card = (
              <div
                className={cn(
                  'relative flex h-full flex-col rounded-2xl p-8',
                  plan.popular ? 'bg-panel py-10 lg:py-14' : 'glass glass-sheen',
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-aurora px-3.5 py-1 font-mono text-[0.62rem] font-bold tracking-[0.16em] text-void">
                    MOST POPULAR
                  </span>
                )}
                {plan.limited && (
                  <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-spark/60 bg-void px-3.5 py-1 font-mono text-[0.62rem] font-bold tracking-[0.16em] text-spark">
                    <span className="h-1.5 w-1.5 animate-dot-pulse rounded-full bg-spark" />
                    LIMITED
                  </span>
                )}

                <p className="font-mono text-xs font-medium tracking-[0.22em] text-smoke">{plan.name}</p>
                <p className="mt-5 font-mono text-5xl font-bold tabular-nums tracking-[-0.03em] text-ghost">
                  <ScramblePrice value={price} flash={flash} />
                  <span className="ml-2 align-middle font-mono text-sm font-normal tracking-[0.04em] text-smoke">
                    {suffix}
                  </span>
                </p>
                <p className="mt-4 text-sm leading-[1.6] text-mist">{plan.blurb}</p>

                <ul className="mt-7 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-mist">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-wave" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={scrollToAccess}
                  className={cn(
                    'group relative mt-8 inline-flex h-12 items-center justify-center overflow-hidden rounded-full px-6 font-sans text-sm font-bold transition-all duration-300 active:scale-[0.97]',
                    plan.style === 'primary' && 'bg-aurora text-void hover:scale-[1.03] hover:shadow-glow-pulse',
                    plan.style === 'ghost' &&
                      'border border-line text-ghost hover:border-pulse hover:bg-pulse/10 hover:shadow-glow-pulse',
                    plan.style === 'amber' &&
                      'border border-spark/60 bg-spark/10 text-spark hover:bg-spark hover:text-void hover:shadow-[0_0_48px_rgba(255,178,36,0.3)]',
                  )}
                >
                  <span className="relative z-10">{plan.cta}</span>
                  {plan.style === 'primary' && (
                    <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform duration-[600ms] group-hover:translate-x-[320px]" />
                  )}
                </button>
              </div>
            )

            return (
              <div key={plan.name} className="transition-transform duration-[450ms] hover:-translate-y-1.5">
                <motion.div
                  initial={{ y: 64, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: EASE_OUT_EXPO }}
                  className={cn(plan.popular && 'rounded-2xl bg-aurora p-[1.5px] shadow-glow-pulse')}
                >
                  {card}
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
