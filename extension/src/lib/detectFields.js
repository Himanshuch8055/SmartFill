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
  { key: 'address2', ac: ['address-line2'], re: /\baddress\s*(line\s*)?2\b|\bapartment\b|\bapt\b|\bsuite\b|\bunit\b|\blandmark\b/ },
  { key: 'address1', ac: ['address-line1', 'street-address'], re: /\baddress\s*(line\s*)?1?\b|\bstreet\b/, not: /\be\s*-?\s*mail\b|\bweb\b|\bip\b|\b(line\s*)?2\b/ },
  { key: 'city', ac: ['address-level2'], re: /\bcity\b|\btown\b/, not: /\bethnicity\b/ },
  { key: 'state', ac: ['address-level1'], re: /\bstate\b|\bprovince\b|\bregion\b|\bcounty\b/, not: /statement|\bcountry\b/ },
  { key: 'zip', ac: ['postal-code'], re: /\bzip\b|\bpostal\b|\bpost\s*code\b|\bpin\s*code\b|\bpincode\b/ },
  { key: 'country', ac: ['country', 'country-name'], re: /\bcountry\b/, not: /\bcode\b/ },
  { key: 'linkedin', re: /\blinked\s*in\b/ },
  { key: 'github', re: /\bgit\s*hub\b/ },
  { key: 'portfolio', re: /\bportfolio\b/ },
  { key: 'website', ac: ['url'], re: /\bwebsite\b|\bhomepage\b|\bpersonal\s*(site|url)\b/, type: ['url'] },
  { key: 'bio', re: /\babout\s*(you|yourself|me)\b|\bbio\b|\bsummary\b|\bcover\s*letter\b/ },
  // Generic "name" last so first/last/user/company names win.
  { key: 'fullName', ac: ['name'], re: /\b(full\s*)?name\b|\byour\s*name\b/, not: /\b(first|last|middle|given|family|sur|user|company|business|file|account|card|nick|display|father|mother|spouse|organi[sz]ation|school|college|university|project|product)\b/ },
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
    if (title) parts.push(title)
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

// Returns { key, score } or null
export function scoreElement(el) {
  const s = getSignals(el)
  if (isSensitive(el, s)) return null
  let best = null
  for (const spec of FIELD_SPECS) {
    let score = 0
    if (spec.ac && s.ac.some((t) => spec.ac.includes(t))) score += WEIGHTS.ac
    if (textMatches(spec, s.label)) score += WEIGHTS.label
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
    if (!isVisible(el)) continue
    // Radios: score once per group, using the group's legend/question text
    if (type === 'radio') {
      const name = el.getAttribute('name')
      if (!name || radioGroups.has(name)) continue
      radioGroups.add(name)
      const group = Array.from(root.querySelectorAll('input[type="radio"]')).filter((r) => r.name === name && !r.disabled)
      const legend = normalize(el.closest('fieldset')?.querySelector('legend')?.textContent || el.closest(QUESTION_ROOT)?.querySelector(QUESTION_TITLE)?.textContent || '')
      const text = `${legend} ${normalize(name)}`
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
export function fillElement(key, target, value) {
  if (value == null || String(value) === '') return false
  if (Array.isArray(target)) return fillRadioGroup(target, value)
  const el = target
  if (!el?.isConnected) return false
  if (el.tagName === 'INPUT' && isSensitive(el)) return false
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
  try { console.debug('[SmartFill] Total filled:', count) } catch {}
  return { filled: count }
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
    } else if (el.type === 'checkbox' || el.type === 'radio') {
      if (el.checked === checked) continue
      el.checked = checked
      dispatchAll(el)
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
