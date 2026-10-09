// On-page UI for the fill preview, toasts and the "remember this field" prompt.
import { createLayer, el } from './shadow'

const CSS = `
  .box {
    position: fixed; pointer-events: none; border: 2px solid rgb(var(--sf-accent)); border-radius: 7px;
    background: rgb(var(--sf-accent) / .06); transition: border-color .15s, background-color .15s;
  }
  .box.skipped { border-style: dashed; border-color: rgb(var(--sf-fg-subtle)); background: transparent; }
  /* Tags sit inside the field (right side) so they never cover the page's own labels. */
  .tag {
    all: unset; pointer-events: auto; cursor: pointer; position: absolute; right: 5px; top: 50%; transform: translateY(-50%);
    max-width: calc(100% - 12px); display: flex; gap: 6px; align-items: baseline; overflow: hidden; white-space: nowrap;
    padding: 2px 7px; border-radius: 5px; font: 600 11px/16px var(--sf-font-sans);
    background: rgb(var(--sf-accent)); color: rgb(var(--sf-accent-fg)); box-shadow: var(--sf-shadow-sm);
  }
  .tag .v { font-weight: 400; opacity: .9; overflow: hidden; text-overflow: ellipsis; }
  .tag:focus-visible { outline: 2px solid rgb(var(--sf-ring)); outline-offset: 2px; }
  .box.tall .tag { top: 6px; transform: none; }
  .skipped .tag { background: rgb(var(--sf-surface)); color: rgb(var(--sf-fg-muted)); box-shadow: inset 0 0 0 1px rgb(var(--sf-line)); }
  .skipped .tag .v { text-decoration: line-through; }

  .bar {
    position: fixed; top: 14px; left: 50%; transform: translateX(-50%); pointer-events: auto;
    display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 14px;
  }
  .bar .hint { color: rgb(var(--sf-fg-muted)); font-size: 12px; margin-right: 4px; }

  /* Bottom centre, so it never collides with the floating button in a corner. */
  .toasts { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; align-items: center; }
  .toast { pointer-events: auto; display: flex; align-items: center; gap: 12px; max-width: 360px; padding: 10px 14px; }
  .toast.danger { border-color: rgb(var(--sf-danger) / .5); }

  .prompt { position: fixed; pointer-events: auto; width: 280px; padding: 12px 14px; }
  .prompt p { margin: 0 0 10px; }
  .prompt .actions { display: flex; gap: 8px; justify-content: flex-end; }
  .prompt .sf-btn { height: 28px; padding: 0 10px; font-size: 12px; }
`

let layer = null
const getLayer = () => (layer && layer.host.isConnected ? layer : (layer = createLayer('__smartfill_overlay__', CSS)))

// Keep elements positioned over page fields while the page scrolls or resizes.
function track(update) {
  let raf = 0
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update() }) }
  update()
  window.addEventListener('scroll', schedule, true)
  window.addEventListener('resize', schedule)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', schedule, true)
    window.removeEventListener('resize', schedule)
  }
}

const truncate = (s, n = 36) => (String(s).length > n ? String(s).slice(0, n) + '…' : String(s))
const fieldsLabel = (n) => `${n} field${n === 1 ? '' : 's'}`

// ---------- Preview ----------

let cleanupPreview = null

export function clearPreview() {
  cleanupPreview?.()
  cleanupPreview = null
}

