import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  Smartphone,
  TabletSmartphone,
  Globe,
  Glasses,
  ArrowLeftRight,
  AudioWaveform,
  BrainCircuit,
  GitMerge,
  Route as RouteIcon,
  Network,
  ShieldCheck,
  Lock,
  type LucideIcon,
} from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO, EASE_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* ---------- diagram model (1200 × 560 coordinate space) ---------- */

interface NodeSpec {
  id: string
  col: 'clients' | 'edge' | 'core' | 'planes'
  x: number
  y: number
  w: number
  h: number
  icon: LucideIcon
  name: string
  sub: string
  desc: string
  specs: string[]
}

const CLIENT_YS = [40, 175, 310, 445]

const NODES: NodeSpec[] = [
  // CLIENTS
  {
    id: 'ios', col: 'clients', x: 30, y: CLIENT_YS[0], w: 180, h: 64, icon: Smartphone,
    name: 'SwiftUI · iOS', sub: 'CLIENT',
    desc: 'Native SwiftUI client. The Rust core runs embedded — same engine, no bridge tax.',
    specs: ['embedded core', 'metal DSP', '60fps UI'],
  },
  {
    id: 'android', col: 'clients', x: 30, y: CLIENT_YS[1], w: 180, h: 64, icon: TabletSmartphone,
    name: 'Jetpack Compose · Android', sub: 'CLIENT',
    desc: 'Compose UI over the same Rust core via JNI. One behavior spec, two platforms.',
    specs: ['JNI bridge', 'AAudio low-latency', '90hz ready'],
  },
  {
    id: 'web', col: 'clients', x: 30, y: CLIENT_YS[2], w: 180, h: 64, icon: Globe,
    name: 'React · Web', sub: 'CLIENT',
    desc: 'The web build runs the very same core as WebAssembly. No JavaScript in the signal chain.',
    specs: ['WASM core', 'AudioWorklet', 'one codebase'],
  },
  {
    id: 'arvr', col: 'clients', x: 30, y: CLIENT_YS[3], w: 180, h: 64, icon: Glasses,
    name: 'AR · VR Runtimes', sub: 'CLIENT',
    desc: 'Spatial scenes call the same engine. Head-tracked DSP at native rate.',
    specs: ['90hz DSP', 'OpenXR', 'head-tracked'],
  },
  // EDGE
  {
    id: 'bus', col: 'edge', x: 460, y: 245, w: 280, h: 70, icon: ArrowLeftRight,
    name: 'gRPC bi-di streams · HTTP/2', sub: 'EDGE',
    desc: 'One persistent stream per session. State, votes, presence, handoff — both directions, no polling.',
    specs: ['HTTP/2 · QUIC', 'protobuf', '0 polls'],
  },
  // CORE (Rust)
  {
    id: 'playback', col: 'core', x: 790, y: CLIENT_YS[0], w: 200, h: 64, icon: AudioWaveform,
    name: 'Playback Engine', sub: 'CORE · RUST',
    desc: 'Sample-accurate decode + gapless in Rust, compiled to WASM for the web build.',
    specs: ['decode <90ms', 'gapless ±0 samples', '0 copies buffer path'],
  },
  {
    id: 'personalization', col: 'core', x: 790, y: CLIENT_YS[1], w: 200, h: 64, icon: BrainCircuit,
    name: 'Personalization (WASM)', sub: 'CORE · RUST',
    desc: 'Your models, your device. Mood + taste inference runs locally, in WASM on the web.',
    specs: ['INT8 nets', '6ms infer', '0 data leaves'],
  },
  {
    id: 'sync', col: 'core', x: 790, y: CLIENT_YS[2], w: 200, h: 64, icon: GitMerge,
    name: 'Sync Fabric', sub: 'CORE · RUST',
    desc: 'CRDT-based multi-device state. Merges offline edits without conflicts or a server round-trip.',
    specs: ['CRDT-based', '<40ms p50', 'offline-first merge'],
  },
  {
    id: 'catalog', col: 'core', x: 790, y: CLIENT_YS[3], w: 200, h: 64, icon: RouteIcon,
    name: 'Catalog Router', sub: 'CORE · RUST',
    desc: 'Content-addressed. Every track resolves by CID across IPFS + edge cache.',
    specs: ['CIDv1', 'multi-route race', '99.99% hit'],
  },
  // PLANES
  {
    id: 'ipfs', col: 'planes', x: 1010, y: 100, w: 170, h: 64, icon: Network,
    name: 'IPFS · decentralized storage', sub: 'PLANE',
    desc: 'Metadata + artwork pinned across a distributed network with edge acceleration.',
    specs: ['content-addressed', 'no region locks', 'verifiable'],
  },
  {
    id: 'federated', col: 'planes', x: 1010, y: 280, w: 170, h: 64, icon: ShieldCheck,
    name: 'Federated aggregator (E2EE)', sub: 'PLANE',
    desc: 'Sees encrypted gradient updates. Never sees a play event.',
    specs: ['secure agg', 'diff-privacy ε=2.1', '24h cycles'],
  },
  {
    id: 'vault', col: 'planes', x: 1010, y: 460, w: 170, h: 64, icon: Lock,
    name: 'On-device data vault', sub: 'PLANE',
    desc: 'AES-256-GCM at rest, keys in the secure enclave. Never uploaded.',
    specs: ['AES-256-GCM', 'enclave keys', 'local-only'],
  },
]

