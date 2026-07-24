import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, RotateCcw, WifiOff } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO, EASE_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

type ChipKind = 'intent' | 'context' | 'mood'

const KIND_STYLE: Record<ChipKind, { border: string; text: string; underline: string }> = {
  intent: { border: 'border-pulse/70', text: 'text-pulse', underline: '#7C5CFF' },
  context: { border: 'border-wave/60', text: 'text-wave', underline: '#2EE6D6' },
  mood: { border: 'border-beat/60', text: 'text-beat', underline: '#FF3D8A' },
}

interface ParseChip {
  label: string
  kind: ChipKind
  /** index of the sentence token this chip was classified from (derived chips have none) */
  tokenIdx?: number
}

interface Command {
  sentence: string
  /** sentence split into display tokens; tokenCls[i] = chip index classifying that token */
  tokens: string[]
  tokenCls: (number | null)[]
  chips: ParseChip[]
  result: string
  ms: number
}

const COMMANDS: Command[] = [
  {
    sentence: 'Play something for a rainy run',
    tokens: ['Play', 'something', 'for', 'a', 'rainy', 'run'],
    tokenCls: [0, null, null, null, 1, 2],
    chips: [
      { label: 'INTENT: PLAY', kind: 'intent', tokenIdx: 0 },
      { label: 'CONTEXT: WEATHER=RAIN', kind: 'context', tokenIdx: 4 },
      { label: 'CONTEXT: ACTIVITY=RUN', kind: 'context', tokenIdx: 5 },
      { label: 'MOOD: +ENERGY', kind: 'mood' },
    ],
    result: 'Queue adjusted — 14 tracks, 168 BPM avg, no uploads. Parsed in 11ms.',
    ms: 11,
  },
  {
    sentence: 'Skip anything with vocals for an hour',
    tokens: ['Skip', 'anything', 'with', 'vocals', 'for', 'an', 'hour'],
    tokenCls: [0, null, 1, 1, 2, 2, 2],
    chips: [
      { label: 'INTENT: SKIP', kind: 'intent', tokenIdx: 0 },
      { label: 'FILTER: VOCALS=NONE', kind: 'context', tokenIdx: 3 },
      { label: 'DURATION: 1H', kind: 'context', tokenIdx: 6 },
    ],
    result: 'Filter armed — vocals skipped until 22:47, then the mix resumes. Parsed in 9ms.',
    ms: 9,
  },
  {
    sentence: 'Turn this into a room with Maya',
    tokens: ['Turn', 'this', 'into', 'a', 'room', 'with', 'Maya'],
    tokenCls: [0, 0, 0, 0, 0, 1, 1],
    chips: [
      { label: 'INTENT: OPEN ROOM', kind: 'intent', tokenIdx: 0 },
      { label: 'SOCIAL: +MAYA', kind: 'mood', tokenIdx: 6 },
      { label: 'CONTEXT: SOURCE=CURRENT QUEUE', kind: 'context' },
    ],
    result: 'Room live — invite sent to Maya, queue carries over. Parsed in 13ms.',
    ms: 13,
  },
  {
    sentence: 'Wind me down in 30 minutes',
    tokens: ['Wind', 'me', 'down', 'in', '30', 'minutes'],
    tokenCls: [0, 0, 0, 1, 1, 1],
    chips: [
      { label: 'INTENT: WIND-DOWN', kind: 'intent', tokenIdx: 0 },
      { label: 'DURATION: 30 MIN', kind: 'context', tokenIdx: 4 },
      { label: 'MOOD: −ENERGY', kind: 'mood' },
    ],
    result: 'Night arc queued — a 30-minute descent into sleep pressure. Parsed in 10ms.',
    ms: 10,
  },
]

type Phase = 'idle' | 'listening' | 'typing' | 'parsing' | 'done'