// entries: [{ el, label, value }]. onConfirm receives the Set of skipped entry indexes.
export function showPreview(entries, { onConfirm, onCancel }) {
  clearPreview()
  const { root } = getLayer()
  const nodes = []
  const skipped = new Set()

  const boxes = entries.map(({ label, value }, i) => {
    const box = el('div', 'box')
    const tag = el('button', 'tag')
    tag.type = 'button'
    tag.append(el('span', null, label), el('span', 'v', truncate(value)))
    tag.title = 'Click to skip this field'
    tag.addEventListener('click', (e) => {
      e.stopPropagation()
      skipped.has(i) ? skipped.delete(i) : skipped.add(i)
      box.classList.toggle('skipped', skipped.has(i))
      tag.title = skipped.has(i) ? 'Click to fill this field' : 'Click to skip this field'
      updateBar()
    })
    box.appendChild(tag)
    root.appendChild(box)
    nodes.push(box)
    return box
  })

  const untrack = track(() => {
    entries.forEach(({ el: target }, i) => {
      const r = target.getBoundingClientRect()
      const b = boxes[i]
      const visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight
      b.style.display = visible ? 'block' : 'none'
      if (!visible) return
      Object.assign(b.style, { left: `${r.left - 3}px`, top: `${r.top - 3}px`, width: `${r.width + 6}px`, height: `${r.height + 6}px` })
      b.classList.toggle('tall', r.height > 56) // textareas: tag in the top-right corner
    })
  })

  const bar = el('div', 'sf sf-card sf-enter bar')
  const hint = el('span', 'hint', 'Click a label to skip it')
  const fill = el('button', 'sf-btn sf-primary')
  const cancel = el('button', 'sf-btn sf-secondary', 'Cancel')
  fill.type = cancel.type = 'button'
  bar.append(hint, cancel, fill)
  root.appendChild(bar)
  nodes.push(bar)

  function updateBar() {
    const count = entries.length - skipped.size
    fill.textContent = skipped.size ? `Fill ${count} of ${entries.length}` : `Fill ${fieldsLabel(count)}`
    fill.disabled = count === 0
  }
  updateBar()

  const onKey = (e) => {
    if (e.key === 'Enter' && !fill.disabled) { e.preventDefault(); e.stopPropagation(); done(true) }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false) }
  }
  document.addEventListener('keydown', onKey, true)

  cleanupPreview = () => {
    untrack()
    document.removeEventListener('keydown', onKey, true)
    nodes.forEach((n) => n.remove())
  }

  function done(ok) {
    clearPreview()
    ok ? onConfirm?.(skipped) : onCancel?.()
  }
  fill.addEventListener('click', () => done(true))
  cancel.addEventListener('click', () => done(false))
  fill.focus()
}

// ---------- Toasts ----------

let toastStack = null

export function showToast(text, { actionLabel, onAction, timeout = 3500, tone } = {}) {
  const { root } = getLayer()
  if (!toastStack?.isConnected) {
    toastStack = el('div', 'toasts')
    root.appendChild(toastStack)
  }
  // One message at a time keeps the page calm.
  toastStack.replaceChildren()
  const t = el('div', `sf sf-card sf-enter toast${tone === 'danger' ? ' danger' : ''}`)
  t.setAttribute('role', 'status')
  t.appendChild(el('span', null, text))
  if (actionLabel) {
    const btn = el('button', 'sf-link accent', actionLabel)
    btn.type = 'button'
    btn.addEventListener('click', () => { t.remove(); onAction?.() })
    t.appendChild(btn)
  }
  toastStack.appendChild(t)
  setTimeout(() => t.remove(), timeout)
}

// ---------- Prompt anchored to a field ----------

let cleanupPrompt = null

export function showFieldPrompt(target, text, { actionLabel, onAction, timeout = 12000 }) {
  cleanupPrompt?.()
  const { root } = getLayer()
  const box = el('div', 'sf sf-card sf-enter prompt')
  box.setAttribute('role', 'dialog')
  box.setAttribute('aria-label', 'SmartFill')
  box.appendChild(el('p', null, text))
  const actions = el('div', 'actions')
  const no = el('button', 'sf-btn sf-secondary', 'Not now')
  const yes = el('button', 'sf-btn sf-primary', actionLabel)
  no.type = yes.type = 'button'
  actions.append(no, yes)
  box.appendChild(actions)
  root.appendChild(box)

  const untrack = track(() => {
    const r = target.getBoundingClientRect()
    const below = r.bottom + 8 + box.offsetHeight < innerHeight
    // Right-aligned to the field so the next field's label (usually on the left) stays visible.
    const left = Math.min(Math.max(8, r.right - box.offsetWidth), innerWidth - box.offsetWidth - 8)
    Object.assign(box.style, { left: `${left}px`, top: `${below ? r.bottom + 8 : Math.max(8, r.top - box.offsetHeight - 8)}px` })
  })
  const timer = setTimeout(close, timeout)
  function close() {
    clearTimeout(timer)
    untrack()
    box.remove()
    cleanupPrompt = null
  }
  cleanupPrompt = close
  no.addEventListener('click', close)
  yes.addEventListener('click', () => { close(); onAction?.() })
}
