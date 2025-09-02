// Content script
import { findFillableInputs, fillFields } from '../lib/detectFields'

console.debug('SmartFill content script loaded')

// Floating action button in Shadow DOM
function ensureButton() {
  const id = '__smartfill_shadow_root__'
  if (document.getElementById(id)) return

  const host = document.createElement('div')
  host.id = id
  Object.assign(host.style, {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    zIndex: 2147483647,
  })
  document.documentElement.appendChild(host)

  const root = host.attachShadow({ mode: 'closed' })
  const btn = document.createElement('button')
  btn.textContent = 'SmartFill'
  Object.assign(btn.style, {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
    background: '#2563eb',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '9999px',
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    cursor: 'pointer',
  })
  btn.onmouseenter = () => (btn.style.background = '#1e40af')
  btn.onmouseleave = () => (btn.style.background = '#2563eb')
  btn.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ type: 'AUTOFILL_ACTIVE' })
  })
  root.appendChild(btn)
}

ensureButton()

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
