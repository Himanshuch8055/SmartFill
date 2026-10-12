import { matchAnswer } from './answers'

// Field detection (weighted scoring) and filling.
// findFillableInputs() returns { key: HTMLElement[] } so repeated sections (billing/shipping) all fill.

// Order matters for ties: specific keys come before generic ones.
// `ac`: autocomplete tokens, `re`: positive pattern, `not`: negative pattern, `type`: input types.
export const FIELD_SPECS = [
  { key: 'firstName', ac: ['given-name'], re: /\b(first|given|fore)\s*name\b|\bfname\b/ },
  { key: 'middleName', ac: ['additional-name'], re: /\bmiddle\s*name\b|\bmname\b/ },
  { key: 'lastName', ac: ['family-name'], re: /\b(last|family|sur)\s*name\b|\bsurname\b|\blname\b/ },
  { key: 'username', ac: ['username'], re: /\buser\s*name\b|\blogin\b|\bhandle\b/ },
  { key: 'email', ac: ['email'], re: /\be\s*-?\s*mail\b/, not: /confirm|verify|re\s*enter|repeat/, type: ['email'] },
  { key: 'phone2', re: /\b(alternate|alternative|secondary|other)\s*(phone|mobile|contact|number)\b|\bphone\s*2\b/ },
  { key: 'phone', ac: ['tel', 'tel-national'], re: /\bphone\b|\bmobile\b|\btel\b|\btelephone\b|\bcontact\s*(no|number)\b|\bcell\b/, not: /\bcode\b|\bext(ension)?\b/, type: ['tel'] },
  { key: 'dob', ac: ['bday'], re: /\b(date\s*of\s*birth|birth\s*date|birthday|dob)\b/ },
  { key: 'gender', ac: ['sex'], re: /\bgender\b|\bsex\b/ },
  { key: 'company', ac: ['organization'], re: /\bcompany\b|\borgani[sz]ation\b|\bemployer\b|\bbusiness\s*name\b/, not: /\bsize\b|\btype\b|\bwebsite\b|\burl\b/ },
  { key: 'jobTitle', ac: ['organization-title'], re: /\bjob\s*title\b|\bdesignation\b|\bposition\b|\bcurrent\s*(role|title)\b|\b(your|job)\s*role\b/, not: /\bapplying\b/ },
  { key: 'yearsExperience', re: /\b(years?\s*of\s*experience|total\s*experience|experience\s*\(?\s*(in\s*)?years?)\b/ },
  { key: 'currentCtc', re: /\bcurrent\s*(ctc|salary|compensation|pay)\b/ },
  { key: 'expectedCtc', re: /\bexpected\s*(ctc|salary|compensation|pay)\b|\bsalary\s*expectation/ },
  { key: 'noticePeriod', re: /\bnotice\s*period\b/ },
  // Education (most recent). Graduation year before the generic degree/school patterns.
  { key: 'graduationYear', re: /\bgraduat(ion|ed|ing)\b.*\b(year|date)\b|\byear of (graduation|passing|completion)\b|\bpassing year\b|\bclass of\b/ },
  { key: 'fieldOfStudy', re: /\bfield of stud(y|ies)\b|\bmajor\b|\bdiscipline\b|\bspeciali[sz]ation\b|\barea of study\b/ },
  { key: 'degree', re: /\bdegree\b|\bqualification\b/, not: /\bfield\b|\bmajor\b|\bdiscipline\b|\bdegrees? (celsius|fahrenheit)\b/ },
  { key: 'school', re: /\b(school|college|university|institution|institute)\b(\s*name)?/, not: /\bhigh school (diploma|grade)\b/ },
  { key: 'address2', ac: ['address-line2'], re: /\baddress\s*(line\s*)?2\b|\bapartment\b|\bapt\b|\bsuite\b|\bunit\b|\blandmark\b/ },
  { key: 'address1', ac: ['address-line1', 'street-address'], re: /\baddress\s*(line\s*)?1?\b|\bstreet\b/, not: /\be\s*-?\s*mail\b|\bweb\b|\bip\b|\b(line\s*)?2\b/ },
  { key: 'city', ac: ['address-level2'], re: /\bcity\b|\btown\b|\blocation\b|\bwhere (are )?you (currently )?(located|based)\b/, not: /\bethnicity\b|\b(preferred|desired|job|work|office|relocat\w*)\s+location\b|\blocations\b/ },
  { key: 'state', ac: ['address-level1'], re: /\bstate\b|\bprovince\b|\bregion\b|\bcounty\b/, not: /statement|\bcountry\b/ },
  { key: 'zip', ac: ['postal-code'], re: /\bzip\b|\bpostal\b|\bpost\s*code\b|\bpin\s*code\b|\bpincode\b/ },
  // Exclude eligibility questions ("authorized to work in this country?")
  { key: 'country', ac: ['country', 'country-name'], re: /\bcountry\b/, not: /\bcode\b|authori[sz]|eligib|legal|\bwork\b|visa|citizen|reside|relocat|\bborn\b/ },
  { key: 'linkedin', re: /\blinked\s*in\b/ },
  { key: 'github', re: /\bgit\s*hub\b/ },
  { key: 'portfolio', re: /\bportfolio\b/ },
  { key: 'website', ac: ['url'], re: /\bwebsite\b|\bhomepage\b|\bpersonal\s*(site|url)\b/, type: ['url'] },
  { key: 'bio', re: /\babout\s*(you|yourself|me)\b|\bbio\b|\bsummary\b|\bcover\s*letter\b/ },
  // Generic "name" last so first/last/user/company names win. Anchored to the start so
  // "hotel name" / "project name" don't match; only unqualified or person-qualified names do.
  { key: 'fullName', ac: ['name'], re: /^((full|your|legal|applicant|candidate|contact|billing|shipping|customer)\s*)*name\b/, not: /\b(first|last|middle|given|family|sur|user|company|business|file|account|card|nick|display|father|mother|spouse|organi[sz]ation|school|college|university|project|product)\b/ },
]

const WEIGHTS = { ac: 100, label: 60, nameId: 40, placeholder: 30, type: 20 }

const SENSITIVE_AC = /^(cc-|current-password|new-password|one-time-code)/
const SENSITIVE_TEXT = /\b(password|passcode|otp|one\s*time|captcha|cvv|cvc|card\s*(number|no)|credit\s*card|debit\s*card|ssn|social\s*security|aadhaa?r|pan\s*(number|no)|account\s*number|routing|iban|security\s*code)\b/
const SKIP_TYPES = new Set(['hidden', 'password', 'submit', 'button', 'reset', 'image', 'file', 'range', 'color', 'search'])

const QUESTION_ROOT = '[role="listitem"], .freebirdFormviewerComponentsQuestionBaseRoot, .m2, .o3Dpx'
const QUESTION_TITLE = '[role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle, .M7eMe, label'

// "firstName" / "first_name" / "billing-first-name" -> "first name"
export function normalize(text) {
  return String(text || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-.\[\]:*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function textFromAriaLabelledBy(node) {
  const ids = (node.getAttribute('aria-labelledby') || '').trim()
  if (!ids) return ''
  return ids
    .split(/\s+/)
    .map((id) => node.ownerDocument.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(' ')
}

const FIELD_SELECTOR = 'input:not([type="hidden"]), select, textarea'

// Text shown just above a field (or a group of radios) when there is no <label> or <legend>:
// the question block many custom forms (Lever, React form builders) put in a sibling element.
// own: the elements that belong to this question, so other questions' text is never used.
export function textAbove(start, own = [start]) {
  let node = start
  for (let depth = 0; depth < 6 && node?.parentElement && node !== node.ownerDocument.body; depth++) {
    let sib = node.previousElementSibling
    for (let n = 0; sib && n < 2; sib = sib.previousElementSibling, n++) {
      if (sib.matches(FIELD_SELECTOR) || sib.querySelector(FIELD_SELECTOR)) break
      const text = sib.textContent.replace(/\s+/g, ' ').trim()
      if (text && text.length <= 300) return text
    }
    const parent = node.parentElement
    if ([...parent.querySelectorAll(FIELD_SELECTOR)].some((f) => !own.includes(f))) break
    node = parent
  }
  return ''
}

// The question for a radio group: legend, question title, or the text above the group.
function groupQuestion(el, group) {
  return normalize(
    el.closest('fieldset')?.querySelector('legend')?.textContent ||
      el.closest(QUESTION_ROOT)?.querySelector(QUESTION_TITLE)?.textContent ||
      textAbove(el, group)
  )
}

function labelText(el) {
  const parts = []
  // el.labels covers both <label for> and wrapping labels
  for (const lbl of el.labels || []) parts.push(lbl.textContent)
  if (!el.labels) {
    const wrapping = el.closest('label')
    if (wrapping) parts.push(wrapping.textContent)
  }
  parts.push(el.getAttribute('aria-label'), textFromAriaLabelledBy(el))
  if (!parts.some((p) => p && p.trim())) {
    const title = el.closest(QUESTION_ROOT)?.querySelector(QUESTION_TITLE)?.textContent
    parts.push(title || (el.type !== 'checkbox' && el.type !== 'radio' ? textAbove(el) : ''))
  }
  return normalize(parts.filter(Boolean).join(' '))
}

export function getSignals(el) {
  return {
    ac: String(el.getAttribute('autocomplete') || '').toLowerCase().split(/\s+/).filter(Boolean),
    label: labelText(el),
    nameId: normalize([el.getAttribute('name'), el.id].filter(Boolean).join(' ')),
    placeholder: normalize(el.getAttribute('placeholder')),
    type: String(el.getAttribute('type') || '').toLowerCase(),
  }
}

export function isSensitive(el, signals = getSignals(el)) {
  if (signals.type === 'password') return true
  if (signals.ac.some((t) => SENSITIVE_AC.test(t))) return true
  return SENSITIVE_TEXT.test(`${signals.label} ${signals.nameId} ${signals.placeholder}`)
}

function textMatches(spec, text) {
  if (!text) return false
  return spec.re.test(text) && !(spec.not && spec.not.test(text))
}

// A long label is a question ("Share your open-source work… and your role in each"), not a field
// name: only its opening words say what is being asked.
// Open-ended questions ("Why this company…", "Tell us about…") never ask for a profile value.
function labelForMatching(label) {
  const words = label.split(' ')
  if (words.length > 6 && /^(why|what|how|describe|tell|explain|share|please (describe|explain|tell|share))\b/.test(label)) return ''
  return words.length > 12 ? words.slice(0, 8).join(' ') : label
}

// Returns { key, score } or null
export function scoreElement(el) {
  const s = getSignals(el)
  if (isSensitive(el, s)) return null
  const label = labelForMatching(s.label)
  let best = null
  for (const spec of FIELD_SPECS) {
    let score = 0
    if (spec.ac && s.ac.some((t) => spec.ac.includes(t))) score += WEIGHTS.ac
    if (textMatches(spec, label)) score += WEIGHTS.label
    if (textMatches(spec, s.nameId)) score += WEIGHTS.nameId
    if (textMatches(spec, s.placeholder)) score += WEIGHTS.placeholder
    if (spec.type && spec.type.includes(s.type)) score += WEIGHTS.type
    if (score > 0 && (!best || score > best.score)) best = { key: spec.key, score }
  }
  return best
}

const CANDIDATE_SELECTOR =
  'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]), [role="textbox"], [contenteditable="true"]:not([aria-disabled="true"])'

function isVisible(el) {
  if (el.closest('[hidden], [aria-hidden="true"]')) return false
  const cs = el.ownerDocument.defaultView?.getComputedStyle?.(el)
  return !cs || (cs.display !== 'none' && cs.visibility !== 'hidden')
}

export function findFillableInputs(root = document) {
  const map = {}
  const seen = new Set()
  const radioGroups = new Set()
  for (const el of root.querySelectorAll(CANDIDATE_SELECTOR)) {
    if (seen.has(el)) continue
    seen.add(el)
    const type = String(el.getAttribute('type') || '').toLowerCase()
    if (el.tagName === 'INPUT' && SKIP_TYPES.has(type)) continue
    // Checkboxes are option lists or consents, never a profile value ("Telugu (TEL)" is not a phone).
    if (type === 'checkbox') continue
    if (!isVisible(el)) continue
    // Radios: score once per group, using the group's legend/question text
    if (type === 'radio') {
      const name = el.getAttribute('name')
      if (!name || radioGroups.has(name)) continue
      radioGroups.add(name)
      const group = Array.from(root.querySelectorAll('input[type="radio"]')).filter((r) => r.name === name && !r.disabled)
      const text = `${groupQuestion(el, group)} ${normalize(name)}`
      const spec = FIELD_SPECS.find((sp) => textMatches(sp, text))
      if (spec) (map[spec.key] ||= []).push(group)
      continue
    }
    const hit = scoreElement(el)
    if (hit) (map[hit.key] ||= []).push(el)
  }
  return map
}

// ---------- value adapters ----------

export function deriveProfile(profile = {}) {
  const p = { ...profile }
  const has = (v) => v != null && String(v).trim() !== ''
  if (!has(p.fullName) && (has(p.firstName) || has(p.lastName))) {
    p.fullName = [p.firstName, p.middleName, p.lastName].filter(has).join(' ')
  }
  if (has(p.fullName) && (!has(p.firstName) || !has(p.lastName))) {
    const parts = String(p.fullName).trim().split(/\s+/)
    if (!has(p.firstName)) p.firstName = parts[0]
    if (!has(p.lastName) && parts.length > 1) p.lastName = parts[parts.length - 1]
  }
  return p
}

function adaptPhone(el, value) {
  const max = Number(el.getAttribute('maxlength')) || 0
  const digits = String(value).replace(/\D/g, '')
  if (max > 0 && String(value).length > max && digits.length >= max) return digits.slice(-max)
  return value
}

// Accepts ISO (yyyy-mm-dd), dd/mm/yyyy, dd-mm-yyyy
export function toIsoDate(value) {
  const v = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const d = new Date(v)
  return isNaN(d) ? v : d.toISOString().slice(0, 10)
}

function adaptValue(key, el, value) {
  if (value == null) return value
  const type = String(el.getAttribute?.('type') || '').toLowerCase()
  if ((key === 'phone' || key === 'phone2') && el.tagName === 'INPUT') return adaptPhone(el, value)
  if (type === 'date') return toIsoDate(value)
  return value
}

const ALIASES = {
  india: ['in', 'ind', 'bharat'],
  'united states': ['us', 'usa', 'united states of america', 'america'],
  'united kingdom': ['uk', 'gb', 'gbr', 'great britain', 'england'],
  'united arab emirates': ['ae', 'uae'],
  canada: ['ca', 'can'],
  australia: ['au', 'aus'],
  germany: ['de', 'deu'],
  male: ['m', 'man'],
  female: ['f', 'woman'],
}

function variants(value) {
  const v = String(value).trim().toLowerCase()
  const out = new Set([v])
  for (const [canon, alts] of Object.entries(ALIASES)) {
    if (canon === v || alts.includes(v)) {
      out.add(canon)
      alts.forEach((a) => out.add(a))
    }
  }
  return out
}

export function pickOption(options, value) {
  const vs = variants(value)
  const norm = (s) => String(s || '').trim().toLowerCase()
  const list = Array.from(options)
  return (
    list.find((o) => vs.has(norm(o.value)) || vs.has(norm(o.text ?? o.label))) ||
    list.find((o) => {
      const t = norm(o.text ?? o.label)
      return t && [...vs].some((v) => v.length > 2 && (t.startsWith(v) || v.startsWith(t)))
    }) ||
    null
  )
}

// ---------- filling ----------

function setNativeValue(el, value) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const desc = Object.getOwnPropertyDescriptor(proto, 'value')
  if (desc?.set) desc.set.call(el, value)
  else el.value = value
}

function dispatchAll(el) {
  try {
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: String(el.value ?? ''), inputType: 'insertText' }))
  } catch {
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

function radioLabel(r) {
  const lbl = r.labels?.[0] || r.closest('label')
  return lbl?.textContent || r.getAttribute('aria-label') || ''
}

function fillRadioGroup(group, value) {
  const opt = pickOption(group.map((r) => ({ value: r.value, text: radioLabel(r), el: r })), value)
  if (!opt) return false
  opt.el.click()
  if (!opt.el.checked) {
    opt.el.checked = true
    dispatchAll(opt.el)
  }
  return true
}

function fillContentEditable(el, value) {
  try {
    try { el.click() } catch {}
    try { el.focus({ preventScroll: true }) } catch {}
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(el)
    sel.removeAllRanges()
    sel.addRange(range)
    try {
      el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertFromPaste', data: String(value) }))
    } catch {}
    const ok = document.execCommand && document.execCommand('insertText', false, String(value))
    if (!ok) el.textContent = String(value)
  } catch {
    el.textContent = String(value)
  }
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

// Fill one target (element or radio group). Returns true if something changed.
// ---------- custom dropdowns ----------
// React Select, Headless UI, MUI Autocomplete and similar: an <input role="combobox"> whose options
// appear in a separate listbox only after typing. They are filled after the normal fields, one at a
// time (only one menu can be open): type the value, wait for the options, then click the best match.

export function isCombobox(el) {
  return el?.tagName === 'INPUT' && el.getAttribute('role') === 'combobox' && !isSensitive(el)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function visibleOptions(el) {
  const doc = el.ownerDocument
  const box = doc.getElementById(el.getAttribute('aria-controls') || el.getAttribute('aria-owns') || '')
  const scope = box || doc
  return Array.from(scope.querySelectorAll('[role="option"]')).filter(
    (o) => (box || o.getClientRects().length) && o.getAttribute('aria-disabled') !== 'true'
  )
}

function press(el, key) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }))
}

