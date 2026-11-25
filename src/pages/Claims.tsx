import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Calendar,
  Camera,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Grid2x2,
  Image as ImageIcon,
  Link2,
  ListChecks,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/portal/AppShell'
import { PHOTO_TONES, RoomPhoto, capitalize } from '@/components/portal/taskBits'
import { buildClaims, type Claim } from '@/data/claims'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const toolbarBtn = 'flex h-[35px] items-center gap-2 rounded-[8px] border border-[#e5e5e5] bg-white px-3 text-[13px] font-medium hover:bg-[#fafafa]'

export function useClaims() {
  const { tasks } = useStore()
  return useMemo(() => buildClaims(tasks), [tasks])
}

/** Claims list, copied from today's portal (CL1, CL2 filtered by a pasted claim ID, CL3). No redesign. */
export function ClaimsList({ base }: { base: '/claims' | '/org/claims' }) {
  const claims = useClaims()
  const navigate = useNavigate()
  const { showToast } = useStore()
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const rows = claims.filter((c) => !query || c.id.includes(query) || c.customerId.includes(query))
  // A pasted claim ID shows as a chip with an x, as in CL2. Typing stays in the box.
  const [pasted, setPasted] = useState(false)

  return (
    <AppShell changes={[]} crumbs={base === '/claims' ? [{ label: 'Claims' }] : [{ label: 'Org' }, { label: 'Organization' }, { label: 'Claims' }]}>
      <div className="flex h-full flex-col gap-3 px-[10px] pt-4 pb-3">
        <div className="flex items-center gap-2">
          {pasted ? (
            <div className="flex h-[35px] w-[200px] items-center gap-2 rounded-[8px] border border-[#e5e5e5] px-[10px] text-[13px]">
              <span className="truncate">{q}</span>
              <button
                onClick={() => {
                  setQ('')
                  setPasted(false)
                }}
                aria-label="Clear search"
                className="shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onPaste={(e) => {
                e.preventDefault()
                setQ(e.clipboardData.getData('text').trim())
                setPasted(true)
              }}
              placeholder="Search by claim or customer id"
              className="h-[35px] w-[200px] rounded-[8px] border border-[#e5e5e5] px-[10px] text-[13px] outline-none placeholder:text-[#a3a3a3] focus:border-[#a3a3a3]"
            />
          )}
          <div className="flex-1" />
          <button className={toolbarBtn} onClick={() => showToast("The date range isn't part of this prototype")}>
            <Calendar className="size-3.5" /> Nov 6, 2026 - Nov 13, 2026
          </button>
          <button className={toolbarBtn} onClick={() => showToast("Columns isn't part of this prototype")}>
            Columns <ChevronDown className="size-3.5" />
          </button>
          <button className={toolbarBtn} onClick={() => showToast("Filters isn't part of this prototype")}>
            <SlidersHorizontal className="size-3.5" /> Filters (1)
          </button>
          <button className={toolbarBtn} onClick={() => showToast("Download CSV isn't part of this prototype")}>
            <FileSpreadsheet className="size-3.5" /> Download CSV
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-[8px] border border-[#e5e5e5]">
          <table className="w-full min-w-[900px] text-[12.5px]">
            <thead className="sticky top-0 bg-[#fafafa] text-left text-[12.5px] text-[#262626]">
              <tr className="border-b border-[#e5e5e5]">
                <th className="w-[22%] border-r border-[#e5e5e5] px-3 py-2.5 font-normal">Claim</th>
                <th className="w-[20%] px-3 py-2.5 font-normal">Customer ID</th>
                <th className="px-3 py-2.5 font-normal">Address</th>
                <th className="w-[11%] px-3 py-2.5 font-normal">Organization</th>
                <th className="w-[7%] px-3 py-2.5 font-normal">Rooms</th>
                <th className="w-[13%] px-3 py-2.5 font-normal">Adjuster</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} onClick={() => navigate(`${base}/${c.id}`)} className="cursor-pointer border-b border-[#f0f0f0] hover:bg-[#fafafa]">
                  <td className="max-w-0 border-r border-[#e5e5e5] px-3 py-2">
                    <span className="block truncate">{c.id}</span>
                  </td>
                  <td className="px-3 py-2">{c.customerId}</td>
                  <td className="px-3 py-2">
                    <div>{c.street}</div>
                    <div className="text-[10.5px] text-[#737373]">{c.cityLine}</div>
                  </td>
                  <td className="max-w-0 px-3 py-2">
                    <span className="block truncate">{c.org}</span>
                  </td>
                  <td className="px-3 py-2">{c.rooms}</td>
                  <td className="max-w-0 px-3 py-2 text-[#737373]">
                    <span className="block truncate">{c.adjuster}</span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[#737373]">
                    No claims match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="text-right text-[12.5px] text-[#737373]">
          Showing <span className="font-semibold text-[#0a0a0a]">{rows.length}</span> {rows.length === 1 ? 'row' : 'rows'}
        </div>
      </div>
    </AppShell>
  )
}

const DETAIL_TABS = [
  { key: 'images', label: 'Images', icon: ImageIcon },
  { key: 'floor', label: 'Floor Plan', icon: Grid2x2 },
  { key: 'items', label: 'Line Items', icon: ListChecks },
  { key: 'cloud', label: 'Point Cloud', icon: Box },
  { key: 'ifc', label: 'IFC Viewer', icon: Box },
] as const

