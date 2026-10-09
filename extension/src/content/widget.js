// Floating SmartFill button shown on pages with form fields. A small round button with a
// field count; clicking it opens a compact panel. Draggable, snaps to the nearest side.
import { createLayer, el, LOGO_SVG } from './shadow'

const CSS = `
  .w { position: fixed; pointer-events: auto; }
  .fab {
    all: unset; cursor: pointer; position: relative; width: 40px; height: 40px; border-radius: 50%;
    display: grid; place-items: center; background: rgb(var(--sf-surface));
    box-shadow: var(--sf-shadow-md), inset 0 0 0 1px rgb(var(--sf-line)); transition: transform .15s;
    touch-action: none;
  }
  .fab:hover { transform: scale(1.05); }
  .fab:focus-visible { outline: 2px solid rgb(var(--sf-ring) / .7); outline-offset: 2px; }
  .fab svg { width: 20px; height: 20px; }
  .count {
    position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
    background: rgb(var(--sf-accent)); color: rgb(var(--sf-accent-fg)); font: 600 10px/18px var(--sf-font-sans); text-align: center;
    box-shadow: 0 0 0 2px rgb(var(--sf-surface));
  }
  .panel { position: absolute; bottom: 52px; width: 264px; padding: 12px; }
  .w.left .panel { left: 0; } .w.right .panel { right: 0; }
  .w.top .panel { bottom: auto; top: 52px; }
  .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .head strong { font-size: 13px; font-weight: 600; }
  .lbl { display: block; font-size: 12px; color: rgb(var(--sf-fg-muted)); margin-bottom: 4px; }
  select {
    all: unset; box-sizing: border-box; width: 100%; height: 32px; padding: 0 28px 0 10px; border-radius: 8px; cursor: pointer;
    font: 13px var(--sf-font-sans); color: rgb(var(--sf-fg)); background: rgb(var(--sf-surface));
    box-shadow: inset 0 0 0 1px rgb(var(--sf-line));
    background-image: linear-gradient(45deg, transparent 50%, rgb(var(--sf-fg-subtle)) 50%), linear-gradient(135deg, rgb(var(--sf-fg-subtle)) 50%, transparent 50%);
    background-position: calc(100% - 15px) 14px, calc(100% - 11px) 14px; background-size: 4px 4px; background-repeat: no-repeat;
  }
  select:focus-visible { box-shadow: inset 0 0 0 1px rgb(var(--sf-accent)), 0 0 0 3px rgb(var(--sf-ring) / .25); }
  .fill { width: 100%; margin-top: 10px; }
  .status { min-height: 0; margin-top: 8px; font-size: 12px; color: rgb(var(--sf-fg-muted)); }
  .status:empty { display: none; }
  .foot { display: flex; gap: 12px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgb(var(--sf-line)); }
  .foot .sf-link { font-size: 12px; }
  .foot .push { margin-left: auto; }
`

const POS_KEY = '__smartfill_widget_pos__'
const SIZE = 40
const MARGIN = 16

const CLOSE_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'

function loadPos() {
  try {
    const p = JSON.parse(localStorage.getItem(POS_KEY) || 'null')
    if (p && (p.side === 'left' || p.side === 'right') && typeof p.y === 'number') return p
  } catch {}
  return { side: 'right', y: null } // null = default bottom position
}

