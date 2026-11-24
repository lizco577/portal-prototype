import { useEffect, useState } from 'react'
import { PanelRightClose } from 'lucide-react'
import type { Change } from '@/data/changes'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/**
 * "What's changed" panel. Sits beside the page (never on top of it). Hovering or
 * clicking a row expands it and outlines the matching element on the page.
 */
export function ChangesPanel({ changes }: { changes: Change[] }) {
  const { changesOpen, setChangesOpen } = useStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = changes.find((c) => c.id === activeId) ?? null

  if (!changesOpen) {
    return (
      <div className="flex w-9 shrink-0 items-start justify-center pt-4">
        <button
          onClick={() => setChangesOpen(true)}
          aria-label={`Open What's changed, ${changes.length} items`}
          className="rounded-lg border border-[#e5e5e5] bg-white px-1.5 py-3 text-[12.5px] font-medium whitespace-nowrap text-[#0a0a0a] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] [writing-mode:vertical-rl] hover:bg-[#fafafa]"
        >
          What's changed · {changes.length}
        </button>
      </div>
    )
  }

  return (
    <aside className="w-[272px] shrink-0 overflow-y-auto py-4 pr-4" aria-label="What's changed">
      <div
        className="rounded-xl border border-[#e5e5e5] bg-white"
        onMouseLeave={() => setActiveId(null)}
      >
        <div className="flex items-center justify-between border-b border-[#e5e5e5] py-2.5 pr-2 pl-3.5">
          <div className="text-[13.5px] font-semibold">What's changed · {changes.length}</div>
          <button
            onClick={() => {
              setActiveId(null)
              setChangesOpen(false)
            }}
            aria-label="Collapse What's changed"
            className="rounded-md p-1 text-[#525252] hover:bg-black/5"
          >
            <PanelRightClose className="size-4" />
          </button>
        </div>
        <ul className="flex flex-col p-1.5">
          {changes.map((c) => {
            const on = c.id === activeId
            return (
              <li key={c.id}>
                <button
                  onMouseEnter={() => setActiveId(c.id)}
                  onFocus={() => setActiveId(c.id)}
                  onClick={() => setActiveId(c.id)}
                  aria-expanded={on}
                  className={cn('flex w-full flex-col gap-1 rounded-md px-2 py-2 text-left', on && 'bg-[#f5f5f5]')}
                >
                  <span className="flex gap-2.5 text-[12.5px]">
                    <span className="min-w-[40px] text-[#a3a3a3] tabular-nums">{c.code}</span>
                    <span className="text-[#0a0a0a]">{c.title}</span>
                  </span>
                  {on && (
                    <span className="text-[12px] leading-[1.45]">
                      <span className="font-medium text-[#0a0a0a]">{c.kind}.</span> <span className="text-[#737373]">{c.detail}</span>
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      {active && <Outline target={active.target} />}
    </aside>
  )
}

/** Blue 1.5px outline around the matching element. Nothing is drawn if the element isn't on screen. */
function Outline({ target }: { target: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-change="${target}"]`)
    // Bring it into view if it's scrolled away (e.g. far right of the table), without jumping if it's
    // already visible, and put every scroll position back when the row closes.
    const saved: [HTMLElement, number, number][] = []
    for (let p = el?.parentElement; p; p = p.parentElement) saved.push([p, p.scrollLeft, p.scrollTop])
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    let raf = 0
    const tick = () => {
      const node = document.querySelector<HTMLElement>(`[data-change="${target}"]`)
      const r = node?.getBoundingClientRect()
      setRect(r && r.width > 0 && r.height > 0 && node!.offsetParent !== null ? r : null)
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      cancelAnimationFrame(raf)
      for (const [p, left, top] of saved) {
        p.scrollLeft = left
        p.scrollTop = top
      }
    }
  }, [target])

  if (!rect) return null
  const pad = 3
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-40 rounded-[7px] border-[1.5px] border-[#2563eb]"
      style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
    />
  )
}