/** Claim detail, copied from today's portal (CL4 loaded, CL5 room photos). */
export function ClaimDetail({ base }: { base: '/claims' | '/org/claims' }) {
  const { claimId = '' } = useParams()
  const claims = useClaims()
  const { showToast } = useStore()
  const claim = claims.find((c) => c.id === claimId)
  const [tab, setTab] = useState<(typeof DETAIL_TABS)[number]['key']>('images')
  const [room, setRoom] = useState(0)
  const crumbs = [{ label: 'Org' }, { label: 'Organization' }, { label: 'Claims', to: base }, { label: claimId }]

  if (!claim)
    return (
      <AppShell changes={[]} crumbs={crumbs}>
        <div className="p-8 text-[13px] text-[#737373]">This claim doesn't exist in the mock data.</div>
      </AppShell>
    )

  return (
    <AppShell changes={[]} crumbs={crumbs}>
      <div className="flex flex-col px-5 pt-5 pb-8">
        <div className="flex items-center gap-3 border-b border-[#e5e5e5] pb-4">
          <h1 className="text-[20px] font-semibold">Claim</h1>
          <span className="text-[14px] text-[#525252]">{claim.street}</span>
          <StatusChip status={claim.status} />
          <div className="flex-1" />
          <Link to={base} aria-label="Close" className="rounded p-1 text-[#737373] hover:bg-black/5">
            <X className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-x-6 gap-y-5 border-b border-[#e5e5e5] py-5">
          <Field label="Adjuster" value={claim.adjuster} />
          <Field label="Number of Rooms" value={String(claim.rooms)} />
          <div />
          <div className="flex items-start justify-end">
            <SmallBtn icon={Camera} label="Request Images" onClick={() => showToast("Request Images isn't part of this prototype")} />
          </div>
          <Field label="Received" value={claim.received} />
          <Field label="First Photos Submitted" value={claim.firstPhotos} />
          <Field label="Last Photos Submitted" value={claim.lastPhotos} />
          <Field label="Completion Date" value={claim.completed} />
        </div>

        <div className="flex justify-end gap-2 py-4">
          <SmallBtn
            icon={Link2}
            label="Copy Link"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href).catch(() => {})
              showToast('Link copied')
            }}
          />
          <SmallBtn icon={Download} label="Download Report" onClick={() => showToast("Download Report isn't part of this prototype")} />
          <SmallBtn icon={FileText} label="Download ESX" onClick={() => showToast("Download ESX isn't part of this prototype")} />
        </div>

        <div className="flex items-center gap-2 pb-4">
          <div className="relative">
            <select
              value={room}
              onChange={(e) => setRoom(Number(e.target.value))}
              className="h-[32px] appearance-none rounded-[7px] border border-[#e5e5e5] bg-white pr-8 pl-3 text-[13px] font-medium"
            >
              {claim.roomTypes.map((r, i) => (
                <option key={r} value={i}>
                  {capitalize(r)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[#737373]" />
          </div>
          <StatusChip status={claim.status} />
          <div className="flex-1" />
          <div className="flex rounded-[8px] bg-[#f5f5f5] p-[3px]">
            {DETAIL_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex h-[26px] items-center gap-1.5 rounded-[6px] px-2.5 text-[12.5px]',
                  tab === t.key ? 'bg-white font-medium shadow-[0px_1px_2px_rgba(0,0,0,0.1)]' : 'text-[#737373] hover:text-[#0a0a0a]',
                )}
              >
                <t.icon className="size-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'images' ? (
          <div className="flex flex-col gap-3">
            <div className="text-[13.5px] font-medium">Overview Images</div>
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <RoomPhoto key={i} tone={PHOTO_TONES[(i + room) % PHOTO_TONES.length]} className="aspect-[3/4.4] p-0" />
              ))}
            </div>
            <div className="pt-3 text-[13.5px] font-medium">Damage Images</div>
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <RoomPhoto key={i} tone={PHOTO_TONES[(i + room + 3) % PHOTO_TONES.length]} damage className="aspect-[3/4.4] p-0" />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-[260px] items-center justify-center rounded-[10px] border border-dashed border-[#e5e5e5] text-[12.5px] text-[#737373]">
            {DETAIL_TABS.find((t) => t.key === tab)!.label} isn't part of this prototype.
          </div>
        )}
      </div>
    </AppShell>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[14px] font-medium">{label}</div>
      <div className="mt-1 text-[13px] text-[#525252]">{value}</div>
    </div>
  )
}

function SmallBtn({ icon: Icon, label, onClick }: { icon: typeof Camera; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex h-[30px] items-center gap-1.5 rounded-[6px] border border-[#e5e5e5] bg-white px-2.5 text-[12px] text-[#525252] hover:bg-[#fafafa]">
      <Icon className="size-3.5" /> {label}
    </button>
  )
}

function StatusChip({ status }: { status: Claim['status'] }) {
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-[2px] text-[11.5px] font-medium',
        status === 'Complete' ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]' : 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
      )}
    >
      {status}
    </span>
  )
}