const CY = (n: NodeSpec) => n.y + n.h / 2

interface EdgeSpec {
  id: string
  d: string
  from: string
  to: string
}

const EDGES: EdgeSpec[] = (() => {
  const edges: EdgeSpec[] = []
  const clients = NODES.filter((n) => n.col === 'clients')
  const core = NODES.filter((n) => n.col === 'core')
  const bus = NODES.find((n) => n.id === 'bus')!
  for (const c of clients) {
    edges.push({
      id: `e-${c.id}-bus`, from: c.id, to: 'bus',
      d: `M ${c.x + c.w} ${CY(c)} C 330 ${CY(c)}, 360 ${CY(bus)}, ${bus.x} ${CY(bus)}`,
    })
  }
  for (const c of core) {
    edges.push({
      id: `e-bus-${c.id}`, from: 'bus', to: c.id,
      d: `M ${bus.x + bus.w} ${CY(bus)} C 765 ${CY(bus)}, 765 ${CY(c)}, ${c.x} ${CY(c)}`,
    })
  }
  const link = (coreId: string, planeId: string) => {
    const a = NODES.find((n) => n.id === coreId)!
    const b = NODES.find((n) => n.id === planeId)!
    edges.push({
      id: `e-${coreId}-${planeId}`, from: coreId, to: planeId,
      d: `M ${a.x + a.w} ${CY(a)} C 1000 ${CY(a)}, 1000 ${CY(b)}, ${b.x} ${CY(b)}`,
    })
  }
  link('catalog', 'ipfs')
  link('personalization', 'federated')
  link('sync', 'vault')
  return edges
})()

/* bidirectional arrow path inside the bus */
const BUS_Y = CY(NODES.find((n) => n.id === 'bus')!)

/* ---------- component ---------- */

