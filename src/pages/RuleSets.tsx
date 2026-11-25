import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Building2, Check, ChevronDown, ChevronRight, ChevronUp, ClipboardList, Ellipsis, GripVertical, Plus, Search, SquarePlus, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/portal/AppShell'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { RULE_SETS_CHANGES } from '@/data/changes'
import { lineItemsFor, RULE_CATEGORIES, type Rule, type RuleCategory, type Ruleset, type RulesetStatus } from '@/data/rules'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

// Rule Sets, built from the "Rules Editor" Figma frames, inside the portal shell.
// The only change from the frames is R1: "Apply to" when saving a rule.

const STATUS_STYLE: Record<RulesetStatus, string> = {
  Live: 'bg-[#0b74de] text-white',
  Draft: 'bg-[#e07a0b] text-white',
  'Unpublished Changes': 'border border-[#0b74de] bg-[#d6e8fa] text-[#0b74de]',
}

function StatusBadge({ status }: { status: RulesetStatus }) {
  return <span className={cn('inline-flex h-[40px] items-center rounded-[6px] px-4 text-[14px] font-medium', STATUS_STYLE[status])}>{status}</span>
}

function Page({ crumbs, children }: { crumbs: { label: string; to?: string }[]; children: ReactNode }) {
  return (
    <AppShell changes={RULE_SETS_CHANGES} crumbs={crumbs}>
      <div className="mx-auto flex max-w-[960px] flex-col gap-6 px-6 pt-7 pb-10">
        <h1 className="flex items-center gap-2 text-[24px] font-semibold">
          <ClipboardList className="size-6" strokeWidth={1.6} /> Rules Management System
        </h1>
        {children}
      </div>
    </AppShell>
  )
}

const card = 'overflow-hidden rounded-[10px] bg-white shadow-[0px_4px_24px_rgba(0,0,0,0.08)]'

/** "Select Ruleset": every carrier's ruleset, filterable by status. */
export function RuleSetList() {
  const { rulesets } = useStore()
  const [filter, setFilter] = useState<'All' | 'Live' | 'Drafts' | 'Unpublished Changes'>('All')
  const [q, setQ] = useState('')
  const rows = rulesets.filter(
    (r) =>
      (filter === 'All' || (filter === 'Drafts' ? r.status === 'Draft' : r.status === filter)) && r.name.toLowerCase().includes(q.trim().toLowerCase()),
  )
  return (
    <Page crumbs={[{ label: 'Rule Sets' }]}>
      <div className={card}>
        <div className="border-b border-[#a3a3a3] bg-[#f7f7f7] px-3 py-5">
          <h2 className="text-[24px] font-bold">Select Ruleset</h2>
        </div>
        <div className="flex flex-col gap-3 p-3">
          <div className="flex w-fit gap-1 rounded-[6px] border border-[#e5e5e5] p-1">
            {(['All', 'Live', 'Drafts', 'Unpublished Changes'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn('rounded-[4px] px-3 py-1.5 text-[14px]', filter === f ? 'bg-[#f1f5f9] font-medium' : 'hover:bg-[#f8fafc]')}>
                {f}
              </button>
            ))}
          </div>
          <SearchBox value={q} onChange={setQ} placeholder="Search Entities" />
          {rows.map((r) => (
            <Link key={r.id} to={`/rule-sets/${r.id}`} className="flex h-[56px] items-center gap-2 rounded-[4px] border border-[#d4d4d4] px-3 hover:bg-[#fafafa]">
              <Building2 className="size-5" strokeWidth={1.6} />
              <span className="flex-1 text-[16px]">{r.name}</span>
              <StatusBadge status={r.status} />
              <ChevronRight className="ml-2 size-4" />
            </Link>
          ))}
        </div>
      </div>
    </Page>
  )
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-[40px] items-center gap-2 rounded-[4px] border border-[#d4d4d4] px-3 focus-within:border-[#737373]">
      <Search className="size-4 text-[#737373]" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8a8a8a]" />
    </label>
  )
}

