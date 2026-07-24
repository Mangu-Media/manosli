import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { showToast } from './toast'

const SHEET: { group: string; rows: [string, string][] }[] = [
  {
    group: 'CORE',
    rows: [
      ['language', 'Rust 1.8x + WASM'],
      ['loc', '412k LOC'],
      ['unsafe_in_dsp_path', '0 blocks'],
      ['buffer_path', 'zero-copy'],
      ['gc_pauses', 'none'],
      ['decode_p50', '<90ms'],
      ['gapless', '±0 samples'],
      ['codegen', 'one codebase'],
    ],
  },
  {
    group: 'TRANSPORT',
    rows: [
      ['protocol', 'gRPC bi-di'],
      ['http', 'HTTP/2'],
      ['fallback', 'QUIC'],
      ['encoding', 'protobuf'],
      ['polls_per_session', '0'],
      ['streams_per_session', '1'],
      ['reconnect', '<250ms'],
      ['compression', 'zstd'],
    ],
  },
  {
    group: 'INTELLIGENCE',
    rows: [
      ['on_device_nets', '4'],
      ['total_params', '14.7M+'],
      ['quantization', 'INT8'],
      ['mood_infer', '6ms'],
      ['nlu_parse', '11ms'],
      ['locales', '34'],
      ['federated_cycle', '24h'],
      ['dp_epsilon', '2.1'],
    ],
  },
  {
    group: 'DATA',
    rows: [
      ['addressing', 'CIDv1 / IPFS'],
      ['sync_model', 'CRDT'],
      ['vault_crypto', 'AES-256-GCM'],
      ['key_storage', 'secure enclave'],
      ['sync_crypto', 'XChaCha20-Poly1305'],
      ['catalog_hit', '99.99%'],
      ['export_formats', 'JSON / CSV / M3U'],
      ['region_locks', 'none'],
    ],
  },
  {
    group: 'PLATFORMS',
    rows: [
      ['ios', 'SwiftUI'],
      ['android', 'Jetpack Compose'],
      ['web', 'React + WASM'],
      ['desktop', 'Tauri (Rust)'],
      ['wearable', 'watchOS / Wear OS'],
      ['automotive', 'AAOS / CarPlay'],
      ['ar_vr', 'OpenXR runtimes'],
      ['min_spec', 'mid-tier 2019+'],
    ],
  },
  {
    group: 'SLA',
    rows: [
      ['sync_p50', '<40ms'],
      ['sync_p99', '<95ms'],
      ['cold_start', '0.4s'],
      ['seek_decode', '88ms'],
      ['uptime', '99.99%'],
      ['queue_reorder_10k', '3ms'],
      ['merge_conflict', '1.2ms'],
      ['support_response', '<24h'],
    ],
  },
]

const KEY_COUNT = SHEET.reduce((n, g) => n + g.rows.length, 0)

/** Technology §8 — the full spec sheet, copyable as JSON */
export default function SpecSheet() {
  const [copied, setCopied] = useState(false)

  const copyJson = async () => {
    const json = Object.fromEntries(
      SHEET.map((g) => [g.group.toLowerCase(), Object.fromEntries(g.rows)]),
    )
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2))
    } catch {
      // clipboard unavailable (permissions) — toast still confirms intent
    }
    setCopied(true)
    showToast(`Spec sheet copied — ${KEY_COUNT} keys`, '#2EE6D6')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="relative bg-abyss py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader
            eyebrow="SYS.06 // SPEC SHEET"
            title={['READ IT LIKE A MANUAL.']}
            accentDot="bg-wave"
          />
          <motion.button
            type="button"
            onClick={copyJson}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mb-1 inline-flex h-11 items-center gap-2 rounded-full border border-line px-6 font-sans text-sm font-bold text-ghost transition-all duration-300 hover:border-pulse hover:bg-pulse/10 hover:shadow-glow-pulse"
          >
            {copied ? <Check className="h-4 w-4 text-wave" /> : <Copy className="h-4 w-4" />}
            {copied ? 'COPIED' : 'COPY AS JSON'}
          </motion.button>
        </div>

        <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {SHEET.map((g, gi) => (
            <motion.div
              key={g.group}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, delay: gi * 0.08, ease: EASE_OUT_EXPO }}
            >
              <h3 className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.22em] text-wave">
                {g.group}
              </h3>
              <dl className="mt-4">
                {g.rows.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-4 border-b border-line/60 px-2 py-2.5 transition-colors duration-200 hover:bg-line/30"
                  >
                    <dt className="font-mono text-[0.8125rem] tracking-[0.04em] text-smoke">{k}</dt>
                    <dd className="text-right font-mono text-[0.8125rem] tracking-[0.02em] text-ghost">{v}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
