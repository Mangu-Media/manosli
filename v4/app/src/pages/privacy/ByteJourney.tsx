import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion } from 'framer-motion'
import { Smartphone, Lock, Server, Laptop, EyeOff } from 'lucide-react'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const STATIONS = [
  {
    title: 'YOUR DEVICE',
    body: 'You skip a track. The event is written to your local vault.',
    icon: Smartphone,
  },
  {
    title: 'ENCRYPTION',
    body: 'If sync is on, the event is encrypted on-device — XChaCha20-Poly1305, keys from your enclave.',
    icon: Lock,
  },
  {
    title: 'BLIND RELAY',
    body: 'Our relay stores and forwards ciphertext. A magnifying glass tries to read it and gets 0x8fa3… — nothing more.',
    icon: Server,
  },
  {
    title: 'YOUR OTHER DEVICES',
    body: 'Your laptop holds the other key. It decrypts locally. The circle never included us.',
    icon: Laptop,
  },
]

/* station anchor positions along the rail (%) */
const X = [6, 35, 65, 94]

/** scrambling hex label shown once the packet is encrypted */
function HexScramble({ active }: { active: boolean }) {
  const [txt, setTxt] = useState('0x8fa3…e1c0')
  useEffect(() => {
    if (!active) return
    const hex = '0123456789abcdef'
    const iv = setInterval(() => {
      setTxt(
        `0x${Array.from({ length: 4 }, () => hex[Math.floor(Math.random() * 16)]).join('')}…${Array.from({ length: 4 }, () => hex[Math.floor(Math.random() * 16)]).join('')}`,
      )
    }, 120)
    return () => clearInterval(iv)
  }, [active])
  return <span className="font-tabular">{txt}</span>
}