function clickOption(opt) {
  for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
    const Ctor = type.startsWith('pointer') && typeof PointerEvent === 'function' ? PointerEvent : MouseEvent
    opt.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, button: 0 }))
  }
  opt.click()
}

// Returns true when an option was chosen (or the typed text stayed, for free-text autocompletes).
export async function fillCombobox(el, value, { timeout = 900 } = {}) {
  if (!el?.isConnected) return false
  const text = String(value)
  try { el.focus({ preventScroll: true }) } catch {}
  // Some menus open on typing, others only on a click or ArrowDown.
  setNativeValue(el, '')
  el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'deleteContentBackward' }))
  setNativeValue(el, text)
  el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text }))
  let options = []
  for (let waited = 0; waited <= timeout; waited += 100) {
    await sleep(100)
    options = visibleOptions(el)
    if (options.length) break
    if (waited === 300) press(el, 'ArrowDown')
  }
  const opt = pickOption(options.map((o) => ({ el: o, value: o.getAttribute('data-value') || '', text: o.textContent })), text)
  if (opt) {
    clickOption(opt.el)
    await sleep(50)
    return true
  }
  // No matching option: keep free text if the field accepts it (it survives losing focus);
  // select-style dropdowns clear it on blur.
  press(el, 'Escape')
  el.blur()
  await sleep(50)
  return String(el.value).trim().toLowerCase() === text.trim().toLowerCase()
}