/** Experience §4 — offline voice NLU console ("Say it. Play it.") */
export default function VoiceConsole() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [cmdIdx, setCmdIdx] = useState(0)
  const [typed, setTyped] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [runId, setRunId] = useState(0)
  const timersRef = useRef<number[]>([])

  const cmd = COMMANDS[cmdIdx]

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms))
  }, [])

  const run = useCallback(
    (idx: number) => {
      clearTimers()
      const command = COMMANDS[idx]
      setCmdIdx(idx)
      setTyped(0)
      setRevealed(0)
      setRunId((r) => r + 1)
      setPhase('listening')

      // mic "listens" for 1.2s, then the sentence types out at 18ms/char
      later(() => {
        setPhase('typing')
        const total = command.sentence.length
        for (let i = 1; i <= total; i++) {
          later(() => setTyped(i), i * 18)
        }
        // then tokens classify sequentially into intent/entity chips
        later(
          () => {
            setPhase('parsing')
            command.chips.forEach((_, ci) => {
              later(() => setRevealed(ci + 1), ci * 420)
            })
            later(() => setPhase('done'), command.chips.length * 420 + 150)
          },
          total * 18 + 250,
        )
      }, 1200)
    },
    [clearTimers, later],
  )

  const reset = useCallback(() => {
    clearTimers()
    setPhase('idle')
    setTyped(0)
    setRevealed(0)
  }, [clearTimers])

  const listening = phase === 'listening'
  const busy = phase === 'listening' || phase === 'typing' || phase === 'parsing'

  return (
    <section className="relative bg-abyss py-20 lg:py-28">
      {/* scoped keyframes: mic idle ring + listening spectrum ring */}
      <style>{`
        @keyframes xp-mic-ring { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes xp-vu { 0%,100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
        .xp-mic-ring { animation: xp-mic-ring 2.4s ease-out infinite; }
        .xp-vu-bar { animation: xp-vu 0.7s ease-in-out infinite; transform-origin: center; }
      `}</style>

      <div className="mx-auto max-w-3xl px-6 text-center lg:px-0">
        <SectionHeader
          eyebrow="SYS.03 // OFFLINE VOICE"
          title={['SAY IT. PLAY IT.']}
          accentWords={['PLAY']}
          align="center"
          accentDot="bg-wave"
          lede="A full NLU stack lives on your device. Commands parse locally in milliseconds — on a plane, in a tunnel, off the grid."
        />

        {/* voice console */}
        <div className="glass glass-sheen mt-12 rounded-2xl p-6 text-left sm:p-10">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-smoke">VOICE CONSOLE</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-wave/50 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-wave">
                <WifiOff className="h-3.5 w-3.5" />
                OFFLINE NLU
              </span>
              <AnimatePresence>
                {phase !== 'idle' && (
                  <motion.button
                    key="replay"
                    type="button"
                    aria-label="Reset the voice console"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    onClick={reset}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-mist transition-colors duration-300 hover:border-pulse hover:text-ghost"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* mic */}
          <div className="mt-8 flex flex-col items-center">
            <motion.button
              type="button"
              aria-label={listening ? 'Listening…' : 'Activate the microphone'}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ duration: 0.6, ease: EASE_SPRING }}
              onClick={() => {
                if (!busy) run(cmdIdx)
              }}
              className={cn(
                'relative flex h-24 w-24 items-center justify-center rounded-full border transition-colors duration-300',
                listening ? 'border-pulse' : 'border-line hover:border-pulse/60',
              )}
            >
              {/* idle slow pulse ring */}
              {!busy && <span aria-hidden="true" className="xp-mic-ring absolute inset-0 rounded-full border border-pulse/50" />}
              {/* listening spectrum ring */}
              {listening && (
                <span aria-hidden="true" className="absolute -inset-4">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute left-1/2 top-1/2 h-3 w-[2px]"
                      style={{ transform: `rotate(${(i / 28) * 360}deg) translateY(-56px)` }}
                    >
                      <span
                        className="xp-vu-bar block h-full w-full rounded-full bg-aurora"
                        style={{ animationDelay: `${(i % 7) * 0.09}s` }}
                      />
                    </span>
                  ))}
                </span>
              )}
              <Mic className={cn('h-8 w-8 transition-colors duration-300', listening ? 'text-pulse' : 'text-ghost')} />
            </motion.button>
            <p className="mt-4 font-mono text-[0.8125rem] uppercase tracking-[0.22em] text-smoke">
              {listening ? 'LISTENING…' : busy ? 'PARSING ON-DEVICE…' : 'TAP THE MIC OR A COMMAND'}
            </p>
          </div>

          {/* example command chips */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {COMMANDS.map((c, i) => (
              <motion.button
                key={c.sentence}
                type="button"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-15%' }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: EASE_OUT_EXPO }}
                disabled={busy}
                onClick={() => run(i)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm transition-all duration-300 disabled:cursor-default',
                  i === cmdIdx && phase !== 'idle'
                    ? 'border-pulse/70 bg-pulse/10 text-ghost'
                    : 'border-line text-mist hover:border-pulse/50 hover:text-ghost disabled:opacity-60',
                )}
              >
                “{c.sentence}”
              </motion.button>
            ))}
          </div>

          {/* parse visualization */}
          <div className="mt-8 min-h-[13rem] border-t border-line/60 pt-6">
            <AnimatePresence mode="wait">
              {phase === 'idle' ? (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center font-mono text-[0.8125rem] leading-[1.5] tracking-[0.04em] text-smoke"
                >
                  NO SIGNAL LEAVES THE DEVICE. PICK A COMMAND TO WATCH IT PARSE.
                </motion.p>
              ) : (
                <motion.div
                  key={`run-${runId}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* typed sentence with per-token classification underlines */}
                  <p className="text-center text-lg leading-[1.7] text-ghost sm:text-xl">
                    {cmd.tokens.map((token, ti) => {
                      const chipIdx = cmd.tokenCls[ti]
                      const classified = chipIdx !== null && chipIdx < revealed
                      const chip = chipIdx !== null ? cmd.chips[chipIdx] : null
                      // how much of the full sentence has typed out so far
                      const charStart = cmd.tokens.slice(0, ti).reduce((sum, t) => sum + t.length + 1, 0)
                      const visible = typed > charStart
                      return (
                        <span key={ti}>
                          <span
                            className={cn('inline-block border-b-2 transition-colors duration-300')}
                            style={{
                              borderColor: classified && chip ? KIND_STYLE[chip.kind].underline : 'transparent',
                              color: classified ? '#F5F2FB' : undefined,
                            }}
                          >
                            {visible ? token : ' '}
                          </span>
                          {ti < cmd.tokens.length - 1 ? ' ' : ''}
                        </span>
                      )
                    })}
                  </p>

                  {/* intent / entity chips pop in */}
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <AnimatePresence>
                      {cmd.chips.slice(0, revealed).map((chip, ci) => (
                        <motion.span
                          key={chip.label}
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.35, delay: ci * 0.09, ease: EASE_SPRING }}
                          className={cn(
                            'rounded-lg border bg-void/40 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em]',
                            KIND_STYLE[chip.kind].border,
                            KIND_STYLE[chip.kind].text,
                          )}
                        >
                          {chip.label}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* result card */}
                  <AnimatePresence>
                    {phase === 'done' && (
                      <motion.div
                        key="result"
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                        className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-xl border border-line border-l-[3px] border-l-wave bg-panel/60 px-5 py-4"
                      >
                        <p className="text-sm leading-[1.65] text-mist">{cmd.result}</p>
                        <span className="rounded-lg border border-wave/50 px-3 py-1 font-mono text-[0.8125rem] tracking-[0.04em] text-wave">
                          WORKS OFFLINE
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