// actions: { fill(), undo(), openSettings(), turnOffHere() } returning promises of status text
export function mountWidget(actions) {
  const layer = createLayer('__smartfill_widget__', CSS)
  const root = layer.root
  const wrap = el('div', 'w sf')
  const fab = el('button', 'fab')
  fab.type = 'button'
  fab.setAttribute('aria-label', 'Open SmartFill')
  fab.setAttribute('aria-expanded', 'false')
  fab.innerHTML = LOGO_SVG
  const badge = el('span', 'count')
  badge.hidden = true
  fab.appendChild(badge)
  wrap.appendChild(fab)
  root.appendChild(wrap)

  let count = 0
  let panel = null
  let pos = loadPos()

  // ---- position ----
  function place() {
    const y = pos.y == null ? innerHeight - SIZE - MARGIN - 8 : Math.min(Math.max(MARGIN, pos.y), innerHeight - SIZE - MARGIN)
    wrap.style.top = `${y}px`
    wrap.style.left = pos.side === 'left' ? `${MARGIN}px` : `${innerWidth - SIZE - MARGIN}px`
    wrap.classList.toggle('left', pos.side === 'left')
    wrap.classList.toggle('right', pos.side !== 'left')
    wrap.classList.toggle('top', y < 360) // open the panel downward near the top of the screen
  }
  place()
  window.addEventListener('resize', place)

  // ---- drag (snaps to the nearest side) ----
  let drag = null
  fab.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, moved: false }
    fab.setPointerCapture(e.pointerId)
  })
  fab.addEventListener('pointermove', (e) => {
    if (!drag) return
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return
    drag.moved = true
    closePanel()
    wrap.style.left = `${e.clientX - SIZE / 2}px`
    wrap.style.top = `${e.clientY - SIZE / 2}px`
  })
  fab.addEventListener('pointerup', (e) => {
    if (!drag) return
    const moved = drag.moved
    drag = null
    if (!moved) return
    pos = { side: e.clientX < innerWidth / 2 ? 'left' : 'right', y: e.clientY - SIZE / 2 }
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos)) } catch {}
    place()
    fab.dataset.dragged = '1'
  })
  fab.addEventListener('click', () => {
    if (fab.dataset.dragged) { delete fab.dataset.dragged; return }
    panel ? closePanel() : openPanel()
  })

  // ---- panel ----
  async function openPanel() {
    panel = el('div', 'sf-card sf-enter panel')
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', 'SmartFill')

    const head = el('div', 'head')
    head.appendChild(el('strong', null, 'SmartFill'))
    const close = el('button', 'sf-icon-btn')
    close.type = 'button'
    close.setAttribute('aria-label', 'Close')
    close.innerHTML = CLOSE_SVG
    close.addEventListener('click', closePanel)
    head.appendChild(close)

    const lbl = el('label', 'lbl', 'Profile')
    lbl.htmlFor = 'sf-w-profile'
    const select = el('select')
    select.id = 'sf-w-profile'

    const fill = el('button', 'sf-btn sf-primary fill', count ? `Fill ${count} field${count === 1 ? '' : 's'}` : 'Fill this page')
    fill.type = 'button'
    const status = el('div', 'status')
    status.setAttribute('aria-live', 'polite')

    const foot = el('div', 'foot')
    const undo = el('button', 'sf-link', 'Undo')
    const settings = el('button', 'sf-link', 'Settings')
    const hide = el('button', 'sf-link push', 'Turn off here')
    undo.type = settings.type = hide.type = 'button'
    foot.append(undo, settings, hide)

    panel.append(head, lbl, select, fill, status, foot)
    wrap.appendChild(panel)
    fab.setAttribute('aria-expanded', 'true')
    fill.focus()

    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_PROFILES' })
      for (const p of res?.profiles || []) {
        const opt = el('option', null, p.name || 'Profile')
        opt.value = p.id
        opt.selected = p.id === res.activeProfileId
        select.appendChild(opt)
      }
    } catch {}

    const run = async (fn) => {
      try {
        const text = await fn()
        if (text) status.textContent = text
      } catch {
        status.textContent = 'Something went wrong.'
      }
    }
    select.addEventListener('change', () => run(async () => {
      await chrome.runtime.sendMessage({ type: 'SET_ACTIVE_PROFILE', id: select.value })
      return `Using ${select.selectedOptions[0]?.textContent}.`
    }))
    fill.addEventListener('click', () => run(async () => {
      const text = await actions.fill()
      closePanel()
      return text
    }))
    undo.addEventListener('click', () => run(actions.undo))
    settings.addEventListener('click', () => { closePanel(); actions.openSettings() })
    hide.addEventListener('click', () => run(actions.turnOffHere))

    document.addEventListener('pointerdown', onOutside, true)
    document.addEventListener('keydown', onKey, true)
  }

  function closePanel() {
    if (!panel) return
    panel.remove()
    panel = null
    fab.setAttribute('aria-expanded', 'false')
    document.removeEventListener('pointerdown', onOutside, true)
    document.removeEventListener('keydown', onKey, true)
  }
  const onOutside = (e) => {
    if (!e.composedPath().includes(layer.host)) closePanel()
  }
  const onKey = (e) => {
    if (e.key === 'Escape') { closePanel(); fab.focus() }
  }

  return {
    setCount(n) {
      count = n
      badge.hidden = !n
      badge.textContent = n > 99 ? '99+' : String(n)
      fab.setAttribute('aria-label', n ? `Open SmartFill (${n} fields to fill)` : 'Open SmartFill')
      layer.host.style.display = n ? '' : 'none'
    },
    destroy() {
      closePanel()
      window.removeEventListener('resize', place)
      layer.remove()
    },
  }
}