export default function Architecture() {
  const panelRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const inView = useInView(panelRef, { once: true, margin: '-20% 0px' })
  const reduced = useReducedMotion()
  const [active, setActive] = useState<NodeSpec | null>(null)
  const [packetsOn, setPacketsOn] = useState(false)

  // packets begin after edges have drawn
  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setPacketsOn(true), 2400)
    return () => clearTimeout(t)
  }, [inView])

  // pause SMIL packet animation offscreen / under reduced motion
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    if (reduced) {
      svg.pauseAnimations()
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations()),
      { threshold: 0.05 },
    )
    io.observe(svg)
    return () => io.disconnect()
  }, [reduced, packetsOn])

  const nodeById = useMemo(() => new Map(NODES.map((n) => [n.id, n])), [])

  const edgeState = (e: EdgeSpec) => {
    if (!active) return 'idle'
    return e.from === active.id || e.to === active.id ? 'hot' : 'dim'
  }

  const chip = (n: NodeSpec, i: number) => {
    const Icon = n.icon
    const isActive = active?.id === n.id
    return (
      <motion.button
        key={n.id}
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.15 + i * 0.06, ease: EASE_OUT_EXPO }}
        onMouseEnter={() => setActive(n)}
        onFocus={() => setActive(n)}
        onClick={() => setActive(n)}
        className={cn(
          'glass glass-sheen absolute flex items-center gap-3 rounded-xl px-4 text-left transition-[border-color,box-shadow] duration-300',
          isActive ? 'border-wave/70 shadow-glow-wave' : 'hover:border-wave/40',
        )}
        style={{
          left: `${(n.x / 1200) * 100}%`,
          top: `${(n.y / 560) * 100}%`,
          width: `${(n.w / 1200) * 100}%`,
          height: `${(n.h / 560) * 100}%`,
        }}
      >
        <Icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-wave' : 'text-mist')} />
        <span className="min-w-0">
          <span className="block truncate font-mono text-[0.7rem] font-medium tracking-[0.02em] text-ghost">{n.name}</span>
          <span className="block font-mono text-[0.6rem] tracking-[0.18em] text-smoke">{n.sub}</span>
        </span>
      </motion.button>
    )
  }

  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.01 // TOPOLOGY"
          title={['ONE CORE.', 'EVERY SURFACE.']}
          accentWords={['CORE']}
          accentDot="bg-wave"
          lede="Four client surfaces, one Rust core, one stream between them. Hover a node to trace its connections."
        />

        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          className="glass glass-sheen relative mt-14 overflow-hidden rounded-3xl"
        >
          {/* ---------- desktop diagram ---------- */}
          <div className="relative hidden min-h-[560px] lg:block" onMouseLeave={() => setActive(null)}>
            {/* column labels */}
            {[
              ['CLIENTS', 30],['EDGE', 460],['CORE (RUST)', 790],['PLANES', 1010],
            ].map(([label, x]) => (
              <span
                key={label as string}
                className="absolute top-4 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke"
                style={{ left: `${((x as number) / 1200) * 100}%` }}
              >
                {label}
              </span>
            ))}

            {/* edges + packets */}
            <svg ref={svgRef} viewBox="0 0 1200 560" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
              {EDGES.map((e, i) => {
                const st = edgeState(e)
                return (
                  <motion.path
                    key={e.id}
                    d={e.d}
                    fill="none"
                    stroke={st === 'hot' ? '#2EE6D6' : 'rgba(255,255,255,0.14)'}
                    strokeWidth={st === 'hot' ? 2 : 1.5}
                    strokeDasharray={st === 'hot' ? 'none' : '5 6'}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={inView ? { pathLength: 1, opacity: st === 'dim' ? 0.25 : st === 'hot' ? 1 : 0.8 } : {}}
                    transition={{
                      pathLength: { duration: 0.8, delay: 0.5 + i * 0.1, ease: 'easeInOut' },
                      opacity: { duration: 0.3 },
                    }}
                    style={{ transition: 'stroke 0.3s' }}
                  />
                )
              })}
              {/* stream bus bidirectional arrows */}
              {packetsOn && (
                <>
                  <path id="bus-fwd" d={`M 480 ${BUS_Y} L 700 ${BUS_Y}`} fill="none" stroke="none" />
                  <path id="bus-bwd" d={`M 720 ${BUS_Y + 14} L 500 ${BUS_Y + 14}`} fill="none" stroke="none" />
                  <polygon points="0,-4 8,0 0,4" fill="#2EE6D6">
                    <animateMotion dur="1.8s" repeatCount="indefinite" rotate="auto">
                      <mpath href="#bus-fwd" />
                    </animateMotion>
                  </polygon>
                  <polygon points="0,-4 8,0 0,4" fill="#7C5CFF">
                    <animateMotion dur="1.8s" repeatCount="indefinite" rotate="auto">
                      <mpath href="#bus-bwd" />
                    </animateMotion>
                  </polygon>
                </>
              )}
              {/* traveling packets (4px wave dots, 2.4s loop, staggered) */}
              {packetsOn &&
                EDGES.map((e, i) => (
                  <circle key={`p-${e.id}`} r="2" fill="#2EE6D6">
                    <animateMotion dur="2.4s" begin={`${i * 0.35}s`} repeatCount="indefinite">
                      <mpath href={`#path-${e.id}`} />
                    </animateMotion>
                  </circle>
                ))}
              {/* invisible packet rails */}
              {packetsOn &&
                EDGES.map((e) => <path key={`path-${e.id}`} id={`path-${e.id}`} d={e.d} fill="none" stroke="none" />)}
            </svg>

            {/* nodes */}
            {NODES.map((n, i) => chip(n, i))}

            {/* detail card */}
            <AnimatePresence>
              {active && (
                <motion.aside
                  key={active.id}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 40, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  className="glass glass-sheen absolute bottom-4 right-4 top-4 z-10 w-[320px] rounded-2xl border-wave/30 p-6"
                >
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-wave">{active.sub}</p>
                  <h3 className="mt-2 font-sans text-xl font-bold text-ghost">{active.name}</h3>
                  <p className="mt-3 text-sm leading-[1.65] text-mist">{active.desc}</p>
                  <div className="mt-5 space-y-2 border-t border-line pt-4">
                    {active.specs.map((s) => (
                      <p key={s} className="flex items-center gap-2 font-mono text-[0.8125rem] tracking-[0.04em] text-ghost">
                        <span className="h-1 w-1 rounded-full bg-wave" />
                        {s}
                      </p>
                    ))}
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>

          {/* ---------- mobile stacked fallback ---------- */}
          <MobileDiagram active={active} setActive={setActive} nodeById={nodeById} />
        </motion.div>
      </div>
    </section>
  )
}

