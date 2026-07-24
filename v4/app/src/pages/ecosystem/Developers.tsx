import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Check, Copy } from 'lucide-react'
import HudFrame from '@/components/HudFrame'
import Toast from './Toast'
import type { ToastData } from './Toast'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Lang = 'typescript' | 'swift' | 'kotlin' | 'rust'

const TABS: { id: Lang; label: string }[] = [
  { id: 'typescript', label: 'TYPESCRIPT' },
  { id: 'swift', label: 'SWIFT' },
  { id: 'kotlin', label: 'KOTLIN' },
  { id: 'rust', label: 'RUST' },
]

const SNIPPETS: Record<Lang, string> = {
  typescript: `import { manosli } from "@manosli/sdk";

const session = await manosli.sessions.current();
await session.handoff.to("speaker.studio");

session.rooms.on("queue.vote", (v) => {
  lights.pulse(v.track.energy); // your move
});`,
  swift: `import Manosli

let session = try await Manosli.sessions.current()
try await session.handoff.to("speaker.studio")

session.rooms.on("queue.vote") { v in
    lights.pulse(v.track.energy) // your move
}`,
  kotlin: `import plus.manosli.sdk.manosli

val session = manosli.sessions.current()
session.handoff.to("speaker.studio")

session.rooms.on("queue.vote") { v ->
    lights.pulse(v.track.energy) // your move
}`,
  rust: `use manosli::Manosli;

let session = Manosli::sessions().current().await?;
session.handoff().to("speaker.studio").await?;

session.rooms().on("queue.vote", |v| {
    lights.pulse(v.track.energy); // your move
});`,
}

const KEYWORDS =
  /\b(import|from|const|await|async|let|try|val|use|in|fun|func|return|pub|mut|where|new)\b/
const TOKEN_RE = /(\/\/.*)|("[^"]*")|(\b(?:import|from|const|await|async|let|try|val|use|in|fun|func|return|pub|mut|where|new)\b)/g

/** minimal syntax highlighter: keywords pulse, strings wave, comments smoke */
function highlight(code: string, keyPrefix: string) {
  const parts = code.split(TOKEN_RE)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('//'))
      return (
        <span key={`${keyPrefix}-${i}`} className="text-smoke">
          {part}
        </span>
      )
    if (part.startsWith('"'))
      return (
        <span key={`${keyPrefix}-${i}`} className="text-wave">
          {part}
        </span>
      )
    if (KEYWORDS.test(part))
      return (
        <span key={`${keyPrefix}-${i}`} className="text-pulse">
          {part}
        </span>
      )
    return (
      <span key={`${keyPrefix}-${i}`} className="text-ghost/90">
        {part}
      </span>
    )
  })
}

/** Ecosystem §5 — developer platform: typed SDKs + live code window */
export default function Developers() {
  const [tab, setTab] = useState<Lang>('typescript')
  const [revealed, setRevealed] = useState(0)
  const [typed, setTyped] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [copied, setCopied] = useState(false)
  const toastTimer = useRef<number | null>(null)

  const winRef = useRef<HTMLDivElement>(null)
  const inView = useInView(winRef, { margin: '-15% 0px' })

  const code = SNIPPETS[tab]
  const done = typed || revealed >= code.length
  const shown = done ? code : code.slice(0, revealed)

  // type-in at ~6ms/char, paused offscreen
  useEffect(() => {
    if (!inView || done) return
    const id = window.setInterval(() => {
      setRevealed((r) => Math.min(r + 3, code.length))
    }, 18)
    return () => window.clearInterval(id)
  }, [inView, done, code.length])

  const showToast = (message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message })
    toastTimer.current = window.setTimeout(() => setToast(null), 3500)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable in demo contexts — toast either way */
    }
    showToast('Copied. Ship something loud.')
  }

  const switchTab = (next: Lang) => {
    setTab(next)
    setTyped(true) // tab switches crossfade to the full snippet
  }

  return (
    <section id="developers" className="border-y border-line bg-abyss py-32">
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-6 lg:grid-cols-2 lg:px-12">
        {/* copy */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-18%' }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-2.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke"
          >
            <span className="h-2 w-2 animate-dot-pulse rounded-full bg-pulse" />
            SYS.04 // DEVELOPERS
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-18%' }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-6 font-sans text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.15] tracking-[-0.01em] text-ghost"
          >
            Build on the pulse.
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-18%' }}
            transition={{ duration: 0.6, delay: 0.16, ease: EASE_OUT_EXPO }}
            className="mt-5 max-w-[56ch] leading-[1.65] text-mist"
          >
            Typed SDKs for Swift, Kotlin, TypeScript, and Rust. Webhooks for rooms, handoffs, and
            Mood Engine state. Rate limits a hobby project will never hit.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-18%' }}
            transition={{ duration: 0.6, delay: 0.24, ease: EASE_OUT_EXPO }}
            className="mt-8 flex flex-wrap gap-2.5"
          >
            {['SDK ×4', 'GRAPHQL + GRPC', 'SANDBOX ROOMS'].map((chip) => (
              <span
                key={chip}
                className="rounded-lg border border-pulse/40 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-pulse/90"
              >
                {chip}
              </span>
            ))}
          </motion.div>
        </div>

        {/* code window */}
        <motion.div
          ref={winRef}
          initial={{ x: 64, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          className="relative"
        >
          <div aria-hidden="true" className="absolute -inset-6 rounded-full bg-pulse/10 blur-[70px]" />
          <div className="glass glass-sheen relative rounded-2xl">
            <HudFrame />
            {/* tab row + copy */}
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
              <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="SDK language">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => switchTab(t.id)}
                    className={cn(
                      'rounded-md px-2.5 py-1.5 font-mono text-[0.68rem] tracking-[0.12em] transition-colors duration-300',
                      tab === t.id ? 'bg-pulse/15 text-ghost' : 'text-smoke hover:text-mist',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={copy}
                aria-label="Copy snippet"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-mist transition-colors duration-300 hover:border-wave hover:text-wave"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-wave" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            {/* code body */}
            <div className="relative min-h-[248px] p-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.pre
                  key={tab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="whitespace-pre-wrap font-mono text-[0.8rem] leading-[1.75]"
                >
                  <code>
                    {highlight(shown, tab)}
                    {!done && <span className="animate-caret-blink text-wave">▍</span>}
                  </code>
                </motion.pre>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between border-t border-line px-5 py-2.5">
              <span className="font-mono text-[0.62rem] tracking-[0.18em] text-smoke">@MANOSLI/SDK — v4.2.0</span>
              <span className="font-mono text-[0.62rem] tracking-[0.18em] text-smoke">UTF-8 · LF</span>
            </div>
          </div>
        </motion.div>
      </div>

      <Toast toast={toast} />
    </section>
  )
}