/** Privacy §4 — pinned journey of an encrypted byte (220vh) */
export default function ByteJourney() {
  const wrapRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const packetRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px)', () => {
        const st = ScrollTrigger.create({
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=220%',
          pin: pinRef.current,
          scrub: 0.6,
          onUpdate: (self) => {
            setProgress(self.progress)
            if (fillRef.current) fillRef.current.style.width = `${self.progress * 100}%`
            if (packetRef.current) packetRef.current.style.left = `${X[0] + self.progress * (X[3] - X[0])}%`
            const idx = Math.min(STATIONS.length - 1, Math.floor(self.progress * STATIONS.length))
            if (idx !== activeRef.current) {
              activeRef.current = idx
              setActive(idx)
            }
          },
        })
        return () => st.kill()
      })
      return () => mm.revert()
    },
    { scope: wrapRef },
  )

  const encrypted = progress > 0.34 // past the encryption capsule
  const atRelay = active === 2

  return (
    <section ref={wrapRef} className="relative">
      {/* ---------- desktop: pinned stage ---------- */}
      <div ref={pinRef} className="hidden min-h-[100dvh] items-center overflow-hidden lg:flex">
        <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
          >
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-pulse" />
            SYS.E2EE // THE JOURNEY
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-6 font-display text-[clamp(1.9rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.05] tracking-[-0.015em] text-ghost"
          >
            ONE BYTE, END TO END.
          </motion.h2>

          {/* rail + stations */}
          <div className="relative mt-20">
            {/* rail */}
            <div className="absolute left-0 right-0 top-[52px] h-[2px] rounded-full bg-line">
              <div ref={fillRef} className="absolute inset-y-0 left-0 w-0 rounded-full bg-aurora" />
            </div>

            {/* packet */}
            <div
              ref={packetRef}
              className="absolute top-[52px] z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${X[0]}%` }}
            >
              <div
                className={cn(
                  'h-2 w-2 rounded-full transition-all duration-500',
                  encrypted ? 'bg-pulse shadow-glow-pulse' : 'bg-ghost',
                  atRelay && 'opacity-60',
                  active === 3 && 'bg-wave shadow-glow-wave',
                )}
              />
              <p
                className={cn(
                  'absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap font-mono text-[0.6rem] tracking-[0.06em] transition-colors duration-500',
                  encrypted ? 'text-pulse' : 'text-mist',
                  atRelay && 'opacity-60',
                )}
              >
                {encrypted ? <HexScramble active={encrypted} /> : 'PLAINTEXT'}
              </p>
            </div>

            {/* stations */}
            <div className="grid grid-cols-4 gap-8">
              {STATIONS.map((s, i) => {
                const Icon = s.icon
                const isActive = i === active
                return (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-25%' }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT_EXPO }}
                    className="relative pt-0"
                  >
                    {/* glyph above rail */}
                    <div
                      className={cn(
                        'relative mx-auto flex h-[104px] w-[104px] items-center justify-center rounded-2xl border bg-panel/70 backdrop-blur-sm transition-all duration-500',
                        isActive ? 'border-pulse/70 shadow-glow-pulse' : 'border-line',
                      )}
                    >
                      <Icon className={cn('h-8 w-8 transition-colors duration-500', isActive ? 'text-pulse' : 'text-mist')} />
                      {/* per-station glyph detail */}
                      {i === 0 && (
                        <span
                          className={cn(
                            'absolute bottom-3 left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-wave transition-all duration-500',
                            isActive || active > 0 ? 'w-10 opacity-100' : 'w-0 opacity-0',
                          )}
                        />
                      )}
                      {i === 1 && (
                        <span
                          className={cn(
                            'absolute -bottom-2 rounded-md border px-2 py-0.5 font-mono text-[0.55rem] tracking-[0.06em] transition-all duration-500',
                            isActive || active > 1 ? 'border-pulse/60 bg-void text-pulse' : 'border-line bg-void text-smoke',
                          )}
                        >
                          {isActive || active > 1 ? '0x8fa3…e1c0' : 'PLAINTEXT'}
                        </span>
                      )}
                      {i === 2 && (
                        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-beat/60 bg-void">
                          <EyeOff className="h-3.5 w-3.5 text-beat" />
                        </span>
                      )}
                      {i === 3 && (
                        <Lock
                          className={cn(
                            'absolute -right-2 -top-2 h-5 w-5 transition-colors duration-500',
                            isActive ? 'text-wave' : 'text-smoke',
                          )}
                        />
                      )}
                    </div>

                    {/* station copy */}
                    <div
                      className={cn(
                        'mt-10 transition-all duration-500',
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-45',
                      )}
                    >
                      <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-smoke">
                        {String(i + 1).padStart(2, '0')}
                      </p>
                      <h3 className="mt-2 font-sans text-lg font-bold text-ghost">{s.title}</h3>
                      <p className="mt-2 text-sm leading-[1.65] text-mist">{s.body}</p>
                      {i === 2 && (
                        <p className="mt-3 font-mono text-[0.65rem] tracking-[0.08em] text-beat">
                          SERVER KNOWS: SIZE, TIMING, NOTHING ELSE
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- mobile: stacked stations ---------- */}
      <div className="px-6 py-24 lg:hidden">
        <p className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">
          <span className="h-2 w-2 animate-dot-pulse rounded-full bg-pulse" />
          SYS.E2EE // THE JOURNEY
        </p>
        <h2 className="mt-6 font-display text-[clamp(1.9rem,7vw,2.6rem)] font-bold uppercase leading-[1.05] text-ghost">
          ONE BYTE, END TO END.
        </h2>
        <div className="relative mt-12 space-y-8 border-l border-line pl-8">
          {STATIONS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20%' }}
                transition={{ duration: 0.6, delay: 0.05 * i, ease: EASE_OUT_EXPO }}
                className="relative"
              >
                <span className="absolute -left-[41px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-pulse/60 bg-void">
                  <Icon className="h-3 w-3 text-pulse" />
                </span>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-smoke">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-1 font-sans text-lg font-bold text-ghost">{s.title}</h3>
                <p className="mt-2 text-sm leading-[1.65] text-mist">{s.body}</p>
                {i === 2 && (
                  <p className="mt-2 font-mono text-[0.65rem] tracking-[0.08em] text-beat">
                    SERVER KNOWS: SIZE, TIMING, NOTHING ELSE
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
