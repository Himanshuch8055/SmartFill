// Floating SmartFill button docked to the edge of pages with form fields.
// One click fills the page; everything else lives in the toolbar popup.
// Drag it up or down along the edge; hover shows what a click will do.
import { createLayer, el, LOGO_SVG } from './shadow'

const CSS = `
  /* Only the visible parts take the mouse, so no invisible area covers the page. */
  .w {
    position: fixed; right: 0; pointer-events: none; display: flex; align-items: center;
    transform: translateX(8px); transition: transform .18s ease-out;
  }
  .w:hover, .w:focus-within, .w.dragging { transform: translateX(0); }
  .fab {
    all: unset; cursor: pointer; position: relative; width: 44px; height: 40px; border-radius: 20px 0 0 20px;
    display: grid; place-items: center; padding-right: 4px; box-sizing: border-box;
    background: rgb(var(--sf-surface)); box-shadow: var(--sf-shadow-md), inset 0 0 0 1px rgb(var(--sf-line));
    touch-action: none; pointer-events: auto;
  }
  .fab:focus-visible { outline: 2px solid rgb(var(--sf-ring) / .7); outline-offset: 2px; }
  .fab:active { cursor: grabbing; }
  .fab svg { width: 20px; height: 20px; }
  .fab.busy svg { opacity: .5; }
  .count {
    position: absolute; top: -5px; left: -4px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
    background: rgb(var(--sf-accent)); color: rgb(var(--sf-accent-fg)); font: 600 10px/18px var(--sf-font-sans); text-align: center;
    box-shadow: 0 0 0 2px rgb(var(--sf-surface));
  }
  /* Hover label and hide button, revealed to the left of the button. The wrapper's right
     padding bridges the gap so moving the mouse from button to label keeps it open. */
  .tip-wrap { order: -1; padding-right: 6px; }
  .w:hover .tip-wrap, .w:focus-within .tip-wrap { pointer-events: auto; }
  .tip {
    display: flex; align-items: center; gap: 0; padding: 0 3px 0 0; height: 32px; border-radius: 8px;
    background: rgb(var(--sf-fg)); color: rgb(var(--sf-bg)); font: 500 12px/30px var(--sf-font-sans); white-space: nowrap;
    box-shadow: var(--sf-shadow-md); opacity: 0; transform: translateX(6px); pointer-events: none;
    transition: opacity .15s, transform .15s;
  }
  .w:hover .tip, .w:focus-within .tip { opacity: 1; transform: none; pointer-events: auto; }
  .w.dragging .tip { opacity: 0; }
  .tip-fill {
    all: unset; cursor: pointer; height: 32px; padding: 0 8px 0 11px; border-radius: 8px 0 0 8px; font: inherit;
  }
  .tip-fill:focus-visible { outline: 2px solid rgb(var(--sf-ring)); }
  .hide {
    all: unset; cursor: pointer; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px; opacity: .7;
    border-left: 1px solid rgb(var(--sf-bg) / .2);
  }
  .hide:hover { opacity: 1; background: rgb(var(--sf-bg) / .15); }
  .hide:focus-visible { outline: 2px solid rgb(var(--sf-ring)); }
  @media (prefers-reduced-motion: reduce) { .w, .tip { transition: none; } }
`

const POS_KEY = '__smartfill_widget_y__'
const HEIGHT = 40
const MARGIN = 12
const CLOSE_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'

// Vertical position as a fraction of the viewport, so it survives window resizes.
function loadY() {
  try {
    const y = Number(localStorage.getItem(POS_KEY))
    if (y > 0 && y < 1) return y
  } catch {}
  return 0.5
}

// actions: { fill() } returning a promise
export function mountWidget(actions) {
  const layer = createLayer('__smartfill_widget__', CSS)
  const wrap = el('div', 'w sf')
  const fab = el('button', 'fab')
  fab.type = 'button'
  fab.innerHTML = LOGO_SVG
  const badge = el('span', 'count')
  badge.hidden = true
  fab.appendChild(badge)

  const tip = el('div', 'tip')
  const tipText = el('button', 'tip-fill', 'Fill this page')
  tipText.type = 'button'
  tipText.tabIndex = -1 // the round button is the keyboard target
  const hide = el('button', 'hide')
  hide.type = 'button'
  hide.setAttribute('aria-label', 'Hide SmartFill on this page')
  hide.title = 'Hide on this page'
  hide.innerHTML = CLOSE_SVG
  tip.append(tipText, hide)

  const tipWrap = el('div', 'tip-wrap')
  tipWrap.appendChild(tip)
  wrap.append(fab, tipWrap)
  layer.root.appendChild(wrap)

  let yFrac = loadY()
  let busy = false
  let hidden = false

  const place = () => {
    const y = Math.min(Math.max(MARGIN, yFrac * innerHeight - HEIGHT / 2), innerHeight - HEIGHT - MARGIN)
    wrap.style.top = `${y}px`
  }
  place()
  window.addEventListener('resize', place)

  // Drag vertically along the edge; a press without movement is a click.
  let drag = null
  fab.addEventListener('pointerdown', (e) => {
    drag = { y: e.clientY, moved: false }
    fab.setPointerCapture(e.pointerId)
  })
  fab.addEventListener('pointermove', (e) => {
    if (!drag) return
    if (!drag.moved && Math.abs(e.clientY - drag.y) < 5) return
    drag.moved = true
    wrap.classList.add('dragging')
    yFrac = e.clientY / innerHeight
    place()
  })
  fab.addEventListener('pointerup', () => {
    if (!drag) return
    if (drag.moved) {
      try { localStorage.setItem(POS_KEY, String(yFrac)) } catch {}
      fab.dataset.dragged = '1'
    }
    drag = null
    wrap.classList.remove('dragging')
  })

  const fill = async () => {
    if (busy) return
    busy = true
    fab.classList.add('busy')
    try { await actions.fill() } finally {
      busy = false
      fab.classList.remove('busy')
    }
  }
  fab.addEventListener('click', () => {
    if (fab.dataset.dragged) { delete fab.dataset.dragged; return }
    fill()
  })
  tipText.addEventListener('click', fill)

  // Hidden until the page is reloaded; to turn it off for good, use the popup or settings.
  hide.addEventListener('click', () => {
    layer.host.style.display = 'none'
    hidden = true
  })

  return {
    setCount(n) {
      badge.hidden = !n
      badge.textContent = n > 99 ? '99+' : String(n)
      const label = n ? `Fill ${n} field${n === 1 ? '' : 's'}` : 'Fill this page'
      tipText.textContent = label
      fab.setAttribute('aria-label', `SmartFill: ${label}`)
      layer.host.style.display = n && !hidden ? '' : 'none'
    },
    destroy() {
      window.removeEventListener('resize', place)
      layer.remove()
    },
  }
}
