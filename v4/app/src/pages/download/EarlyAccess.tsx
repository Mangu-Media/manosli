import { useState } from 'react'
import type { FormEvent } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { Check } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import SonarRipple from '@/components/SonarRipple'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

const HANDLE_RE = /^[a-z0-9_.]{3,20}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PLATFORM_CHIPS = ['iOS', 'ANDROID', 'WEB', 'AR-VR']

type Status = 'idle' | 'sending' | 'done'

/** 12 spectrum bars rise and fall exactly once — the branded celebration */
function CelebrationBars() {
  return (
    <div className="flex h-12 items-end justify-center gap-[4px]" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[4px] origin-bottom rounded-full bg-spectrum"
          initial={{ scaleY: 0.12 }}
          animate={{ scaleY: [0.12, 1, 0.12] }}
          transition={{ duration: 1.1, delay: i * 0.05, times: [0, 0.45, 1], ease: 'easeInOut' }}
          style={{ height: '100%' }}
        />
      ))}
    </div>
  )
}

/** Download §5 — early access handle reservation (client-side simulation) */
export default function EarlyAccess() {
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [platforms, setPlatforms] = useState<Set<string>>(new Set(['iOS']))
  const [status, setStatus] = useState<Status>('idle')
  const [attempted, setAttempted] = useState(false)
  const [ripple, setRipple] = useState(false)
  const shake = useAnimationControls()

  const handleValid = HANDLE_RE.test(handle)
  const emailValid = EMAIL_RE.test(email)
  const handleInvalidShown = (handle.length > 0 && !handleValid) || (attempted && !handleValid)

  const togglePlatform = (p: string) =>
    setPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (status !== 'idle') return
    if (!handleValid || !emailValid) {
      setAttempted(true)
      shake.start({ x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.3 } })
      return
    }
    setStatus('sending')
    window.setTimeout(() => {
      setStatus('done')
      setRipple(true)
      window.setTimeout(() => setRipple(false), 2000)
    }, 900)
  }

  const fieldMotion = (i: number) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-12%' },
    transition: { duration: 0.6, delay: 0.08 * i, ease: EASE_OUT_EXPO },
  })

  return (
    <section id="access" className="relative overflow-hidden border-y border-line bg-abyss py-32">
      {/* mesh aurora at 35% under a void/70 overlay */}
      <img
        src="/assets/mesh-aurora.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-void/70" />

      <div className="relative z-10 mx-auto max-w-xl px-6">
        <SectionHeader
          eyebrow="SYS.03 // WAVE 04"
          title={['RESERVE YOUR HANDLE.']}
          accentWords={['HANDLE']}
          align="center"
          accentDot="bg-spark"
        />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-12%' }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="glass glass-sheen mt-12 rounded-3xl p-8 sm:p-10"
        >
          <AnimatePresence mode="wait" initial={false}>
            {status === 'done' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="flex flex-col items-center py-4 text-center"
              >
                <span className="relative inline-flex">
                  {ripple && <SonarRipple />}
                  <svg viewBox="0 0 100 100" className="h-24 w-24">
                    <defs>
                      <linearGradient id="ok-aurora" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#7C5CFF" />
                        <stop offset="0.5" stopColor="#FF3D8A" />
                        <stop offset="1" stopColor="#FFB224" />
                      </linearGradient>
                    </defs>
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="url(#ok-aurora)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, rotate: -90 }}
                      animate={{ pathLength: 1, rotate: -90 }}
                      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
                      style={{ transformOrigin: '50% 50%' }}
                    />
                  </svg>
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.55 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className="h-9 w-9 text-ghost" />
                  </motion.span>
                </span>

                <h3 className="mt-6 font-sans text-2xl font-bold text-ghost">You're in wave 04.</h3>
                <p className="mt-3 font-mono text-[0.78rem] tracking-[0.06em] text-wave">
                  HANDLE SECURED: manosli.plus/{handle}
                </p>
                <div className="mt-7">
                  <CelebrationBars />
                </div>
                <p className="mt-6 font-mono text-[0.68rem] tracking-[0.08em] text-smoke">
                  ONE EMAIL WHEN YOUR WAVE LANDS. THAT'S THE WHOLE DEAL.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={submit}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
                noValidate
              >
                {/* handle */}
                <motion.div {...fieldMotion(0)}>
                  <label htmlFor="ea-handle" className="font-mono text-[0.72rem] font-medium tracking-[0.18em] text-mist">
                    HANDLE
                  </label>
                  <motion.div animate={shake} className="relative mt-2.5">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-smoke">
                      manosli.plus/
                    </span>
                    <input
                      id="ea-handle"
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase())}
                      placeholder="yourname"
                      autoComplete="off"
                      spellCheck={false}
                      className={cn(
                        'w-full rounded-xl border bg-void/60 py-3.5 pl-[7.6rem] pr-11 font-mono text-sm text-ghost placeholder:text-smoke/70 focus:outline-none transition-colors duration-300',
                        handleInvalidShown ? 'border-beat/70 focus:border-beat' : 'border-line focus:border-pulse',
                      )}
                    />
                    <AnimatePresence>
                      {handleValid && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-wave"
                        >
                          <Check className="h-4 w-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <p
                    className={cn(
                      'mt-2 font-mono text-[0.68rem] tracking-[0.06em] transition-colors duration-300',
                      handleInvalidShown ? 'text-beat' : 'text-smoke',
                    )}
                  >
                    {handleValid ? 'HANDLE AVAILABLE' : '3–20 CHARS · A–Z · 0–9 · _ · .'}
                  </p>
                </motion.div>

                {/* email */}
                <motion.div {...fieldMotion(1)} className="mt-6">
                  <label htmlFor="ea-email" className="font-mono text-[0.72rem] font-medium tracking-[0.18em] text-mist">
                    EMAIL
                  </label>
                  <input
                    id="ea-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@earth.com"
                    className={cn(
                      'mt-2.5 w-full rounded-xl border bg-void/60 px-4 py-3.5 font-mono text-sm text-ghost placeholder:text-smoke/70 focus:outline-none transition-colors duration-300',
                      attempted && !emailValid ? 'border-beat/70 focus:border-beat' : 'border-line focus:border-pulse',
                    )}
                  />
                </motion.div>

                {/* platform chips */}
                <motion.div {...fieldMotion(2)} className="mt-6">
                  <p className="font-mono text-[0.72rem] font-medium tracking-[0.18em] text-mist">PLATFORMS</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {PLATFORM_CHIPS.map((p) => {
                      const on = platforms.has(p)
                      return (
                        <button
                          key={p}
                          type="button"
                          aria-pressed={on}
                          onClick={() => togglePlatform(p)}
                          className={cn(
                            'rounded-lg border px-3.5 py-1.5 font-mono text-[0.75rem] tracking-[0.08em] transition-all duration-300',
                            on
                              ? 'border-wave/60 bg-wave/10 text-wave'
                              : 'border-line text-smoke hover:border-mist hover:text-mist',
                          )}
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>

                {/* submit */}
                <motion.div {...fieldMotion(3)} className="mt-8">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-aurora px-8 font-sans text-sm font-bold text-void transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-pulse active:scale-[0.97] disabled:cursor-wait"
                  >
                    {status === 'sending' ? (
                      <span className="flex h-5 items-end gap-[3px]" aria-label="Securing your handle">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className="w-[3px] origin-bottom animate-eq-bar rounded-full bg-void"
                            style={{ height: '100%', animationDelay: `${i * 0.08}s`, animationDuration: '0.55s' }}
                          />
                        ))}
                      </span>
                    ) : (
                      <>
                        <span className="relative z-10">Join wave 04</span>
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-[60px] -translate-x-full bg-white/25 blur-sm transition-transform duration-[600ms] group-hover:translate-x-[460px]" />
                      </>
                    )}
                  </button>
                  <p className="mt-5 text-center font-mono text-[0.65rem] leading-[1.7] tracking-[0.08em] text-smoke">
                    NO SPAM. ONE EMAIL WHEN YOUR WAVE LANDS.
                    <br />
                    UNSUBSCRIBE = ONE CLICK, FOREVER.
                  </p>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
