import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, FileText } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import PrivacyModal from './PrivacyModal'
import { EASE_OUT_EXPO } from '@/lib/motion'

const ROWS: [string, string, string][] = [
  ['crash.report', 'stack_trace, build, device_class', 'CRASH REPORTS'],
  ['perf.decode', 'codec, p50_ms, build', 'PERFORMANCE'],
  ['perf.frame', 'fps, dropped, thermal_state', 'PERFORMANCE'],
  ['perf.battery', 'ma_draw, screen_on', 'PERFORMANCE'],
  ['funnel.screen_view', 'screen_id, session_len', 'USAGE FUNNELS'],
  ['sync.health', 'bytes_up, bytes_down, rtt_ms', 'ALWAYS ON'],
  ['room.latency', 'region, rtt_ms, peer_count', 'ALWAYS ON'],
  ['update.success', 'from_ver, to_ver, duration_s', 'ALWAYS ON'],
]

/** Privacy §6 — the telemetry manifest: every event, field by field */
export default function Manifest() {
  const [auditOpen, setAuditOpen] = useState(false)

  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.03 // OPEN LEDGER"
          title={["IF IT'S NOT ON THIS LIST,", "IT DOESN'T EXIST."]}
          accentWords={['LIST']}
          accentDot="bg-spark"
          lede="The complete telemetry manifest. Eight events. Every field named. Every one of them anonymous."
        />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="glass glass-sheen mt-14 overflow-hidden rounded-3xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[0.65rem] uppercase tracking-[0.22em] text-smoke">
                  <th className="px-6 py-4 font-medium">EVENT</th>
                  <th className="px-6 py-4 font-medium">FIELDS</th>
                  <th className="px-6 py-4 font-medium">IDENTIFIABLE?</th>
                  <th className="px-6 py-4 font-medium">SWITCH</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([event, fields, sw], i) => (
                  <motion.tr
                    key={event}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.3, delay: i * 0.15, ease: 'easeOut' }}
                    className="border-b border-line/50 transition-colors duration-200 hover:bg-line/30"
                  >
                    <td className="px-6 py-3.5 font-mono text-[0.8125rem] tracking-[0.04em] text-ghost">{event}</td>
                    <td className="px-6 py-3.5 font-mono text-[0.75rem] tracking-[0.04em] text-mist">{fields}</td>
                    <td className="px-6 py-3.5">
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 0.3, delay: i * 0.15 + 0.2 }}
                        className="inline-flex items-center gap-1.5 font-mono text-[0.8125rem] font-bold tracking-[0.08em] text-wave"
                      >
                        <Check className="h-3.5 w-3.5" />
                        NO
                      </motion.span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[0.7rem] tracking-[0.08em] text-smoke">{sw}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <p className="font-mono text-[0.7rem] tracking-[0.08em] text-smoke">
              LAST AUDIT: INDEPENDENT, THIS QUARTER
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setAuditOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-spark/50 px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.08em] text-spark transition-colors duration-300 hover:bg-spark/10"
              >
                <FileText className="h-3.5 w-3.5" />
                READ THE AUDIT LETTER
              </button>
              <span className="font-mono text-[0.7rem] tracking-[0.08em] text-smoke">
                SHA-256 OF THIS MANIFEST: <span className="text-mist font-tabular">9f2c…77ab</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <PrivacyModal open={auditOpen} onClose={() => setAuditOpen(false)} eyebrow="AUDIT // EXCERPT" title="Independent audit letter">
        <div className="space-y-4 font-mono text-[0.8125rem] leading-[1.7] text-mist">
          <p>
            "We reviewed the telemetry pipeline of manosli+ client v4.2.0 against the published manifest
            (SHA-256 9f2c…77ab). Network capture across 14 days and 3 platforms matches the eight documented events.
            No undocumented fields, no fingerprintable identifiers, no content metadata were observed."
          </p>
          <p>
            "The 'personalized ads' flag is absent from the client binary entirely, consistent with a hard-coded
            negative. Differential privacy parameters (ε=2.1) are applied server-side as documented."
          </p>
          <p className="border-t border-line pt-4 text-smoke">
            — MERIDIAN SECURITY COLLECTIVE, Q3 AUDIT · FULL LETTER SHIPS IN THE PRESS KIT
          </p>
        </div>
      </PrivacyModal>
    </section>
  )
}
