// Content script
import { findFillableInputs, fillFields, deriveProfile, snapshot, restore } from '../lib/detectFields'
import { PROFILE_FIELDS } from '../lib/profileFields'
import { showPreview, showToast, showFieldPrompt } from './preview'
import { mountWidget } from './widget'
import { buildSelector } from '../lib/selector'

console.debug('SmartFill content script loaded')

const isTop = window === window.top
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// ---------- On-page button ----------
// Shown only in the top frame, when enabled, when the site isn't turned off,
// and only while the page has fillable fields.

let siteBlocked = false
let widget = null
let lastCount = 0

const widgetActions = {
  async fill() {
    const res = await chrome.runtime.sendMessage({ type: 'AUTOFILL_ACTIVE' })
    if (!res?.ok) return res?.error || 'Could not fill this page.'
    return res.preview || res.filled ? '' : 'No fields to fill.'
  },
  async undo() {
    return undoFill() ? '' : 'Nothing to undo.'
  },
  openSettings() {
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' }).catch(() => {})
  },
  async turnOffHere() {
    await chrome.runtime.sendMessage({ type: 'SET_SITE_BLOCKED', host: location.host, blocked: true })
    showToast(`SmartFill is off on ${location.host}. Turn it back on from the toolbar button.`, { timeout: 6000 })
    return ''
  },
}

function applyWidgetState(widgetEnabled, blockedSites) {
  siteBlocked = Array.isArray(blockedSites) && blockedSites.includes(location.host)
  const wanted = isTop && widgetEnabled !== false && !siteBlocked
  if (wanted && !widget) {
    widget = mountWidget(widgetActions)
    widget.setCount(lastCount)
  } else if (!wanted && widget) {
    widget.destroy()
    widget = null
  }
}

;(async () => {
  try {
    const { widgetEnabled, blockedSites } = await chrome.storage.local.get(['widgetEnabled', 'blockedSites'])
    applyWidgetState(widgetEnabled, blockedSites)
  } catch {}

  try {
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area !== 'local' || !('widgetEnabled' in changes || 'blockedSites' in changes)) return
      const { widgetEnabled, blockedSites } = await chrome.storage.local.get(['widgetEnabled', 'blockedSites'])
      applyWidgetState(widgetEnabled, blockedSites)
      if (isTop) reportFieldCount()
    })
  } catch {}
})()

// ---------- Autofill ----------

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

const QUESTION_ROOT = '[role="listitem"], .freebirdFormviewerComponentsQuestionBaseRoot, .m2, .o3Dpx'
const QUESTION_TITLE = '[role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle, .M7eMe, label'
const ANY_FIELD = '[role="textbox"], [contenteditable]:not([contenteditable="false"]), input, textarea, select'

function questionText(el) {
  return el.closest(QUESTION_ROOT)?.querySelector(QUESTION_TITLE)?.textContent?.trim() || ''
}

// Returns { map: { key: el }, fixed: { pseudoKey: value } }
function buildFieldMapWithRules(rules = []) {
  const map = {}
  const fixed = {}
  const applicable = rules.filter((r) => urlMatches(r.sitePattern))
  applicable.forEach((r, i) => {
    try {
      // fixed value rule (selector + value without key)
      if (r.selector && r.value != null && !r.key) {
        const el = document.querySelector(r.selector)
        if (el) {
          map[`__fixed_${i}`] = el
          fixed[`__fixed_${i}`] = r.value
        }
        return
      }
      if (!r.key || map[r.key]) return
      // selector-based
      if (r.selector) {
        const el = document.querySelector(r.selector)
        if (el) map[r.key] = el
      }
      // labelRegex-based (match visible nearby question/label text)
      if (r.labelRegex && !map[r.key]) {
        const re = new RegExp(r.labelRegex, 'i')
        for (const el of document.querySelectorAll(ANY_FIELD)) {
          const label = el.getAttribute('aria-label') || el.placeholder || ''
          if (re.test(questionText(el)) || re.test(label)) {
            map[r.key] = el
            break
          }
        }
      }
    } catch {}
  })
  return { map, fixed }
}

