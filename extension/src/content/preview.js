// On-page UI for fill preview and toasts, isolated in a Shadow DOM layer.

const HOST_ID = '__smartfill_overlay__'

const CSS = `
  :host { all: initial; }
  .box { position: fixed; pointer-events: none; border: 2px solid #2563eb; border-radius: 6px; background: rgba(37,99,235,0.08); box-sizing: border-box; }
  .tag { position: absolute; left: -2px; top: -20px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
         font: 600 11px/16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color: #fff; background: #2563eb; padding: 1px 6px; border-radius: 4px; }
  .tag span { font-weight: 400; opacity: .9; }
  .bar, .toast { position: fixed; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 10px;
         font: 13px/18px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color: #111827; background: #fff;
         border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.18); padding: 10px 12px; pointer-events: auto; }
  .bar { top: 16px; }
  .toast { bottom: 24px; }
  .btn { all: unset; cursor: pointer; font-weight: 600; font-size: 13px; padding: 6px 12px; border-radius: 8px; }
  .primary { background: #2563eb; color: #fff; }
  .primary:hover { background: #1d4ed8; }
  .ghost { color: #374151; border: 1px solid #d1d5db; }
  .ghost:hover { background: #f9fafb; }
  .link { color: #2563eb; padding: 4px 6px; }
  .kbd { font-size: 11px; color: #6b7280; }
  @media (prefers-color-scheme: dark) {
    .bar, .toast { background: #1f2937; color: #f9fafb; border-color: #374151; }
    .ghost { color: #e5e7eb; border-color: #4b5563; }
    .ghost:hover { background: #374151; }
    .link { color: #93c5fd; }
  }
`

let layer = null

function getLayer() {
  if (layer?.host.isConnected) return layer
  const host = document.createElement('div')
  host.id = HOST_ID
  Object.assign(host.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 2147483647 })
  document.documentElement.appendChild(host)
  const root = host.attachShadow({ mode: 'closed' })
  const style = document.createElement('style')
  style.textContent = CSS
  root.appendChild(style)
  layer = { host, root }
  return layer
}

function el(tag, cls, text) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text != null) n.textContent = text
  return n
}

function preview(value) {
  const s = String(value)
  return s.length > 40 ? s.slice(0, 40) + '…' : s
}

let cleanupPreview = null

export function clearPreview() {
  cleanupPreview?.()
  cleanupPreview = null
}

// entries: [{ el, label, value }]
export function showPreview(entries, { onConfirm, onCancel }) {
  clearPreview()
  const { root } = getLayer()
  const nodes = []

  const boxes = entries.map(({ label, value }) => {
    const box = el('div', 'box')
    const tag = el('div', 'tag', label + ': ')
    tag.appendChild(el('span', null, preview(value)))
    box.appendChild(tag)
    root.appendChild(box)
    nodes.push(box)
    return box
  })

  let raf = 0
  const position = () => {
    raf = 0
    entries.forEach(({ el: target }, i) => {
      const r = target.getBoundingClientRect()
      const b = boxes[i]
      const visible = r.width > 0 && r.height > 0
      b.style.display = visible ? 'block' : 'none'
      if (!visible) return
      Object.assign(b.style, { left: r.left - 3 + 'px', top: r.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px' })
    })
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(position) }
  position()
  window.addEventListener('scroll', schedule, true)
  window.addEventListener('resize', schedule)

  const bar = el('div', 'bar')
  bar.appendChild(el('span', null, `SmartFill found ${entries.length} field${entries.length === 1 ? '' : 's'}`))
  const fill = el('button', 'btn primary', 'Fill')
  const cancel = el('button', 'btn ghost', 'Cancel')
  bar.append(fill, cancel, el('span', 'kbd', 'Enter / Esc'))
  root.appendChild(bar)
  nodes.push(bar)

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done(true) }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false) }
  }
  document.addEventListener('keydown', onKey, true)

  const teardown = () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', schedule, true)
    window.removeEventListener('resize', schedule)
    document.removeEventListener('keydown', onKey, true)
    nodes.forEach((n) => n.remove())
  }
  cleanupPreview = teardown

  function done(ok) {
    clearPreview()
    ok ? onConfirm?.() : onCancel?.()
  }
  fill.addEventListener('click', () => done(true))
  cancel.addEventListener('click', () => done(false))
  fill.focus()
}

let toastTimer = 0
let toastNode = null

export function showToast(text, { actionLabel, onAction, timeout = 3000 } = {}) {
  const { root } = getLayer()
  toastNode?.remove()
  clearTimeout(toastTimer)
  const t = el('div', 'toast')
  t.appendChild(el('span', null, text))
  if (actionLabel) {
    const btn = el('button', 'btn link', actionLabel)
    btn.addEventListener('click', () => {
      t.remove()
      onAction?.()
    })
    t.appendChild(btn)
  }
  root.appendChild(t)
  toastNode = t
  toastTimer = setTimeout(() => t.remove(), timeout)
}
