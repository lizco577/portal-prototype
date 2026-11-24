import { useState } from 'react'
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowUpDown, Check, ChevronDown, Ellipsis, GripVertical, Plus, Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Material } from '@/data/labeling'
import { useStore, type MaterialSort } from '@/lib/store'
import { cn } from '@/lib/utils'

const SORTS: { key: MaterialSort; label: string; hint: string }[] = [
  { key: 'az', label: 'A to Z', hint: 'Alphabetical, updates automatically' },
  { key: 'used', label: 'Most used', hint: 'Most picked first, updates automatically' },
  { key: 'custom', label: 'Custom', hint: 'Drag rows to set your own order' },
]

/** Materials, managed in a modal opened from the draw screen. Add, rename, delete, search, sort. No merge, no usage counts. */
export function MaterialsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { sortedMaterials, materials, setMaterials, materialSort, setMaterialSort, showToast } = useStore()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [sortOpen, setSortOpen] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const query = q.trim().toLowerCase()
  const shown = query ? sortedMaterials.filter((m) => m.name.toLowerCase().includes(query)) : sortedMaterials
  const dragOn = materialSort === 'custom' && !query

  const exists = (name: string, exceptId?: string) =>
    materials.some((m) => m.id !== exceptId && m.name.trim().toLowerCase() === name.trim().toLowerCase())
  const addError = newName.trim() && exists(newName) ? `"${newName.trim()}" already exists` : null
  const renameError = renaming && renameValue.trim() && exists(renameValue, renaming) ? 'Another material already has this name' : null

  const add = () => {
    const name = newName.trim()
    if (!name || addError) return
    setMaterials((ms) => [...ms, { id: `m${Date.now()}`, name, usage: 0 }])
    setNewName('')
    setAdding(false)
    showToast(`Added ${name}`)
  }
  const saveRename = () => {
    const name = renameValue.trim()
    if (!renaming || !name || renameError) return
    setMaterials((ms) => ms.map((m) => (m.id === renaming ? { ...m, name } : m)))
    setRenaming(null)
    showToast(`Renamed to ${name}`)
  }
  const remove = (m: Material) => {
    setMaterials((ms) => ms.filter((x) => x.id !== m.id))
    showToast(`Deleted ${m.name}`)
  }
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    setMaterials((ms) => {
      const from = ms.findIndex((m) => m.id === e.active.id)
      const to = ms.findIndex((m) => m.id === e.over!.id)
      return arrayMove(ms, from, to)
    })
  }
  const pickSort = (s: MaterialSort) => {
    // Switching to Custom starts from whatever order is on screen.
    if (s === 'custom' && materialSort !== 'custom') setMaterials(() => [...sortedMaterials])
    setMaterialSort(s)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="flex h-[min(600px,calc(100vh-48px))] w-[560px] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden rounded-[12px] p-0 sm:max-w-[560px]">
        <div className="flex flex-col gap-[3px] px-[22px] pt-5 pb-4 pr-12">
          <DialogTitle className="text-[16px] font-semibold">Materials</DialogTitle>
        </div>

        <div className="flex items-center gap-2 px-[22px] pb-3">
          <label className="flex h-[34px] flex-1 items-center gap-2 rounded-[8px] border border-[#e5e5e5] px-[10px] focus-within:border-[#a3a3a3]">
            <Search className="size-3.5 text-[#a3a3a3]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search materials…"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label="Clear search">
                <X className="size-3.5 text-[#737373]" />
              </button>
            )}
          </label>
          <DropdownMenu open={sortOpen} onOpenChange={setSortOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex h-[34px] items-center gap-1.5 rounded-[8px] border border-[#e5e5e5] px-3 text-[12.5px] font-medium hover:bg-[#fafafa]">
                <ArrowUpDown className="size-3.5" /> Order: {SORTS.find((s) => s.key === materialSort)!.label}
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px] p-[5px]">
              {SORTS.map((s) => (
                <DropdownMenuItem key={s.key} onSelect={() => pickSort(s.key)} className={cn('items-start py-[7px]', s.key === materialSort && 'bg-[#f5f5f5]')}>
                  <span className="flex-1">
                    <span className="block text-[13px]">{s.label}</span>
                    <span className="block text-[11.5px] text-[#737373]">{s.hint}</span>
                  </span>
                  {s.key === materialSort && <Check className="mt-0.5 size-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => {
              // Start the new name from whatever is typed in the search box
              setNewName(q.trim())
              setAdding(true)
            }}
            className="flex h-[34px] items-center gap-1.5 rounded-[8px] bg-[#171717] px-3 text-[12.5px] font-medium text-white hover:bg-[#262626]"
          >
            <Plus className="size-3.5" /> New material
          </button>
        </div>

        {materialSort === 'custom' && (
          <div className="px-[22px] pb-2 text-[11.5px] text-[#737373]">
            {query ? 'Clear the search to drag rows.' : 'Drag rows by the handle to set the order specialists see.'}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#e5e5e5]">
          {adding && (
            <div className="border-b border-[#f0f0f0] bg-[#fafafa] px-[22px] py-2.5">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') add()
                    if (e.key === 'Escape') {
                      e.stopPropagation()
                      setAdding(false)
                      setNewName('')
                    }
                  }}
                  placeholder="New material name, e.g. Vinyl plank"
                  className={cn(
                    'h-[32px] flex-1 rounded-[7px] border bg-white px-[10px] text-[13px] outline-none',
                    addError ? 'border-[#dc2626]' : 'border-[#e5e5e5] focus:border-[#a3a3a3]',
                  )}
                />
                <button
                  onClick={() => {
                    setAdding(false)
                    setNewName('')
                  }}
                  className="h-[32px] rounded-[7px] border border-[#e5e5e5] bg-white px-3 text-[12.5px] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={add}
                  disabled={!newName.trim() || !!addError}
                  className="h-[32px] rounded-[7px] bg-[#171717] px-3 text-[12.5px] font-medium text-white disabled:bg-[#e5e5e5] disabled:text-[#a3a3a3]"
                >
                  Add material
                </button>
              </div>
              {addError && <div className="mt-1.5 text-[11.5px] text-[#dc2626]">{addError}. Names are checked ignoring capitals.</div>}
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={shown.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              {shown.map((m) => (
                <MaterialRow
                  key={m.id}
                  material={m}
                  dragOn={dragOn}
                  showHandle={materialSort === 'custom'}
                  renaming={renaming === m.id}
                  renameValue={renameValue}
                  renameError={renaming === m.id ? renameError : null}
                  onRenameChange={setRenameValue}
                  onStartRename={() => {
                    setRenaming(m.id)
                    setRenameValue(m.name)
                  }}
                  onSaveRename={saveRename}
                  onCancelRename={() => setRenaming(null)}
                  onDelete={() => remove(m)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {shown.length === 0 && !adding && (
            <div className="px-[22px] py-8 text-center text-[13px] text-[#737373]">
              No materials match "{q}".{' '}
              <button
                className="underline"
                onClick={() => {
                  setAdding(true)
                  setNewName(q)
                }}
              >
                Add it
              </button>
            </div>
          )}
        </div>
        <div className="border-t border-[#e5e5e5] px-[22px] py-2.5 text-[11.5px] text-[#737373]">
          {materials.length} materials
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MaterialRow({
  material: m,
  dragOn,
  showHandle,
  renaming,
  renameValue,
  renameError,
  onRenameChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDelete,
}: {
  material: Material
  dragOn: boolean
  showHandle: boolean
  renaming: boolean
  renameValue: string
  renameError: string | null
  onRenameChange: (v: string) => void
  onStartRename: () => void
  onSaveRename: () => void
  onCancelRename: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id, disabled: !dragOn })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex min-h-[42px] items-center gap-2 border-b border-[#f0f0f0] bg-white px-[22px] py-1.5', isDragging && 'relative z-10 shadow-md')}
    >
      {showHandle && (
        <button
          {...attributes}
          {...listeners}
          aria-label={`Drag ${m.name}`}
          disabled={!dragOn}
          className={cn('-ml-1.5 rounded p-0.5', dragOn ? 'cursor-grab text-[#737373] hover:bg-black/5 active:cursor-grabbing' : 'text-[#d4d4d4]')}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      {renaming ? (
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              onFocus={(e) => e.target.select()}
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveRename()
                if (e.key === 'Escape') {
                  e.stopPropagation()
                  onCancelRename()
                }
              }}
              className={cn('h-[30px] flex-1 rounded-[6px] border px-2 text-[13px] outline-none', renameError ? 'border-[#dc2626]' : 'border-[#a3a3a3]')}
            />
            <button onClick={onCancelRename} className="h-[30px] rounded-[6px] border border-[#e5e5e5] px-2.5 text-[12px] font-medium">
              Cancel
            </button>
            <button
              onClick={onSaveRename}
              disabled={!renameValue.trim() || !!renameError}
              className="h-[30px] rounded-[6px] bg-[#171717] px-2.5 text-[12px] font-medium text-white disabled:bg-[#e5e5e5] disabled:text-[#a3a3a3]"
            >
              Save
            </button>
          </div>
          {renameError && <div className="text-[11.5px] text-[#dc2626]">{renameError}</div>}
        </div>
      ) : (
        <>
          <span className="flex-1 text-[13px] text-[#171717]">{m.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label={`Actions for ${m.name}`} className="rounded p-1 text-[#525252] hover:bg-black/5">
                <Ellipsis className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem className="text-[13px]" onSelect={onStartRename}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px] text-[#dc2626] focus:text-[#dc2626]" onSelect={onDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  )
}