// Build the full fill plan: rules -> custom fields -> auto-detected.
function buildFillPlan(rawProfile = {}, rules = []) {
  const { map: ruleMap, fixed } = buildFieldMapWithRules(rules)
  const autoMap = findFillableInputs(document)

  // Custom fields: profile.customFields = [{ name, value }], matched by visible label text
  const customMap = {}
  const customs = Array.isArray(rawProfile.customFields) ? rawProfile.customFields : []
  if (customs.length) {
    try {
      const candidates = Array.from(document.querySelectorAll(ANY_FIELD))
      customs.forEach((cf) => {
        const targetName = String(cf?.name || '').trim()
        if (!targetName || customMap[targetName]) return
        const re = new RegExp(`(^|\\b)${targetName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}($|\\b)`, 'i')
        const best = candidates.find((el) => {
          const label = el.getAttribute('aria-label') || el.placeholder || ''
          return re.test(questionText(el)) || re.test(label)
        })
        if (best) customMap[targetName] = best
      })
    } catch {}
  }

  // Elements claimed by rules/custom fields are removed from auto-detected lists.
  const claimed = new Set([...Object.values(customMap), ...Object.values(ruleMap)])
  const map = {}
  for (const [key, list] of Object.entries(autoMap)) {
    const rest = list.filter((t) => !claimed.has(t))
    if (rest.length) map[key] = rest
  }
  for (const [key, el] of Object.entries({ ...customMap, ...ruleMap })) {
    map[key] = [el, ...(map[key] || [])]
  }

  const customVals = Object.fromEntries(customs.filter((c) => c?.name).map((c) => [c.name, c.value]))
  const profile = deriveProfile({ ...rawProfile, ...customVals, ...fixed })

  // Drop keys with no value so preview/count reflect what will actually change.
  for (const key of Object.keys(map)) {
    const v = profile[key]
    if (v == null || String(v).trim() === '') delete map[key]
  }
  return { map, profile }
}

const FIELD_LABELS = Object.fromEntries(PROFILE_FIELDS.map((f) => [f.name, f.label]))

function previewEntries(map, profile) {
  const entries = []
  for (const [key, targets] of Object.entries(map)) {
    for (const t of targets) {
      entries.push({
        key,
        target: t,
        el: Array.isArray(t) ? t[0] : t,
        label: key.startsWith('__fixed_') ? 'Rule' : FIELD_LABELS[key] || key,
        value: profile[key],
      })
    }
  }
  return entries
}

function countTargets(map) {
  return Object.values(map).reduce((n, list) => n + list.length, 0)
}

let lastSnapshot = null

function runFill(map, profile) {
  const snap = snapshot(map)
  const { filled } = fillFields(map, profile)
  if (filled) {
    lastSnapshot = snap
    showToast(`Filled ${plural(filled, 'field')}.`, { actionLabel: 'Undo', onAction: undoFill, timeout: 10000 })
    watchCorrections(map, profile)
    chrome.runtime.sendMessage({ type: 'FILL_DONE', filled }).catch(() => {})
  } else if (isTop) {
    showToast('No fields to fill on this page.')
  }
  return filled
}

function undoFill() {
  if (!lastSnapshot) return 0
  const n = restore(lastSnapshot)
  lastSnapshot = null
  showToast(`Restored ${plural(n, 'field')}.`)
  return n
}

// ---------- Learn from corrections ----------
// After a fill, if the user types a profile value into a field SmartFill missed or
// mapped to a different key, offer to save a site rule for it.

const LEARN_WINDOW_MS = 5 * 60 * 1000
let stopWatching = null

function normValue(v) {
  return String(v ?? '').trim().toLowerCase()
}

function offerRule(el, key) {
  const label = FIELD_LABELS[key] || key
  const host = location.host
  showFieldPrompt(el, `Always fill this field with your ${label} on ${host}?`, {
    actionLabel: 'Remember',
    onAction: async () => {
      try {
        const rule = { sitePattern: host, selector: buildSelector(el), key }
        const res = await chrome.runtime.sendMessage({ type: 'ADD_RULE', rule })
        showToast(res?.ok ? `Saved. SmartFill will remember this field on ${host}.` : "Couldn't save that.")
      } catch {
        showToast("Couldn't save that.")
      }
    },
  })
}