function MobileDiagram({
  active,
  setActive,
  nodeById,
}: {
  active: NodeSpec | null
  setActive: (n: NodeSpec | null) => void
  nodeById: Map<string, NodeSpec>
}) {
  const groups: [string, NodeSpec[]][] = [
    ['CLIENTS', NODES.filter((n) => n.col === 'clients')],
    ['EDGE', NODES.filter((n) => n.col === 'edge')],
    ['CORE (RUST)', NODES.filter((n) => n.col === 'core')],
    ['PLANES', NODES.filter((n) => n.col === 'planes')],
  ]
  return (
    <div className="p-5 lg:hidden">
      {groups.map(([label, nodes], gi) => (
        <div key={label}>
          {gi > 0 && (
            <div className="flex justify-center py-2" aria-hidden="true">
              <span className="h-6 w-[1px] bg-line" />
            </div>
          )}
          <p className="pb-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">{label}</p>
          <div className="grid gap-2">
            {nodes.map((n) => {
              const Icon = n.icon
              const isActive = active?.id === n.id
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setActive(isActive ? null : n)}
                  className={cn(
                    'glass flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
                    isActive && 'border-wave/70 shadow-glow-wave',
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-wave' : 'text-mist')} />
                  <span className="font-mono text-[0.75rem] tracking-[0.02em] text-ghost">{n.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <AnimatePresence>
        {active && nodeById.get(active.id) && (
          <motion.aside
            key={active.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, ease: EASE_SPRING }}
            className="glass glass-sheen mt-4 rounded-2xl border-wave/30 p-5"
          >
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-wave">{active.sub}</p>
            <h3 className="mt-1 font-sans text-lg font-bold text-ghost">{active.name}</h3>
            <p className="mt-2 text-sm leading-[1.65] text-mist">{active.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {active.specs.map((s) => (
                <span key={s} className="rounded-lg border border-line px-3 py-1 font-mono text-[0.7rem] text-mist">
                  {s}
                </span>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