// Text a custom dropdown shows next to its input (the chosen option), ignoring its placeholder.
export function comboboxDisplay(el) {
  const doc = el.ownerDocument
  const squash = (s) => String(s || '').replace(/\s+/g, ' ').trim()
  const placeholder = (el.getAttribute('aria-describedby') || '').split(/\s+/)
    .map((id) => doc.getElementById(id)).filter((n) => n && /placeholder/i.test(n.id)).map((n) => squash(n.textContent))
  let box = el
  for (let i = 0; i < 3 && box.parentElement; i++) box = box.parentElement
  // Leave out the field's own label and any open option list.
  const skip = [...(el.labels || []), ...box.querySelectorAll('[role="listbox"], [role="option"]')]
  const walker = doc.createTreeWalker(box, NodeFilter.SHOW_TEXT)
  let text = ''
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (!skip.some((s) => s.contains(n))) text += ' ' + n.data
  const shown = squash(text)
  return shown && !placeholder.includes(shown) ? shown : ''
}

let comboQueue = []

// Fills the custom dropdowns queued by fillElement. Returns how many were filled.
export async function settleComboboxes() {
  const queue = comboQueue
  comboQueue = []
  let count = 0
  for (const { el, value } of queue) {
    try { if (await fillCombobox(el, value)) count++ } catch (e) { console.debug('[SmartFill] dropdown fill failed', e) }
  }
  try { queue.at(-1)?.el.blur() } catch {}
  return count
}