function watchCorrections(map, profile) {
  stopWatching?.()
  const filledAs = new Map()
  for (const [key, targets] of Object.entries(map)) {
    for (const t of targets) if (!Array.isArray(t)) filledAs.set(t, key)
  }
  // Profile value -> key (first key wins, so specific keys beat derived ones)
  const valueToKey = new Map()
  for (const [key, v] of Object.entries(profile)) {
    if (key.startsWith('__fixed_') || typeof v !== 'string') continue
    const n = normValue(v)
    if (n && !valueToKey.has(n)) valueToKey.set(n, key)
  }
  const asked = new WeakSet()
  const onChange = (e) => {
    if (!e.isTrusted) return
    const el = e.composedPath?.()[0] || e.target
    if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || asked.has(el)) return
    const key = valueToKey.get(normValue(el.value))
    if (!key || filledAs.get(el) === key) return
    asked.add(el)
    offerRule(el, key)
  }
  document.addEventListener('change', onChange, true)
  const timer = setTimeout(() => stopWatching?.(), LEARN_WINDOW_MS)
  stopWatching = () => {
    document.removeEventListener('change', onChange, true)
    clearTimeout(timer)
    stopWatching = null
  }
}

// Remember the field the user right-clicked for "Fill this field with…"
let lastContextTarget = null
document.addEventListener('contextmenu', (e) => {
  lastContextTarget = e.composedPath?.()[0] || e.target
}, true)

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg?.type) {
    case 'AUTOFILL': {
      const { map, profile } = buildFillPlan(msg.profile || {}, msg.rules || [])
      const count = countTargets(map)
      // Sub-frames without fields stay silent so the frame that has fields answers.
      if (!isTop && !count) return false
      if (msg.preview && count) {
        const entries = previewEntries(map, profile)
        showPreview(entries, {
          // Fill only the fields the user didn't skip in the preview.
          onConfirm: (skipped) => {
            const chosen = {}
            entries.forEach((e, i) => {
              if (!skipped.has(i)) (chosen[e.key] ||= []).push(e.target)
            })
            runFill(chosen, profile)
          },
        })
        sendResponse({ ok: true, preview: true, count })
      } else {
        sendResponse({ ok: true, filled: runFill(map, profile) })
      }
      return false
    }
    case 'UNDO_FILL': {
      if (!lastSnapshot && !isTop) return false
      sendResponse({ ok: true, restored: undoFill() })
      return false
    }
    case 'FILL_FIELD': {
      const el = lastContextTarget
      if (!el?.isConnected) {
        sendResponse({ ok: false, error: 'No field selected' })
        return false
      }
      const profile = deriveProfile(msg.profile || {})
      const map = { [msg.key]: [el] }
      const snap = snapshot(map)
      const { filled } = fillFields(map, profile)
      if (filled) {
        lastSnapshot = snap
        // An explicit "fill this field with X" is a strong hint: offer to remember it.
        offerRule(el, msg.key)
      } else showToast(`Your profile has no ${FIELD_LABELS[msg.key] || msg.key} yet.`)
      sendResponse({ ok: true, filled })
      return false
    }
    case 'TOAST': {
      if (isTop && (!siteBlocked || msg.force)) showToast(msg.text)
      return false
    }
  }
  return false
})

// ---------- Toolbar badge: report how many fillable fields the page has ----------

function reportFieldCount() {
  try {
    const count = siteBlocked ? 0 : countTargets(findFillableInputs(document))
    lastCount = count
    widget?.setCount(count)
    chrome.runtime.sendMessage({ type: 'FIELD_COUNT', count }).catch(() => {})
  } catch {}
}

if (isTop) {
  let timer = 0
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(reportFieldCount, 800)
  }
  schedule()
  try {
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true })
  } catch {}
}
