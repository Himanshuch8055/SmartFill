// Content script
import { findFillableInputs, fillFields, deriveProfile, snapshot, restore, findAnswerTargets, findResumeInputs, isEmptyTarget } from '../lib/detectFields'
import { PROFILE_FIELDS } from '../lib/profileFields'
import { showPreview, showToast, showFieldPrompt } from './preview'
import { mountWidget } from './widget'
import { buildSelector } from '../lib/selector'
import { expandAtCaret } from '../lib/snippets'

console.debug('SmartFill content script loaded')

const isTop = window === window.top
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// ---------- On-page button ----------
// Shown only in the top frame, when enabled, when the site isn't turned off,
// and only while the page has fillable fields.

let siteBlocked = false
let widget = null
let lastCount = 0

// One click fills the page (with preview if that setting is on). Results show as toasts.
const widgetActions = {
  async fill() {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'AUTOFILL_ACTIVE' })
      if (!res?.ok) showToast(res?.error || "Couldn't fill this page.", { tone: 'danger' })
    } catch {
      showToast("Couldn't fill this page.", { tone: 'danger' })
    }
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
      if (area !== 'local') return
      if ('profiles' in changes || 'activeProfileId' in changes || 'siteProfiles' in changes) {
        fillContext = null // answers or resume may have changed
        if (isTop) reportFieldCount()
      }
      if (!('widgetEnabled' in changes || 'blockedSites' in changes)) return
      const { widgetEnabled, blockedSites } = await chrome.storage.local.get(['widgetEnabled', 'blockedSites'])
      applyWidgetState(widgetEnabled, blockedSites)
      if (isTop) reportFieldCount()
    })
  } catch {}
})()

// ---------- Snippets ----------
// Typing a saved shortcut (like ";addr") in a text field replaces it with the saved text.

let snippets = []
let snippetsOn = true

async function loadSnippets() {
  try {
    const { snippets: list, snippetsEnabled, blockedSites } = await chrome.storage.local.get(['snippets', 'snippetsEnabled', 'blockedSites'])
    snippets = Array.isArray(list) ? list : []
    snippetsOn = snippetsEnabled !== false && !(Array.isArray(blockedSites) && blockedSites.includes(location.host))
  } catch {}
}
loadSnippets()
try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && ('snippets' in changes || 'snippetsEnabled' in changes || 'blockedSites' in changes)) loadSnippets()
  })
} catch {}

document.addEventListener('input', (e) => {
  if (!snippetsOn || !snippets.length || e.isComposing || e.inputType !== 'insertText' || !e.isTrusted) return
  try {
    const target = e.composedPath?.()[0] || e.target
    expandAtCaret(target, snippets, e.data || '')
  } catch {}
}, true)

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
// resume: { name, type, size, dataUrl } for the profile being filled, or null.
function buildFillPlan(rawProfile = {}, rules = [], resume = null) {
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

  // Screening answers: questions not already filled by a profile field, rule or custom field.
  const taken = new Set()
  for (const list of Object.values(map)) for (const t of list) for (const el of [].concat(t)) taken.add(el)
  findAnswerTargets(document, rawProfile.answers || [], taken).forEach((a, i) => {
    map[`__answer_${i}`] = [a.target]
    profile[`__answer_${i}`] = a.answer
  })

  // Resume / CV upload fields
  if (resume?.dataUrl) {
    const inputs = findResumeInputs(document)
    if (inputs.length) {
      map.__resume = inputs
      profile.__resume = resume
    }
  }

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
        label: key.startsWith('__fixed_') ? 'Rule' : key.startsWith('__answer_') ? 'Answer' : key === '__resume' ? 'Resume' : FIELD_LABELS[key] || key,
        value: key === '__resume' ? profile.__resume.name : profile[key],
      })
    }
  }
  return entries
}

function countTargets(map) {
  return Object.values(map).reduce((n, list) => n + list.length, 0)
}

let lastSnapshot = null

function runFill(map, profile, { continuation = false } = {}) {
  const snap = snapshot(map)
  const { filled } = fillFields(map, profile)
  if (filled) {
    lastSnapshot = snap
    showToast(continuation ? `Filled ${plural(filled, 'more field')}.` : `Filled ${plural(filled, 'field')}.`, {
      actionLabel: 'Undo',
      onAction: undoFill,
      timeout: 10000,
    })
    watchCorrections(map, profile)
    chrome.runtime.sendMessage({ type: 'FILL_DONE', filled }).catch(() => {})
    startFillSession()
  } else if (isTop && !continuation) {
    showToast('No fields to fill on this page.')
  }
  return filled
}

