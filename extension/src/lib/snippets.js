// Text snippets: type a short trigger (like ";addr") in any text field and it expands to saved text.
import { isSensitive } from './detectFields'
import { t } from './i18n'

export const TRIGGER_PREFIX = ';'
export const SNIPPET_MAX_LENGTH = 5000

// ";Addr " -> ";addr". Triggers are a prefix plus letters, digits, "-" or "_".
export function normalizeTrigger(raw) {
  const body = String(raw || '').trim().toLowerCase().replace(/^;+/, '').replace(/[^a-z0-9_-]/g, '')
  return body ? TRIGGER_PREFIX + body : ''
}

export function validateSnippet(snippet, others = []) {
  const trigger = normalizeTrigger(snippet.trigger)
  if (trigger.length < 2) return t('Add a shortcut, like ;addr')
  if (!String(snippet.text || '').trim()) return t('Add the text to insert')
  if (snippet.text.length > SNIPPET_MAX_LENGTH) return t('Keep it under {max} characters', { max: SNIPPET_MAX_LENGTH })
  if (others.some((s) => normalizeTrigger(s.trigger) === trigger)) return t('{trigger} is already used', { trigger })
  return ''
}

// Fills in simple placeholders at expansion time.
export function renderSnippet(text, now = new Date()) {
  return String(text)
    .replace(/\{date\}/g, now.toLocaleDateString())
    .replace(/\{time\}/g, now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
}

// The snippet whose trigger ends the text before the caret, as a whole word. Longest trigger wins,
// so ";addr2" is not cut short by ";addr".
export function matchSnippet(before, snippets) {
  let best = null
  for (const s of snippets || []) {
    if (typeof s?.text !== 'string') continue
    const t = normalizeTrigger(s.trigger)
    if (!t || !before.toLowerCase().endsWith(t)) continue
    const prev = before.charAt(before.length - t.length - 1)
    if (prev && !/[\s([{"'“‘>]/.test(prev)) continue // inside a word or URL
    if (!best || t.length > best.trigger.length) best = { trigger: t, text: s.text }
  }
  return best
}

const TEXT_TYPES = new Set(['', 'text', 'search', 'email', 'url', 'tel'])

export function canExpandIn(el) {
  if (!el || el.disabled || el.readOnly) return false
  if (el.isContentEditable) return true
  if (el.tagName === 'TEXTAREA') return !isSensitive(el)
  if (el.tagName !== 'INPUT') return false
  return TEXT_TYPES.has(String(el.getAttribute('type') || '').toLowerCase()) && !isSensitive(el)
}

function setValue(el, value) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const desc = Object.getOwnPropertyDescriptor(proto, 'value')
  if (desc?.set) desc.set.call(el, value)
  else el.value = value
}

// True when a longer trigger starts with this one (";addr" vs ";addr2"): wait for a space instead.
export function isAmbiguous(trigger, snippets) {
  return (snippets || []).some((s) => { const t = normalizeTrigger(s.trigger); return t.length > trigger.length && t.startsWith(trigger) })
}

// Decides what to do after one typed character. Returns { hit, keep } where keep is how many
// characters after the trigger stay (1 when a space or punctuation ended an ambiguous trigger).
// Only the last inserted character matters, so word-at-a-time input (dictation, some keyboards) works too.
export function findExpansion(before, typed, snippets) {
  const last = String(typed).slice(-1)
  if (!last) return null
  if (/^[a-z0-9_-]$/i.test(last)) {
    const hit = matchSnippet(before, snippets)
    return hit && !isAmbiguous(hit.trigger, snippets) ? { hit, keep: 0 } : null
  }
  const hit = matchSnippet(before.slice(0, -1), snippets)
  return hit && isAmbiguous(hit.trigger, snippets) ? { hit, keep: 1 } : null
}

// Expands a trigger just typed into el (typed = the inserted text). Returns the snippet, or null.
export function expandAtCaret(el, snippets, typed = '') {
  if (!snippets?.length || !canExpandIn(el)) return null
  if (el.isContentEditable) return expandInEditable(el, snippets, typed)
  let caret
  try { caret = el.selectionStart } catch { return null } // email/number inputs have no selection API
  if (caret == null || caret !== el.selectionEnd) return null
  const value = el.value
  const found = findExpansion(value.slice(0, caret), typed, snippets)
  if (!found) return null
  const { hit, keep } = found
  const text = renderSnippet(hit.text)
  if (el.maxLength > 0 && value.length - hit.trigger.length + text.length > el.maxLength) return null
  const end = caret - keep
  const start = end - hit.trigger.length
  setValue(el, value.slice(0, start) + text + value.slice(end))
  const caretAfter = start + text.length + keep
  try { el.setSelectionRange(caretAfter, caretAfter) } catch {}
  el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text }))
  return hit
}

function expandInEditable(root, snippets, typed) {
  const sel = root.ownerDocument.getSelection()
  if (!sel?.rangeCount || !sel.isCollapsed) return null
  const node = sel.anchorNode
  if (node?.nodeType !== Node.TEXT_NODE || !root.contains(node)) return null
  const found = findExpansion(node.data.slice(0, sel.anchorOffset), typed, snippets)
  if (!found) return null
  const { hit, keep } = found
  const end = sel.anchorOffset - keep
  const range = root.ownerDocument.createRange()
  range.setStart(node, end - hit.trigger.length)
  range.setEnd(node, end)
  sel.removeAllRanges()
  sel.addRange(range)
  const text = renderSnippet(hit.text)
  // insertText keeps the editor's own undo stack and lets rich editors update their state.
  const ok = root.ownerDocument.execCommand?.('insertText', false, text)
  if (!ok) {
    range.deleteContents()
    range.insertNode(root.ownerDocument.createTextNode(text))
    sel.collapseToEnd()
    root.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text }))
  }
  if (keep) sel.modify?.('move', 'forward', 'character') // past the space that ended the trigger
  return hit
}
