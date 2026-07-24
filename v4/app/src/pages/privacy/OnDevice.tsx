import { useState } from 'react'
import { motion } from 'framer-motion'
import { HardDrive, Download, Trash2, type LucideIcon } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import PrivacyModal from './PrivacyModal'
import { showToast } from '@/pages/technology/toast'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface Feature {
  icon: LucideIcon
  title: string
  body: string
  action: 'export' | 'delete' | null
  actionLabel?: string
}

const FEATURES: Feature[] = [
  {
    icon: HardDrive,
    title: 'LOCAL-FIRST LIBRARY',
    body: 'Your entire index, history, and playlists live on-device. Full app, airplane mode, no apologies.',
    action: null,
  },
  {
    icon: Download,
    title: 'EXPORT EVERYTHING',
    body: "One tap exports your data in open formats — JSON, CSV, M3U. It's yours; leaving should be easy.",
    action: 'export',
    actionLabel: 'Export my data',
  },
  {
    icon: Trash2,
    title: 'DELETE LIKE IT NEVER HAPPENED',
    body: 'Account deletion wipes the vault and orphans your encrypted blobs — unreadable, unrecoverable, gone.',
    action: 'delete',
    actionLabel: 'See how',
  },
]

const DELETE_STEPS = [
  ['vault.wipe()', 'Local keys destroyed. The vault is unreadable instantly — before anything network-side happens.'],
  ['blob.orphan()', 'Your encrypted sync blobs are detached from the account. No key exists anywhere to read them.'],
  ['account.close()', 'Salted credential hashes purged within 24h. What remains is noise with no owner.'],
]

/** Privacy §5 — on-device, by default */
export default function OnDevice() {
  const [exporting, setExporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const runExport = () => {
    if (exporting) return
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      showToast('Preparing export… done. 42,118 events, 0 shared.', '#2EE6D6')
    }, 1400)
  }

  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <SectionHeader
          eyebrow="SYS.LOCAL // DEFAULTS"
          title={['ON-DEVICE,', 'BY DEFAULT.']}
          accentWords={['DEFAULT']}
          accentDot="bg-wave"
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 56 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-15%' }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: EASE_OUT_EXPO }}
                className="glass glass-sheen flex flex-col rounded-2xl p-7 transition-all duration-[450ms] hover:-translate-y-1.5 hover:border-wave/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line">
                  <Icon className="h-5 w-5 text-wave" />
                </span>
                <h3 className="mt-5 font-sans text-lg font-bold tracking-[0.02em] text-ghost">{f.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-[1.7] text-mist">{f.body}</p>

                {f.action === 'export' && (
                  <button
                    type="button"
                    onClick={runExport}
                    disabled={exporting}
                    className={cn(
                      'group relative mt-6 inline-flex h-11 items-center justify-center overflow-hidden rounded-full border font-sans text-sm font-bold transition-all duration-300',
                      exporting
                        ? 'border-wave/60 text-wave'
                        : 'border-line text-ghost hover:border-wave hover:bg-wave/10 hover:shadow-glow-wave',
                    )}
                  >
                    {exporting ? 'PREPARING…' : f.actionLabel}
                    {exporting && (
                      <motion.span
                        className="pointer-events-none absolute inset-y-0 left-0 w-[60px] bg-wave/25 blur-sm"
                        initial={{ x: -60 }}
                        animate={{ x: 320 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </button>
                )}
                {f.action === 'delete' && (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-line font-sans text-sm font-bold text-ghost transition-all duration-300 hover:border-beat hover:bg-beat/10 hover:shadow-glow-beat"
                  >
                    {f.actionLabel}
                  </button>
                )}
              </motion.article>
            )
          })}
        </div>
      </div>

      <PrivacyModal open={deleteOpen} onClose={() => setDeleteOpen(false)} eyebrow="DELETE.PROTOCOL" title="Gone, in three steps.">
        <ol className="space-y-5">
          {DELETE_STEPS.map(([cmd, desc], i) => (
            <li key={cmd} className="flex gap-4">
              <span className="font-mono text-sm text-smoke font-tabular">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="font-mono text-sm font-bold tracking-[0.04em] text-beat">{cmd}</p>
                <p className="mt-1 text-sm leading-[1.6] text-mist">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t border-line pt-4 font-mono text-[0.7rem] tracking-[0.06em] text-smoke">
          NO RECOVERY EMAIL. NO 30-DAY LIMBO. GONE MEANS GONE.
        </p>
      </PrivacyModal>
    </section>
  )
}
