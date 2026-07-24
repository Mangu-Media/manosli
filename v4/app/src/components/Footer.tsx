import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Github, Instagram, MessageCircle, Twitter } from 'lucide-react'
import { motion } from 'framer-motion'
import Logo from './Logo'
import WaveformDivider from './WaveformDivider'
import SpectrumBars from './SpectrumBars'
import { EASE_OUT_EXPO } from '@/lib/motion'

const COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Experience', to: '/experience' },
      { label: 'Technology', to: '/technology' },
      { label: 'Spatial', to: '/spatial' },
      { label: 'Social', to: '/social' },
      { label: 'Ecosystem', to: '/ecosystem' },
      { label: 'Download', to: '/download' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Tech specs', to: '/technology#specs' },
      { label: 'Developers', to: '/ecosystem#developers' },
      { label: 'Plans', to: '/download#plans' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Listening rooms', to: '/social#rooms' },
      { label: 'Manifesto', to: '/privacy' },
      { label: 'Press kit', to: '/download#press' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Telemetry manifest', to: '/privacy#telemetry' },
      { label: 'Security', to: '/privacy#stack' },
    ],
  },
]

const SOCIALS = [
  { label: 'X', href: 'https://x.com', Icon: Twitter },
  { label: 'Discord', href: 'https://discord.com', Icon: MessageCircle },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
  { label: 'GitHub', href: 'https://github.com', Icon: Github },
]

/** Shared footer: CTA band, waveform divider, link columns, status row (design.md §8.3) */
export default function Footer() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setSent(true)
  }

  return (
    <footer className="border-t border-line bg-abyss pt-24">
      {/* CTA band */}
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
          >
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-spark" />
            SYS.READY // 08
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="mt-6 font-display text-[clamp(1.9rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.05] tracking-[-0.015em] text-ghost"
          >
            Press <span className="text-aurora">play</span> on the future.
          </motion.h2>
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT_EXPO }}
            className="mt-8 flex max-w-md items-center gap-3"
          >
            <label htmlFor="footer-email" className="sr-only">
              Email for early access
            </label>
            <input
              id="footer-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@earth.com"
              disabled={sent}
              className="h-12 flex-1 rounded-full border border-line bg-panel px-5 font-mono text-sm text-ghost placeholder:text-smoke focus:border-pulse focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Request early access"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-aurora text-void transition-shadow duration-300 hover:shadow-glow-pulse"
            >
              {sent ? <Check className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
            </button>
          </motion.form>
          <p className="mt-4 font-mono text-[0.8125rem] tracking-[0.04em] text-smoke">
            {sent ? 'HANDLE RESERVED — WATCH YOUR INBOX' : 'Early access · iOS · Android · Web · AR/VR'}
          </p>
        </div>
      </div>

      <WaveformDivider className="mx-auto mt-16 max-w-[1440px] px-6 lg:px-12" />

      {/* Link columns */}
      <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-6 lg:px-12">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-5 max-w-[32ch] text-sm leading-[1.65] text-mist">Sound, understood. Music that moves with you — and stays yours.</p>
          <SpectrumBars bars={12} className="mt-6 h-6" duration={1.1} />
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">{col.title}</h3>
            <ul className="mt-5 space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-mist transition-colors duration-300 hover:text-ghost">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-5 px-6 py-8 md:flex-row lg:px-12">
          <p className="font-mono text-[0.8125rem] tracking-[0.04em] text-smoke">© 2025 manosli+</p>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-line px-4 py-2">
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-wave" />
            <span className="font-mono text-[0.8125rem] tracking-[0.04em] text-mist">ALL SYSTEMS NOMINAL — 40ms GLOBAL SYNC</span>
          </div>
          <div className="flex items-center gap-5">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="text-smoke transition-colors duration-300 hover:text-ghost">
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          <p className="font-mono text-[0.8125rem] tracking-[0.04em] text-smoke">Made on Earth. Heard everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