export function fillElement(key, target, value) {
  if (value == null || String(value) === '') return false
  if (Array.isArray(target)) return fillRadioGroup(target, value)
  const el = target
  if (!el?.isConnected) return false
  if (el.tagName === 'INPUT' && el.type === 'file') return value?.dataUrl ? attachFile(el, value) : false
  if (el.tagName === 'INPUT' && isSensitive(el)) return false
  if (isCombobox(el)) {
    comboQueue.push({ el, value: adaptValue(key, el, value) })
    return false // counted when settleComboboxes() fills it
  }
  try { el.focus({ preventScroll: true }) } catch {}
  const v = adaptValue(key, el, value)
  const type = String(el.getAttribute('type') || '').toLowerCase()
  if (el.tagName === 'SELECT') {
    const opt = pickOption(el.options, v)
    if (!opt) return false
    el.value = opt.value
    dispatchAll(el)
    return true
  }
  if (type === 'checkbox') {
    const want = /^(yes|true|1|y|on)$/i.test(String(v))
    if (el.checked !== want) el.click()
    return true
  }
  if (el.isContentEditable || el.getAttribute('role') === 'textbox' && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
    fillContentEditable(el, v)
    return true
  }
  setNativeValue(el, String(v))
  dispatchAll(el)
  return true
}

