import { Fragment, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Cell = boolean | string

interface Group {
  name: string
  rows: [string, Cell, Cell, Cell, Cell][]
}

const GROUPS: Group[] = [
  {
    name: 'SOUND',
    rows: [
      ['Lossless audio', false, true, true, true],
      ['Spatial audio', false, true, true, true],
      ['Gapless playback', true, true, true, true],
    ],
  },
  {
    name: 'INTELLIGENCE',
    rows: [
      ['On-device Mood Engine', true, true, true, true],
      ['Offline voice control', false, true, true, true],
      ['Blends with friends', false, true, true, true],
    ],
  },
  {
    name: 'SOCIAL',
    rows: [
      ['Join rooms', true, true, true, true],
      ['Host rooms', false, true, true, true],
      ['Live stages', false, true, true, true],
    ],
  },
  {
    name: 'DATA',
    rows: [
      ['Personal vault', true, true, true, true],
      ['Library export', true, true, true, true],
      ['E2EE sync', false, true, true, true],
      ['Devices in sync', '1', '∞', '6×∞', '∞'],
    ],
  },
]

const COLUMNS = ['FREE', 'PLUS', 'FAMILY', 'FOUNDERS']
const NO_TRACKING: [string, Cell, Cell, Cell, Cell] = ['NO TRACKING, EVER', true, true, true, true]

function CellValue({ cell, amber = false }: { cell: Cell; amber?: boolean }) {
  if (cell === true)
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5, color: '#2EE6D6' }}
        animate={{ opacity: 1, scale: 1, color: amber ? '#FFB224' : '#F5F2FB' }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="inline-flex"
      >
        <Check className="h-4 w-4" />
      </motion.span>
    )
  if (cell === false) return <span className="text-line">—</span>
  return <span className={cn('font-bold tabular-nums', amber ? 'text-spark' : 'text-ghost')}>{cell}</span>
}

function Row({ row, index, amber = false }: { row: [string, Cell, Cell, Cell, Cell]; index: number; amber?: boolean }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: EASE_OUT_EXPO }}
      className={cn('border-b border-line/50', amber && 'bg-spark/5')}
    >
      <td className={cn('py-3 pr-4 text-left font-medium', amber ? 'text-spark' : 'text-mist')}>{row[0]}</td>
      {[1, 2, 3, 4].map((c) => (
        <td key={c} className="py-3 text-center">
          <CellValue cell={row[c] as Cell} amber={amber} />
        </td>
      ))}
    </motion.tr>
  )
}

/** Download §4 — collapsible feature comparison */
export default function CompareTable() {
  const [open, setOpen] = useState(false)
  let rowIndex = 0

  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-12">
        <div className="overflow-hidden rounded-2xl border border-line bg-panel/40">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left"
          >
            <span className="font-sans text-lg font-medium text-ghost">Compare every feature</span>
            <Plus
              className={cn(
                'h-5 w-5 shrink-0 text-mist transition-transform duration-300',
                open && 'rotate-45 text-ghost',
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="table"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 170, damping: 26 }}
                className="overflow-hidden"
              >
                <div className="overflow-x-auto px-7 pb-7">
                  <table className="w-full min-w-[560px] font-mono text-[0.78rem] tracking-[0.02em]">
                    <thead>
                      <tr className="border-b border-line text-smoke">
                        <th className="py-3 pr-4 text-left font-medium tracking-[0.14em]">FEATURE</th>
                        {COLUMNS.map((c) => (
                          <th key={c} className="py-3 text-center font-medium tracking-[0.14em]">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {GROUPS.map((g) => (
                        <Fragment key={g.name}>
                          <tr>
                            <td colSpan={5} className="pb-2 pt-5 text-[0.68rem] font-bold tracking-[0.22em] text-smoke">
                              {g.name}
                            </td>
                          </tr>
                          {g.rows.map((r) => (
                            <Row key={r[0]} row={r} index={rowIndex++} />
                          ))}
                        </Fragment>
                      ))}
                      <Row row={NO_TRACKING} index={rowIndex++} amber />
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
