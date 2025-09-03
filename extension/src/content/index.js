// Content script
import { findFillableInputs, fillFields } from '../lib/detectFields'

console.debug('SmartFill content script loaded')

// Draggable SmartFill widget in Shadow DOM with profile switcher
function ensureWidget() {
  const id = '__smartfill_shadow_root__'
  if (document.getElementById(id)) return

  const host = document.createElement('div')
  host.id = id
  Object.assign(host.style, {
    position: 'fixed',
    top: 'auto',
    left: 'auto',
    bottom: '16px',
    right: '16px',
    zIndex: 2147483647,
  })
  document.documentElement.appendChild(host)

  const root = host.attachShadow({ mode: 'closed' })

  // Styles
  const style = document.createElement('style')
  style.textContent = `
    :host { all: initial; }
    .sf-card { position: relative; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; width: 240px; background: #fff; color: #111827; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 24px rgba(0,0,0,0.12); overflow: hidden; }
    .sf-header { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; background: rgba(255,255,255,0.9); border-bottom: 1px solid #f3f4f6; cursor: default; user-select: none; }
    .sf-title { display:flex; align-items:center; gap:8px; font-weight: 600; font-size: 13px; color:#111827; }
    .sf-title .dot { width: 20px; height: 20px; border-radius: 6px; background: #1d4ed8; display:grid; place-items:center; }
    .sf-header .collapse { cursor:pointer; border:none; background:transparent; color:#6b7280; padding:4px; border-radius:6px; }
    .sf-header .collapse:hover { background:#f3f4f6; }
    .sf-handle { position:absolute; top:-8px; left:50%; transform:translateX(-50%); width:30px; height:30px; background:#ffffff; color:#9ca3af; border-radius: 9999px; display:flex; align-items:center; justify-content:center; cursor: move; border:1px solid transparent; box-shadow: none; }
    .sf-handle:hover { box-shadow: none; }
    .sf-body { padding: 10px; display: grid; gap: 8px; }
    .sf-row { display:grid; gap:6px; }
    .sf-label { font-size: 11px; color:#6b7280; }
    .sf-select { appearance:none; width:100%; padding:6px 28px 6px 10px; font-size:12px; border:1px solid #d1d5db; border-radius:8px; background:#fff; color:#111827; outline:none; }
    .sf-select:focus { border-color:#2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.15); }
    .sf-select-wrap { position:relative; }
    .sf-select-wrap svg { position:absolute; right:8px; top:50%; transform:translateY(-50%); width:14px; height:14px; color:#6b7280; pointer-events:none; }
    .sf-actions { display:flex; gap:8px; }
    .sf-btn { flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:8px 10px; border-radius:8px; font-size:12px; border:1px solid #e5e7eb; background:#f9fafb; color:#111827; cursor:pointer; }
    .sf-btn:hover { background:#f3f4f6; }
    .sf-btn.primary { background:#2563eb; color:#fff; border-color:#2563eb; }
    .sf-btn.primary:hover { background:#1e40af; }
    .sf-status { font-size: 11px; color:#374151; }
    .sf-collapsed { display:none; align-items:center; justify-content:center; width:36px; height:36px; border-radius:9999px; background:#2563eb; color:#fff; box-shadow: 0 10px 24px rgba(0,0,0,0.12); border: none; cursor: move; }
    .sf-collapsed:hover { background:#1e40af; }
    .sf-collapsed svg { width:18px; height:18px; }
  `

  // Constants for geometry
  const CARD_W = 240 // must match .sf-card width
  const HANDLE_CENTER_Y = 7 // handle top -8px + radius 15px => 7px from card top
  const COLLAPSED_SIZE = 36 // must match .sf-collapsed width/height

  // Card
  const card = document.createElement('div')
  card.className = 'sf-card'

  // Header (no drag — drag is on top handle)
  const header = document.createElement('div')
  header.className = 'sf-header'
  header.setAttribute('role', 'toolbar')
  header.setAttribute('aria-label', 'SmartFill toolbar')
  const title = document.createElement('div')
  title.className = 'sf-title'
  const dot = document.createElement('div')
  dot.className = 'dot'
  dot.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path fill="#ffffff" d="M13.5 2.5l-8 10.2c-.2.3 0 .8.4.8h6.2l-1.2 7.4c-.1.6.7.9 1.1.4l8-10.2c.2-.3 0-.8-.4-.8h-6.2l1.2-7.4c.1-.6-.7-.9-1.1-.4z"/>
    </svg>
  `
  const name = document.createElement('div')
  name.textContent = 'SmartFill'
  title.appendChild(dot)
  title.appendChild(name)
  header.appendChild(title)
  const collapseBtn = document.createElement('button')
  collapseBtn.className = 'collapse'
  collapseBtn.setAttribute('aria-label', 'Collapse SmartFill')
  collapseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M6 12h12"/></svg>'
  header.appendChild(collapseBtn)

  // Body
  const body = document.createElement('div')
  body.className = 'sf-body'

  // Profile switcher
  const row = document.createElement('div')
  row.className = 'sf-row'
  const label = document.createElement('label')
  label.className = 'sf-label'
  label.textContent = 'Active profile'
  const selectWrap = document.createElement('div')
  selectWrap.className = 'sf-select-wrap'
  const select = document.createElement('select')
  select.className = 'sf-select'
  select.setAttribute('aria-label', 'Active profile')
  const caret = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  caret.setAttribute('viewBox', '0 0 24 24')
  caret.innerHTML = '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" />'
  selectWrap.appendChild(select)
  selectWrap.appendChild(caret)
  row.appendChild(label)
  row.appendChild(selectWrap)

  // Actions
  const actions = document.createElement('div')
  actions.className = 'sf-actions'
  const fillBtn = document.createElement('button')
  fillBtn.className = 'sf-btn primary'
  fillBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M6 12h12"/><path d="M12 6v12"/></svg><span>Autofill</span>'
  const optionsBtn = document.createElement('button')
  optionsBtn.className = 'sf-btn'
  optionsBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.08a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.08a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.08a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.25 1 1.51H21a2 2 0 1 1 0 4h-.08a1.65 1.65 0 0 0-1.51 1Z"/></svg><span>Options</span>'
  actions.appendChild(fillBtn)
  actions.appendChild(optionsBtn)

  // Status
  const status = document.createElement('div')
  status.className = 'sf-status'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')

  body.appendChild(row)
  body.appendChild(actions)
  body.appendChild(status)

  card.appendChild(header)
  card.appendChild(body)

  root.appendChild(style)
  // Top-center drag handle above the card
  const handle = document.createElement('button')
  handle.className = 'sf-handle'
  handle.setAttribute('aria-label', 'Move SmartFill')
  handle.setAttribute('title', 'Drag to move')
  handle.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <g fill="#9ca3af">
        <circle cx="8" cy="7" r="1.4"/>
        <circle cx="12" cy="7" r="1.4"/>
        <circle cx="16" cy="7" r="1.4"/>
        <circle cx="8" cy="12" r="1.4"/>
        <circle cx="12" cy="12" r="1.4"/>
        <circle cx="16" cy="12" r="1.4"/>
      </g>
    </svg>
  `
  // Collapsed button (shows only an icon)
  const collapsedBtn = document.createElement('button')
  collapsedBtn.className = 'sf-collapsed'
  collapsedBtn.setAttribute('aria-label', 'Expand SmartFill')
  collapsedBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
      <path fill="currentColor" d="M13.5 2.5l-8 10.2c-.2.3 0 .8.4.8h6.2l-1.2 7.4c-.1.6.7.9 1.1.4l8-10.2c.2-.3 0-.8-.4-.8h-6.2l1.2-7.4c.1-.6-.7-.9-1.1-.4z"/>
    </svg>
  `

  root.appendChild(card)
  root.appendChild(handle)
  root.appendChild(collapsedBtn)

  // Collapsed state handling
  const collapsedKey = '__smartfill_widget_collapsed__'
  let collapsed = false
  try { collapsed = localStorage.getItem(collapsedKey) === '1' } catch {}
  const renderVisibility = () => {
    const isCollapsed = !!collapsed
    card.style.display = isCollapsed ? 'none' : 'block'
    collapsedBtn.style.display = isCollapsed ? 'flex' : 'none'
    if (typeof handle !== 'undefined') {
      handle.style.display = isCollapsed ? 'none' : 'flex'
      handle.setAttribute('aria-hidden', isCollapsed ? 'true' : 'false')
    }
  }
  renderVisibility()
  const setCollapsed = (val) => {
    collapsed = !!val
    try { localStorage.setItem(collapsedKey, collapsed ? '1' : '0') } catch {}
    renderVisibility()
  }
  collapseBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    // Move host so the collapsed icon center matches current handle center
    try {
      const rect = host.getBoundingClientRect()
      const handleCenterX = rect.left + CARD_W / 2
      const handleCenterY = rect.top + HANDLE_CENTER_Y
      let x = Math.round(handleCenterX - COLLAPSED_SIZE / 2)
      let y = Math.round(handleCenterY - COLLAPSED_SIZE / 2)
      x = Math.max(8, Math.min(window.innerWidth - COLLAPSED_SIZE - 8, x))
      y = Math.max(8, Math.min(window.innerHeight - COLLAPSED_SIZE - 8, y))
      host.style.left = x + 'px'
      host.style.top = y + 'px'
      host.style.right = 'auto'
      host.style.bottom = 'auto'
    } catch {}
    setCollapsed(true)
  })
  collapsedBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    // Suppress expand if the click was the end of a drag gesture
    if (wasDragging) { wasDragging = false; return }
    // Position the host so that the card opens centered under where the handle sits
    try {
      const rect = collapsedBtn.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      let x = Math.round(centerX - CARD_W / 2)
      let y = Math.round(centerY - HANDLE_CENTER_Y)
      // clamp to viewport with small margins
      x = Math.max(8, Math.min(window.innerWidth - CARD_W - 8, x))
      y = Math.max(8, Math.min(window.innerHeight - 40, y))
      host.style.left = x + 'px'
      host.style.top = y + 'px'
      host.style.right = 'auto'
      host.style.bottom = 'auto'
    } catch {}
    setCollapsed(false)
  })

  // Load profiles
  async function loadProfiles() {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_PROFILES' })
      select.innerHTML = ''
      if (res?.ok) {
        const list = res.profiles || []
        const active = res.activeProfileId || ''
        for (const p of list) {
          const opt = document.createElement('option')
          opt.value = p.id
          opt.textContent = p.name || 'Profile'
          if (p.id === active) opt.selected = true
          select.appendChild(opt)
        }
      }
    } catch {}
  }
  loadProfiles()

  select.addEventListener('change', async (e) => {
    const id = e.target.value
    try {
      await chrome.runtime.sendMessage({ type: 'SET_ACTIVE_PROFILE', id })
      status.textContent = 'Active: ' + (e.target.selectedOptions[0]?.textContent || 'Profile')
      setTimeout(() => (status.textContent = ''), 1200)
    } catch (err) {
      status.textContent = 'Error switching profile'
      setTimeout(() => (status.textContent = ''), 1500)
    }
  })

  fillBtn.addEventListener('click', async () => {
    status.textContent = 'Autofilling…'
    try {
      const res = await chrome.runtime.sendMessage({ type: 'AUTOFILL_ACTIVE' })
      status.textContent = res?.ok ? `Filled ${res?.filled ?? 0} field(s)` : 'Autofill failed'
    } catch {
      status.textContent = 'Autofill failed'
    } finally {
      setTimeout(() => (status.textContent = ''), 1500)
    }
  })

  optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage())

  // Drag logic
  const posKey = '__smartfill_widget_pos__'
  const saved = (() => { try { return JSON.parse(localStorage.getItem(posKey) || 'null') } catch { return null } })()
  if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
    host.style.top = Math.max(8, Math.min(window.innerHeight - 40, saved.y)) + 'px'
    host.style.left = Math.max(8, Math.min(window.innerWidth - 40, saved.x)) + 'px'
    host.style.bottom = 'auto'
    host.style.right = 'auto'
  }

  let dragging = false
  let offsetX = 0
  let offsetY = 0
  let startX = 0
  let startY = 0
  let wasDragging = false
  const startDrag = (clientX, clientY) => {
    const rect = host.getBoundingClientRect()
    dragging = true
    wasDragging = false
    startX = clientX
    startY = clientY
    offsetX = clientX - rect.left
    offsetY = clientY - rect.top
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }
  const onMove = (e) => {
    if (!dragging) return
    const dx = (e.clientX ?? 0) - startX
    const dy = (e.clientY ?? 0) - startY
    if (Math.hypot(dx, dy) > 3) wasDragging = true
    const x = Math.max(8, Math.min(window.innerWidth - 40, e.clientX - offsetX))
    const y = Math.max(8, Math.min(window.innerHeight - 40, e.clientY - offsetY))
    host.style.left = x + 'px'
    host.style.top = y + 'px'
    host.style.right = 'auto'
    host.style.bottom = 'auto'
  }
  const onUp = () => {
    if (!dragging) return
    dragging = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    // persist
    const rect = host.getBoundingClientRect()
    try { localStorage.setItem(posKey, JSON.stringify({ x: rect.left, y: rect.top })) } catch {}
  }
  // Drag from top handle (expanded) and from collapsed button (collapsed)
  handle.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY))
  collapsedBtn.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY))
  handle.addEventListener('touchstart', (e) => {
    const t = e.touches[0]
    startDrag(t.clientX, t.clientY)
  }, { passive: true })
  collapsedBtn.addEventListener('touchstart', (e) => {
    const t = e.touches[0]
    startDrag(t.clientX, t.clientY)
  }, { passive: true })
  document.addEventListener('touchmove', (e) => {
    if (!dragging) return
    const t = e.touches[0]
    onMove(t)
  }, { passive: true })
  document.addEventListener('touchend', onUp)
}

// Remove the widget host if present
function removeWidget() {
  const id = '__smartfill_shadow_root__'
  const host = document.getElementById(id)
  if (host) host.remove()
}

// Initialize based on settings and react to changes
;(async () => {
  try {
    const { widgetEnabled } = await chrome.storage.local.get(['widgetEnabled'])
    if (widgetEnabled === false) {
      removeWidget()
    } else {
      ensureWidget()
    }
  } catch {
    // default to showing widget on error
    ensureWidget()
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !('widgetEnabled' in changes)) return
      const val = changes.widgetEnabled?.newValue
      if (val === false) removeWidget()
      else ensureWidget()
    })
  } catch {}
})()

// Listen for messages to perform autofill
function urlMatches(pattern) {
  if (!pattern) return true
  try {
    // Support /regex/ or wildcard * patterns
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      const re = new RegExp(pattern.slice(1, -1))
      return re.test(location.href)
    }
    const re = new RegExp('^' + pattern.replace(/[.+^${}()|[\\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
    return re.test(location.host) || re.test(location.href)
  } catch {
    return false
  }
}

function buildFieldMapWithRules(rules = [], profile = {}) {
  const map = {}
  const applicable = rules.filter((r) => urlMatches(r.sitePattern))
  for (const r of applicable) {
    try {
      // selector-based
      if (r.selector) {
        const nodes = document.querySelectorAll(r.selector)
        nodes.forEach((el) => {
          const key = r.key
          if (key && !map[key]) map[key] = el
        })
      }
      // labelRegex-based (match visible nearby question/label text)
      if (r.labelRegex) {
        const re = new RegExp(r.labelRegex, 'i')
        const candidates = document.querySelectorAll('[role="textbox"], [contenteditable]:not([contenteditable="false"]), input, textarea, select')
        candidates.forEach((el) => {
          const title = el.closest('[role="listitem"], .freebirdFormviewerComponentsQuestionBaseRoot, .m2, .o3Dpx')?.querySelector('[role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle, .M7eMe, label')?.textContent?.trim() || ''
          const label = el.getAttribute('aria-label') || el.placeholder || ''
          if (re.test(title) || re.test(label)) {
            const key = r.key
            if (key && !map[key]) map[key] = el
          }
        })
      }
      // fixed value rule (selector + value without key)
      if (r.selector && r.value != null && !r.key) {
        const el = document.querySelector(r.selector)
        if (el) {
          // fill immediately
          fillFields({ __fixed: el }, { __fixed: r.value })
        }
      }
    } catch {}
  }
  return map
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'AUTOFILL') {
    const ruleMap = buildFieldMapWithRules(msg.rules || [], msg.profile)
    const autoMap = findFillableInputs(document)

    // Build mappings for custom fields (profile.customFields: [{ name, value }])
    const customMap = {}
    const customs = Array.isArray(msg?.profile?.customFields) ? msg.profile.customFields : []
    if (customs.length) {
      try {
        const candidates = document.querySelectorAll('[role="textbox"], [contenteditable]:not([contenteditable="false"]), input, textarea, select')
        customs.forEach((cf) => {
          const targetName = String(cf?.name || '').trim()
          if (!targetName || customMap[targetName]) return
          const re = new RegExp(`(^|\\b)${targetName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}($|\\b)`, 'i')
          let best = null
          candidates.forEach((el) => {
            const title = el.closest('[role="listitem"], .freebirdFormviewerComponentsQuestionBaseRoot, .m2, .o3Dpx')?.querySelector('[role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle, .M7eMe, label')?.textContent?.trim() || ''
            const label = el.getAttribute('aria-label') || el.placeholder || ''
            if (re.test(title) || re.test(label)) {
              if (!best) best = el
            }
          })
          if (best) customMap[targetName] = best
        })
      } catch {}
    }

    // Merge maps (priority: rules -> custom -> auto)
    const merged = { ...autoMap, ...customMap, ...ruleMap }

    // Merge custom field values into profile for fillFields
    const customVals = Object.fromEntries(customs.filter((c) => c?.name).map((c) => [c.name, c.value]))
    const profile = { ...msg.profile, ...customVals }

    const { filled } = fillFields(merged, profile)
    sendResponse({ ok: true, filled })
  }
})