// fieldMap: { key: HTMLElement | HTMLElement[] | RadioGroup[] }
export function fillFields(fieldMap, profile) {
  if (!profile) return { filled: 0 }
  const data = deriveProfile(profile)
  let count = 0
  for (const [key, targets] of Object.entries(fieldMap)) {
    const value = data[key]
    if (value == null) continue
    // Each entry is an element or a radio group (array of inputs).
    const list = Array.isArray(targets) ? targets : [targets]
    for (const t of list) {
      try {
        if (fillElement(key, t, value)) count++
      } catch (e) {
        console.debug('[SmartFill] fill failed', key, e)
      }
    }
  }
  return { filled: count, pending: comboQueue.length }
}

// ---------- undo ----------

function flatTargets(fieldMap) {
  const out = []
  for (const targets of Object.values(fieldMap)) {
    for (const t of Array.isArray(targets) ? targets : [targets]) {
      if (Array.isArray(t)) out.push(...t) // radio group
      else if (t) out.push(t)
    }
  }
  return out
}

// Record current values so a fill can be reverted.
export function snapshot(fieldMap) {
  return flatTargets(fieldMap).map((el) => ({
    el,
    value: el.value,
    checked: el.checked,
    html: el.isContentEditable ? el.innerHTML : undefined,
  }))
}

