import { useMemo, useState } from 'react'
import { ChevronDown, CirclePlus, Copy, Download, FileSpreadsheet, Rows3, SlidersHorizontal, X } from 'lucide-react'
import { AppShell } from '@/components/portal/AppShell'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { buildPipeline } from '@/data/claims'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useClaims } from '@/pages/Claims'

const toolbarBtn = 'flex h-[35px] items-center gap-2 rounded-[8px] border border-[#e5e5e5] bg-white px-3 text-[13px] font-medium hover:bg-[#fafafa]'

/** Pipeline, copied from today's portal (PL1, PL2 filtered to one room). No redesign. */
export default function Pipeline() {
  const { tasks, showToast } = useStore()
  const claims = useClaims()
  const all = useMemo(() => buildPipeline(tasks, claims), [tasks, claims])
  const [view, setView] = useState<'table' | 'analytics'>('table')
  const [maxDays, setMaxDays] = useState('2')
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const rows = all.filter((r) => !query || r.roomId.includes(query))
  const copy = (v: string) => {
    navigator.clipboard?.writeText(v).catch(() => {})
    showToast('Room ID copied')
  }

  return (
    <AppShell changes={[]} crumbs={[{ label: 'Pipeline' }]}>
      <div className="flex h-full flex-col gap-2 px-[10px] pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-[8px] border border-[#e5e5e5] bg-[#f5f5f5] p-[3px]">
            {(['table', 'analytics'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn('h-[27px] rounded-[6px] px-2.5 text-[12.5px] capitalize', view === v ? 'bg-white font-medium shadow-[0px_1px_2px_rgba(0,0,0,0.1)]' : 'text-[#737373]')}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <label className="flex items-center gap-2 text-[13px]">
            Max days
            <input
              value={maxDays}
              onChange={(e) => setMaxDays(e.target.value.replace(/\D/g, ''))}
              className="h-[35px] w-[46px] rounded-[8px] border border-[#e5e5e5] px-2 text-[13px] outline-none focus:border-[#a3a3a3]"
            />
          </label>
          <button className={toolbarBtn} onClick={() => showToast("Filters isn't part of this prototype")}>
            <SlidersHorizontal className="size-3.5" /> Filters
          </button>
          <label className="flex h-[35px] w-[172px] items-center gap-1 rounded-[8px] border border-[#e5e5e5] px-[10px] focus-within:border-[#a3a3a3]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by room id"
              className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label="Clear search" className="shrink-0">
                <X className="size-3.5" />
              </button>
            )}
          </label>
          <button className={toolbarBtn} onClick={() => showToast("Columns isn't part of this prototype")}>
            Columns <ChevronDown className="size-3.5" />
          </button>
          <button className={toolbarBtn} onClick={() => showToast("Download CSV isn't part of this prototype")}>
            <FileSpreadsheet className="size-3.5" /> Download CSV
          </button>
          <button className="flex size-[35px] items-center justify-center rounded-[8px] border border-[#e5e5e5] hover:bg-[#fafafa]" aria-label="Row density">
            <Rows3 className="size-3.5" />
          </button>
        </div>
        <div className="text-[12.5px] text-[#737373]">
          Showing <span className="font-semibold text-[#0a0a0a]">{rows.length}</span> {rows.length === 1 ? 'result' : 'results'}
        </div>

        {view === 'analytics' ? (
          <div className="flex flex-1 items-center justify-center rounded-[8px] border border-dashed border-[#e5e5e5] text-[12.5px] text-[#737373]">
            Analytics isn't part of this prototype.
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto rounded-[8px] border border-[#e5e5e5]">
            <table className="w-full min-w-[900px] text-[12px] whitespace-nowrap">
              <thead className="sticky top-0 bg-[#fafafa] text-left text-[12px] text-[#262626]">
                <tr className="border-b border-[#e5e5e5]">
                  <th className="w-[80px] border-r border-[#e5e5e5] px-3 py-2.5 font-normal">Actions</th>
                  <th className="border-r border-[#e5e5e5] px-3 py-2.5 font-normal">Room ID</th>
                  <th className="px-3 py-2.5 font-normal">Claim ID</th>
                  <th className="w-[13%] px-3 py-2.5 font-normal">Customer ID</th>
                  <th className="w-[11%] px-3 py-2.5 font-normal">Status</th>
                  <th className="w-[10%] px-3 py-2.5 font-normal">Stage</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.roomId} className="group border-b border-[#f0f0f0] hover:bg-[#f5f8ff]">
                    <td className="border-r border-[#e5e5e5] px-3 py-2">
                      <div className="flex items-center gap-3 text-[#262626]">
                        <button onClick={() => showToast("Download isn't part of this prototype")} aria-label="Download">
                          <Download className="size-3.5" />
                        </button>
                        <button onClick={() => showToast("Rerun isn't part of this prototype")} aria-label="More">
                          <CirclePlus className="size-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="border-r border-[#e5e5e5] px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-nums">{r.roomId}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => copy(r.roomId)} aria-label="Copy room ID" className="opacity-0 group-hover:opacity-100">
                              <Copy className="size-3.5 text-[#737373]" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Copy</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{r.claimId}</td>
                    <td className="px-3 py-2">{r.customerId}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