/** One carrier's ruleset: rules by category, New rule, Import Ruleset (from "Empty Ruleset"). */
export function RuleSetDetail() {
  const { rulesetId = '' } = useParams()
  const { rulesets, setRulesets, rules, addRule, showToast } = useStore()
  const navigate = useNavigate()
  const ruleset = rulesets.find((r) => r.id === rulesetId)
  const [open, setOpen] = useState<RuleCategory[]>(['Floor'])
  const [q, setQ] = useState('')
  const [newName, setNewName] = useState<Partial<Record<RuleCategory, string>>>({})
  const [importStep, setImportStep] = useState<'closed' | 'pick' | 'rules'>('closed')
  const [importFrom, setImportFrom] = useState<Ruleset | null>(null)
  const [importOnly, setImportOnly] = useState<RuleCategory | null>(null)

  if (!ruleset)
    return (
      <Page crumbs={[{ label: 'Rule Sets', to: '/rule-sets' }]}>
        <div className="text-[13px] text-[#737373]">This ruleset doesn't exist in the mock data.</div>
      </Page>
    )

  const inSet = rules.filter((r) => ruleset.ruleIds.includes(r.id) && r.name.toLowerCase().includes(q.trim().toLowerCase()))
  const toggle = (c: RuleCategory) => setOpen((o) => (o.includes(c) ? o.filter((x) => x !== c) : [...o, c]))
  const create = (c: RuleCategory) => {
    const name = newName[c]?.trim()
    if (!name) return
    const rule: Rule = { id: `${c}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), category: c, name, usage: 0 }
    addRule(rule)
    setRulesets((rs) => rs.map((r) => (r.id === ruleset.id ? { ...r, ruleIds: [...new Set([...r.ruleIds, rule.id])] } : r)))
    setNewName((n) => ({ ...n, [c]: '' }))
    navigate(`/rule-sets/${ruleset.id}/rules/${rule.id}`)
  }

  return (
    <Page crumbs={[{ label: 'Rule Sets', to: '/rule-sets' }, { label: ruleset.name }]}>
      <div className={card}>
        <div className="flex items-start border-b border-[#a3a3a3] bg-[#f7f7f7] px-3 py-3">
          <div className="flex-1">
            <div className="text-[14px]">Ruleset</div>
            <div className="text-[20px] font-semibold">{ruleset.name}</div>
          </div>
          <StatusBadge status={ruleset.status} />
        </div>
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center pt-3">
            <h2 className="flex-1 text-[24px] font-semibold">Rules</h2>
            <OutlineBtn
              onClick={() => {
                setImportOnly(null)
                setImportStep('pick')
              }}
            >
              Import Ruleset
            </OutlineBtn>
          </div>
          <SearchBox value={q} onChange={setQ} placeholder="Search Rules" />
          <div className="flex flex-col">
            {RULE_CATEGORIES.map((c) => {
              const isOpen = open.includes(c)
              const list = inSet.filter((r) => r.category === c)
              return (
                <div key={c} className="border-b border-[#d4d4d4]">
                  <div className="flex items-center gap-3 px-2 py-3">
                    <button onClick={() => toggle(c)} className="flex-1 text-left text-[18px] font-semibold">
                      {c}
                    </button>
                    {isOpen && (
                      <OutlineBtn
                        onClick={() => {
                          setImportOnly(c)
                          setImportStep('pick')
                        }}
                      >
                        Import {c} Rules
                      </OutlineBtn>
                    )}
                    <button onClick={() => toggle(c)} aria-label={isOpen ? 'Collapse' : 'Expand'}>
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                  </div>
                  {isOpen && (
                    <div className="flex flex-col gap-2 px-2 pb-3">
                      {list.map((r) => (
                        <Link
                          key={r.id}
                          to={`/rule-sets/${ruleset.id}/rules/${r.id}`}
                          className="flex h-[44px] items-center rounded-[4px] bg-[#f1f2f4] px-3 text-[15px] hover:bg-[#e8e9ec]"
                        >
                          <span className="flex-1">{r.name}</span>
                          <ChevronRight className="size-4" />
                        </Link>
                      ))}
                      <div className="flex flex-col gap-3 rounded-[4px] border border-[#d4d4d4] p-3">
                        <div className="flex items-center gap-3 text-[18px] font-semibold text-[#64748b]">
                          <SquarePlus className="size-5" strokeWidth={1.6} /> New {c} Rule
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={newName[c] ?? ''}
                            onChange={(e) => setNewName((n) => ({ ...n, [c]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && create(c)}
                            placeholder="Name your rule"
                            className="h-[40px] flex-1 rounded-[4px] border border-[#334155] px-3 text-[15px] outline-none placeholder:text-[#64748b]"
                          />
                          <button
                            onClick={() => create(c)}
                            disabled={!newName[c]?.trim()}
                            className="h-[40px] rounded-[4px] bg-[#64748b] px-4 text-[14px] font-medium text-white hover:bg-[#475569] disabled:opacity-70"
                          >
                            Create New
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <PickRuleset
        open={importStep === 'pick'}
        exclude={ruleset.id}
        onClose={() => setImportStep('closed')}
        onPick={(r) => {
          setImportFrom(r)
          setImportStep('rules')
        }}
      />
      {importFrom && (
        <ImportRules
          open={importStep === 'rules'}
          from={importFrom}
          only={importOnly}
          onClose={() => setImportStep('closed')}
          onImport={(ids) => {
            setRulesets((rs) => rs.map((r) => (r.id === ruleset.id ? { ...r, ruleIds: [...new Set([...r.ruleIds, ...ids])] } : r)))
            setImportStep('closed')
            showToast(`Imported ${ids.length} rule${ids.length === 1 ? '' : 's'} from ${importFrom.name}`)
          }}
        />
      )}
    </Page>
  )
}

function OutlineBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-[36px] rounded-[6px] border border-[#e5e5e5] bg-white px-3 text-[14px] font-medium hover:bg-[#fafafa]">
      {children}
    </button>
  )
}

/** "Select Ruleset" modal from the Empty Ruleset frames. */
function PickRuleset({ open, exclude, onClose, onPick }: { open: boolean; exclude: string; onClose: () => void; onPick: (r: Ruleset) => void }) {
  const { rulesets } = useStore()
  const [q, setQ] = useState('')
  const list = rulesets.filter((r) => r.id !== exclude && r.name.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[940px] max-w-[calc(100vw-32px)] gap-0 overflow-hidden p-0">
        <div className="border-b border-[#a3a3a3] bg-[#f7f7f7] px-3 py-5">
          <DialogTitle className="text-[24px] font-bold">Select Ruleset</DialogTitle>
        </div>
        <div className="flex flex-col gap-3 p-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search for a ruleset" />
          {list.map((r) => (
            <button key={r.id} onClick={() => onPick(r)} className="flex h-[44px] items-center gap-2 rounded-[4px] border border-[#d4d4d4] px-3 text-left hover:bg-[#fafafa]">
              <Building2 className="size-5" strokeWidth={1.6} />
              <span className="flex-1 text-[16px]">{r.name}</span>
              <ChevronRight className="size-4" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** "Ruleset to select": tick the rules to import, by category. */
function ImportRules({
  open,
  from,
  only,
  onClose,
  onImport,
}: {
  open: boolean
  from: Ruleset
  only: RuleCategory | null
  onClose: () => void
  onImport: (ids: string[]) => void
}) {
  const { rules } = useStore()
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [openCats, setOpenCats] = useState<RuleCategory[]>([only ?? 'Floor'])
  const source = rules.filter((r) => from.ruleIds.includes(r.id) && (!only || r.category === only))
  const shown = source.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()))
  const allOn = source.length > 0 && source.every((r) => picked.includes(r.id))
  const toggleIds = (ids: string[], on: boolean) => setPicked((p) => (on ? [...new Set([...p, ...ids])] : p.filter((x) => !ids.includes(x))))
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[860px] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden p-0">
        <div className="border-b border-[#a3a3a3] bg-[#f7f7f7] px-3 py-2">
          <div className="text-[13px]">Entity</div>
          <DialogTitle className="text-[18px] font-semibold">{from.name}</DialogTitle>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <h3 className="pt-2 text-[22px] font-semibold">Rules</h3>
          <Tick on={allOn} onClick={() => toggleIds(source.map((r) => r.id), !allOn)} label="Select Entire Ruleset" />
          <SearchBox value={q} onChange={setQ} placeholder="Search Rules" />
          {RULE_CATEGORIES.filter((c) => !only || c === only).map((c) => {
            const list = shown.filter((r) => r.category === c)
            const isOpen = openCats.includes(c)
            const catOn = list.length > 0 && list.every((r) => picked.includes(r.id))
            return (
              <div key={c} className="border-b border-[#d4d4d4] pb-2">
                <button
                  onClick={() => setOpenCats((o) => (isOpen ? o.filter((x) => x !== c) : [...o, c]))}
                  className="flex w-full items-center py-2 text-left text-[18px] font-semibold"
                >
                  <span className="flex-1">{c}</span>
                  {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-2">
                    <Tick on={catOn} onClick={() => toggleIds(list.map((r) => r.id), !catOn)} label={`Select All ${c} rules`} />
                    {list.map((r) => (
                      <div key={r.id} className="flex h-[44px] items-center gap-3 rounded-[4px] bg-[#f1f2f4] px-3">
                        <Tick on={picked.includes(r.id)} onClick={() => toggleIds([r.id], !picked.includes(r.id))} label={r.name} />
                        <span className="flex-1" />
                        <ChevronDown className="size-4" />
                      </div>
                    ))}
                    {list.length === 0 && <div className="text-[13px] text-[#737373]">No {c.toLowerCase()} rules in {from.name}.</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-end border-t border-[#e5e5e5] px-4 py-3">
          <button
            disabled={!picked.length}
            onClick={() => onImport(picked)}
            className="h-[44px] w-[116px] rounded-[4px] bg-[#171717] text-[15px] text-white hover:bg-[#262626] disabled:bg-[#a3a3a3]"
          >
            Import
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Tick({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-left text-[15px]">
      <span className={cn('flex size-4 items-center justify-center rounded-[3px] border', on ? 'border-[#171717] bg-[#171717] text-white' : 'border-[#737373] bg-white')}>
        {on && <Check className="size-3" strokeWidth={3} />}
      </span>
      {label}
    </button>
  )
}

type ApplyTo = 'this' | 'all' | 'choose'

/** Rule editor (the page behind "Ruleset to select"), plus R1: Apply to before saving. */
export function RuleEditor() {
  const { rulesetId = '', ruleId = '' } = useParams()
  const { rulesets, setRulesets, rules, showToast } = useStore()
  const navigate = useNavigate()
  const ruleset = rulesets.find((r) => r.id === rulesetId)
  const rule = rules.find((r) => r.id === ruleId)
  const items = useMemo(() => (rule ? lineItemsFor(rule) : null), [rule])
  const [applyTo, setApplyTo] = useState<ApplyTo>('this')
  const [chosen, setChosen] = useState<string[]>([rulesetId])
  const [desc, setDesc] = useState<Record<string, string>>({})

  if (!ruleset || !rule || !items)
    return (
      <Page crumbs={[{ label: 'Rule Sets', to: '/rule-sets' }]}>
        <div className="text-[13px] text-[#737373]">This rule doesn't exist in the mock data.</div>
      </Page>
    )

  const targets = applyTo === 'this' ? [ruleset.id] : applyTo === 'all' ? rulesets.map((r) => r.id) : chosen
  const save = () => {
    setRulesets((rs) =>
      rs.map((r) =>
        targets.includes(r.id)
          ? { ...r, ruleIds: [...new Set([...r.ruleIds, rule.id])], status: r.status === 'Live' ? 'Unpublished Changes' : r.status }
          : r,
      ),
    )
    showToast(targets.length === 1 && targets[0] === ruleset.id ? `Saved to ${ruleset.name}` : `Saved to ${targets.length} carrier rule sets`)
    navigate(`/rule-sets/${ruleset.id}`)
  }

  return (
    <Page crumbs={[{ label: 'Rule Sets', to: '/rule-sets' }, { label: ruleset.name, to: `/rule-sets/${ruleset.id}` }, { label: rule.name }]}>
      <div className={card}>
        <div className="border-b border-[#a3a3a3] bg-[#f7f7f7] px-3 py-2">
          <div className="text-[13px]">Entity</div>
          <div className="text-[18px] font-semibold">{ruleset.name}</div>
        </div>
        <div className="border-b border-[#a3a3a3] bg-[#f7f7f7] px-3 py-2">
          <div className="text-[13px]">Rule</div>
          <div className="text-[18px] font-semibold">
            {rule.category} - {rule.name}
          </div>
        </div>
        <div className="flex flex-col gap-4 p-3">
          <div className="flex items-center pt-2">
            <h2 className="flex-1 text-[18px] font-semibold">Configure</h2>
            <OutlineBtn onClick={() => showToast("Import Existing Rules isn't part of this prototype")}>Import Existing Rules</OutlineBtn>
          </div>
          <div className="flex flex-col gap-3 rounded-[6px] border border-[#94a3b8] p-4">
            <div className="text-[18px] font-semibold">Notifications</div>
            <div className="text-[13px] text-[#64748b]">Add notifications that show to the claims specialist when this rule is used.</div>
            <FakeSelect placeholder="Select or add a notification" />
            <div className="pt-2 text-[18px] font-semibold">Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] text-[#64748b]">Parent Structure</span>
                <FakeSelect placeholder={rule.category} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] text-[#64748b]">Damage Category</span>
                <FakeSelect placeholder="Select" />
              </div>
            </div>
          </div>
          <LineItemSection title="Restoration" items={items.restoration} desc={desc} setDesc={setDesc} />
          <LineItemSection title="Mitigation" items={items.mitigation} desc={desc} setDesc={setDesc} />
        </div>

        {/* R1: where this change applies, then save */}
        <div data-change="apply-to" className="flex flex-col gap-3 border-t border-[#e5e5e5] bg-[#fafafa] p-4">
          <div className="text-[15px] font-semibold">Apply to</div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Apply to">
            {(
              [
                ['this', `This carrier (${ruleset.name})`],
                ['all', `All carriers (${rulesets.length})`],
                ['choose', 'Choose carriers'],
              ] as [ApplyTo, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                role="radio"
                aria-checked={applyTo === k}
                onClick={() => setApplyTo(k)}
                className={cn(
                  'flex h-[36px] items-center gap-2 rounded-[6px] border px-3 text-[14px]',
                  applyTo === k ? 'border-[#171717] bg-white font-medium' : 'border-[#e5e5e5] bg-white text-[#525252] hover:border-[#a3a3a3]',
                )}
              >
                <span className={cn('flex size-4 items-center justify-center rounded-full border', applyTo === k ? 'border-[#171717]' : 'border-[#a3a3a3]')}>
                  {applyTo === k && <span className="size-2 rounded-full bg-[#171717]" />}
                </span>
                {label}
              </button>
            ))}
          </div>
          {applyTo === 'choose' && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-[6px] border border-[#e5e5e5] bg-white p-3">
              {rulesets.map((r) => (
                <Tick key={r.id} on={chosen.includes(r.id)} onClick={() => setChosen((c) => (c.includes(r.id) ? c.filter((x) => x !== r.id) : [...c, r.id]))} label={r.name} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="flex-1 text-[13px] text-[#737373]">
              {targets.length === 0
                ? 'Pick at least one carrier.'
                : targets.length === 1
                  ? `Saves to ${rulesets.find((r) => r.id === targets[0])?.name} only.`
                  : `Saves the same change to ${targets.length} carrier rule sets in one step. Live rule sets show Unpublished Changes until published.`}
            </span>
            <OutlineBtn onClick={() => navigate(`/rule-sets/${ruleset.id}`)}>Cancel</OutlineBtn>
            <button
              onClick={save}
              disabled={targets.length === 0}
              className="h-[36px] rounded-[6px] bg-[#171717] px-4 text-[14px] font-medium text-white hover:bg-[#262626] disabled:bg-[#a3a3a3]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Page>
  )
}

function FakeSelect({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-[40px] items-center rounded-[4px] border border-[#d4d4d4] px-3 text-[14px] text-[#64748b]">
      <span className="flex-1">{placeholder}</span>
      <ChevronDown className="size-4" />
    </div>
  )
}

function LineItemSection({
  title,
  items,
  desc,
  setDesc,
}: {
  title: string
  items: ReturnType<typeof lineItemsFor>['restoration']
  desc: Record<string, string>
  setDesc: (fn: (d: Record<string, string>) => Record<string, string>) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col gap-3">
      <button onClick={() => setOpen((o) => !o)} className="flex h-[40px] items-center rounded-[6px] bg-[#e2e8f0] px-3 text-left text-[15px] font-semibold">
        <span className="flex-1">{title}</span>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {open && (
        <>
          {items.map((it) => (
            <div key={it.id} className="relative flex flex-col gap-2 rounded-[6px] border border-[#94a3b8] p-4">
              <GripVertical className="absolute top-3 -left-5 size-4 text-[#94a3b8]" />
              <div className="flex items-center">
                <span className="flex-1 text-[14px] font-medium text-[#475569]">
                  {title} Line Item · {it.code}
                </span>
                <Trash2 className="size-4 text-[#475569]" />
                <Ellipsis className="ml-3 size-4 text-[#475569]" />
              </div>
              <span className="text-[13px] text-[#64748b]">Sort Key</span>
              <input defaultValue={it.sortKey} className="h-[36px] w-[46px] rounded-[4px] border border-[#d4d4d4] px-2 text-[13px] text-[#64748b]" />
              <span className="text-[13px] text-[#64748b]">Description</span>
              <span className="-mt-1.5 text-[11.5px] text-[#64748b]">Help claims specialist understand what this line item is for.</span>
              <textarea
                value={desc[it.id] ?? it.description}
                onChange={(e) => setDesc((d) => ({ ...d, [it.id]: e.target.value }))}
                placeholder="Message for internal claims specialist"
                className="h-[64px] resize-none rounded-[4px] border border-[#d4d4d4] p-2 text-[13px] outline-none placeholder:text-[#94a3b8] focus:border-[#737373]"
              />
            </div>
          ))}
          <button className="flex h-[40px] items-center justify-center gap-2 rounded-[6px] border border-[#94a3b8] text-[14px] text-[#475569] hover:bg-[#f8fafc]">
            <Plus className="size-4" /> Line Item
          </button>
        </>
      )}
    </div>
  )
}