export function restore(snap = []) {
  let count = 0
  for (const { el, value, checked, html } of snap) {
    if (!el?.isConnected) continue
    if (html !== undefined) {
      el.innerHTML = html
      el.dispatchEvent(new Event('input', { bubbles: true }))
    } else if (el.type === 'file') {
      // File inputs can only be cleared, not set back to a previous file.
      if (!el.value || value) continue
      el.value = ''
      dispatchAll(el)
    } else if (el.type === 'checkbox' || el.type === 'radio') {
      if (el.checked === checked) continue
      el.checked = checked
      dispatchAll(el)
    } else if (isCombobox(el)) {
      // A chosen option isn't the input's value; Backspace on the empty input clears it in most libraries.
      if (value) continue
      try { el.focus({ preventScroll: true }) } catch {}
      setNativeValue(el, '')
      press(el, 'Backspace')
      el.blur()
    } else {
      if (el.value === value) continue
      if (el.tagName === 'SELECT') el.value = value
      else setNativeValue(el, value)
      dispatchAll(el)
    }
    count++
  }
  return count
}

// ---------- Screening answers ----------

// The question a field asks: its label, or the legend / question title around it.
export function questionText(el) {
  const own = labelText(el)
  if (own) return own
  return groupQuestion(el, [el])
}

