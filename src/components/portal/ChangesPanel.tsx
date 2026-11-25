import { useEffect, useState, type ReactNode } from 'react'
import type { Change } from '@/data/changes'
import { cn } from '@/lib/utils'

/**
 * "What's changed" panel. A full-height column beside the page (never on top of it). Every item shows
 * its PRD number, title and description. Hovering or clicking an item highlights it and outlines the
 * matching element on the page.
 */
export function ChangesPanel({ changes, top }: { changes: Change[]; top?: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = changes.find((c) => c.id === activeId) ?? null

  // Styled like the left nav: grey column, full height, thin border. Opened and closed from the header icon.
  return (
    <aside
      className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-l border-[#e5e5e5] bg-[#fafafa] pb-[18px]"
      aria-label="What's changed"
    >
      {/* Same 64px height as the page header, so the two bottom lines meet */}
      <div className="flex h-16 shrink-0 items-center border-b border-[#e5e5e5] px-4 text-[14px] font-semibold">What's changed · {changes.length}</div>
      {top}
      {changes.length === 0 && <p className="px-4 py-3 text-[12.5px] leading-[1.5] text-[#737373]">No changes on this page. This is today's portal.</p>}
      <ul className="flex flex-col" onMouseLeave={() => setActiveId(null)}>
        {changes.map((c) => {
          const on = c.id === activeId
          return (
            <li key={c.id} className="border-b border-[#e5e5e5]">
              <button
                onMouseEnter={() => setActiveId(c.id)}
                onFocus={() => setActiveId(c.id)}
                onClick={() => {
                  setActiveId(c.id)
                  openFor(c)
                }}
                aria-pressed={on}
                className={cn('grid w-full grid-cols-[48px_1fr] gap-x-2 px-4 py-3 text-left transition-colors', on ? 'bg-[#efefef]' : 'hover:bg-[#f4f4f4]')}
              >
                <span className="pt-px text-[12px] whitespace-nowrap text-[#a3a3a3] tabular-nums">{c.code}</span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-[13px] font-medium text-[#0a0a0a]">{c.title}</span>
                  <span className="text-[12px] leading-[1.5] text-[#737373]">{c.detail}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {active && <Outline target={active.target} />}
    </aside>
  )
}

/** Clicking a row opens the menu or modal it describes, if it has one. */
function openFor(c: Change) {
  if (!c.opens) return
  if (c.opens === 'click') {
    // Menus open on pointer down, panels on click: send both, like a real press.
    const el = document.querySelector<HTMLElement>(`[data-change="${c.target}"]`)
    el?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))
    el?.click()
    return
  }
  window.dispatchEvent(new CustomEvent(WHATS_CHANGED_OPEN, { detail: c.opens }))
}

/** Pages listen for this to open their own modals from a What's changed row. */
export const WHATS_CHANGED_OPEN = 'whats-changed:open'

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