// ---------- Multi-page forms ----------
// After a fill, the tab stays in a "fill session" for a while. When the next step of the form
// appears (new fields on this page, or a new page on the same site), SmartFill continues:
// it previews or fills only the fields that are still empty.

let sessionActive = false
let continuing = false
const processed = new WeakSet() // targets already filled or offered on this page

function startFillSession() {
  if (!isTop) return
  sessionActive = true
  chrome.runtime.sendMessage({ type: 'START_FILL_SESSION' }).catch(() => {})
}

function endFillSession() {
  sessionActive = false
  chrome.runtime.sendMessage({ type: 'END_FILL_SESSION' }).catch(() => {})
}

// Keep only targets that are still empty and haven't been handled on this page.
function pendingOnly(map) {
  const out = {}
  for (const [key, targets] of Object.entries(map)) {
    const rest = targets.filter((t) => !processed.has(t) && isEmptyTarget(t))
    if (rest.length) out[key] = rest
  }
  return out
}

function markProcessed(map) {
  for (const targets of Object.values(map)) for (const t of targets) processed.add(t)
}

async function maybeContinue(count) {
  if (!isTop || !sessionActive || continuing || !count || siteBlocked) return
  continuing = true
  try {
    const res = await chrome.runtime.sendMessage({ type: 'CONTINUE_FILL' })
    if (res?.inactive) sessionActive = false
  } catch {
  } finally {
    continuing = false
  }
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
    if (key.startsWith('__') || typeof v !== 'string') continue // only real profile fields (not rules, answers or the resume)
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
      const continuation = !!msg.continuation
      const plan = buildFillPlan(msg.profile || {}, msg.rules || [], msg.resume || null)
      const profile = plan.profile
      // On later steps of a form, never touch fields the user already filled in.
      const map = continuation ? pendingOnly(plan.map) : plan.map
      const count = countTargets(map)
      // Sub-frames without fields stay silent so the frame that has fields answers.
      if (!isTop && !count) return false
      if (continuation && !count) {
        sendResponse({ ok: true, filled: 0, continuation: true })
        return false
      }
      markProcessed(map)
      if (msg.preview && count) {
        const entries = previewEntries(map, profile)
        showPreview(entries, {
          hint: continuation ? 'Next step · Click a label to skip it' : undefined,
          // Fill only the fields the user didn't skip in the preview.
          onConfirm: (skipped) => {
            const chosen = {}
            entries.forEach((e, i) => {
              if (!skipped.has(i)) (chosen[e.key] ||= []).push(e.target)
            })
            runFill(chosen, profile, { continuation })
          },
          // Cancelling a preview means "stop helping with this form".
          onCancel: () => endFillSession(),
        })
        sendResponse({ ok: true, preview: true, count })
      } else {
        sendResponse({ ok: true, filled: runFill(map, profile, { continuation }) })
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

// ---------- Field count: shown in the popup, and decides whether the page button appears ----------

// Saved screening answers and whether a resume exists, for the profile used on this site.
// Fetched once per page and refreshed when profiles change.
let fillContext = null
async function getFillContext() {
  if (!fillContext) {
    fillContext = chrome.runtime
      .sendMessage({ type: 'GET_FILL_CONTEXT', host: location.host })
      .then((res) => ({ answers: res?.answers || [], hasResume: !!res?.hasResume }))
      .catch(() => ({ answers: [], hasResume: false }))
  }
  return fillContext
}

async function reportFieldCount() {
  try {
    let count = 0
    if (!siteBlocked) {
      const autoMap = findFillableInputs(document)
      count = countTargets(autoMap)
      // Include screening answers and resume uploads so the count matches what a fill does.
      const { answers, hasResume } = await getFillContext()
      const taken = new Set()
      for (const list of Object.values(autoMap)) for (const t of list) for (const el of [].concat(t)) taken.add(el)
      count += findAnswerTargets(document, answers, taken).length
      if (hasResume) count += findResumeInputs(document).length
    }
    lastCount = count
    widget?.setCount(count)
    chrome.runtime.sendMessage({ type: 'FIELD_COUNT', count }).catch(() => {})
    maybeContinue(count)
  } catch {}
}

if (isTop) {
  // A fill session may be running from the previous step of this form (a new page on the same site).
  chrome.runtime
    .sendMessage({ type: 'GET_FILL_SESSION' })
    .then((res) => {
      sessionActive = !!res?.active
      if (sessionActive) reportFieldCount()
    })
    .catch(() => {})

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