// Fields whose question matches one of the saved screening answers.
// `claimed`: elements already filled by profile fields or rules (skipped here).
// Returns [{ target, question, answer }] where target is an element or a radio group.
export function findAnswerTargets(root = document, answers = [], claimed = new Set()) {
  if (!answers?.length) return []
  const out = []
  const radioGroups = new Set()
  for (const el of root.querySelectorAll(CANDIDATE_SELECTOR)) {
    if (claimed.has(el)) continue
    const type = String(el.getAttribute('type') || '').toLowerCase()
    if (el.tagName === 'INPUT' && SKIP_TYPES.has(type)) continue
    if (!isVisible(el) || isSensitive(el)) continue
    let target = el
    let question
    if (type === 'radio') {
      const name = el.getAttribute('name')
      if (!name || radioGroups.has(name)) continue
      radioGroups.add(name)
      target = Array.from(root.querySelectorAll('input[type="radio"]')).filter((r) => r.name === name && !r.disabled)
      if (target.some((r) => claimed.has(r))) continue
      question = groupQuestion(el, target)
    } else {
      question = questionText(el)
    }
    if (!question) continue
    const match = matchAnswer(question, answers)
    if (match) out.push({ target, question, answer: match.answer })
  }
  return out
}

// ---------- Resume upload ----------

const RESUME_TEXT = /\b(resume|cv|curriculum vitae|curriculum)\b/
const NOT_RESUME_TEXT = /\b(cover letter|photo|picture|avatar|image|transcript|portfolio|certificate|id proof|identity)\b/

function acceptsDocuments(el) {
  const accept = String(el.getAttribute('accept') || '').toLowerCase()
  if (!accept) return true
  return /pdf|msword|wordprocessingml|\.docx?|application\/\*|\*\/\*/.test(accept)
}

// File inputs that ask for a resume or CV. Hidden inputs are included: many sites hide the real
// input behind a styled "Upload" button.
export function findResumeInputs(root = document) {
  const out = []
  for (const el of root.querySelectorAll('input[type="file"]:not([disabled])')) {
    const text = `${labelText(el)} ${normalize([el.getAttribute('name'), el.id, el.getAttribute('aria-label')].filter(Boolean).join(' '))} ${normalize(el.closest('[class*="resume" i], [id*="resume" i], [class*="cv" i]') ? 'resume' : '')}`
    if (RESUME_TEXT.test(text) && !NOT_RESUME_TEXT.test(text) && acceptsDocuments(el)) out.push(el)
  }
  return out
}

function dataUrlToFile({ dataUrl, name, type }) {
  const [, b64 = ''] = String(dataUrl).split(',')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new File([bytes], name, { type: type || 'application/octet-stream' })
}

// Attach a stored file to a file input the way a real file pick does.
export function attachFile(input, file) {
  if (typeof DataTransfer === 'undefined') return false
  try {
    const dt = new DataTransfer()
    dt.items.add(dataUrlToFile(file))
    input.files = dt.files
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return input.files.length > 0
  } catch {
    return false
  }
}

// ---------- Multi-page forms ----------

// True when a fill target hasn't been filled in yet (used on later steps of a form, where
// SmartFill must never overwrite what the user already entered). Checkboxes count as not
// empty: unchecked is a valid answer.
export function isEmptyTarget(target) {
  if (Array.isArray(target)) return !target.some((r) => r.checked) // radio group
  const el = target
  if (!el) return false
  if (el.tagName === 'INPUT' && el.type === 'file') return !el.files?.length
  if (el.tagName === 'INPUT' && el.type === 'checkbox') return false
  if (el.tagName === 'SELECT') return !el.value
  if (isCombobox(el)) return !comboboxDisplay(el) && !String(el.value).trim()
  if (el.isContentEditable) return !el.textContent.trim()
  return !String(el.value ?? '').trim()
}
