// Simple field detection and mapping heuristics
// Returns a map of logical field keys to DOM elements

const KEYWORDS = [
  { key: 'fullName', patterns: [/name/i, /full.?name/i] },
  { key: 'firstName', patterns: [/first.?name/i, /^fname$/i] },
  { key: 'lastName', patterns: [/last.?name/i, /^lname$/i, /surname/i, /family.?name/i] },
  { key: 'email', patterns: [/email/i, /^e-?mail$/i] },
  { key: 'phone', patterns: [/phone/i, /mobile/i, /tel/i, /phone.?number/i] },
  { key: 'company', patterns: [/company/i, /organization/i, /employer/i] },
  { key: 'jobTitle', patterns: [/title/i, /position/i, /role/i] },
  { key: 'address1', patterns: [/^address$/i, /address(?!.*(2|line\s*2))/i, /street/i, /address\s*line\s*1/i] },
  { key: 'address2', patterns: [/address.*(2|line\s*2)/i, /apt|suite|unit/i] },
  { key: 'city', patterns: [/city/i, /town/i] },
  { key: 'state', patterns: [/state/i, /province/i, /region/i] },
  { key: 'zip', patterns: [/zip/i, /postal/i] },
  { key: 'country', patterns: [/country/i] },
  { key: 'website', patterns: [/website/i, /url/i] },
  { key: 'linkedin', patterns: [/linkedin/i] },
]

function guessKeyFromLabelText(text) {
  if (!text) return null
  const t = String(text).trim()
  if (/full\s*name/i.test(t)) return 'fullName'
  if (/first\s*name/i.test(t)) return 'firstName'
  if (/last\s*name|surname|family\s*name/i.test(t)) return 'lastName'
  if (/email/i.test(t)) return 'email'
  if (/phone|mobile|tel|phone\s*number/i.test(t)) return 'phone'
  if (/company|organization|employer/i.test(t)) return 'company'
  if (/job\s*title|position|role/i.test(t)) return 'jobTitle'
  if (/address\s*line\s*1|^address$/i.test(t)) return 'address1'
  if (/address\s*line\s*2|apt|suite|unit/i.test(t)) return 'address2'
  if (/city|town/i.test(t)) return 'city'
  if (/state|province|region/i.test(t)) return 'state'
  if (/zip|postal/i.test(t)) return 'zip'
  if (/country/i.test(t)) return 'country'
  if (/website|url/i.test(t)) return 'website'
  if (/linkedin/i.test(t)) return 'linkedin'
  return null
}

function textFromAriaLabelledBy(node) {
  const ids = (node.getAttribute('aria-labelledby') || '').trim()
  if (!ids) return ''
  return ids
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(' ')
}

function matchKey(input) {
  const labelledByText = textFromAriaLabelledBy(input)
  const nearbyTitle = input.closest('[role="listitem"], .freebirdFormviewerComponentsQuestionBaseRoot, .m2, .o3Dpx')?.querySelector('[role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle, label')?.textContent || ''
  const attrs = [
    input.getAttribute('name'),
    input.getAttribute('id'),
    input.getAttribute('placeholder'),
    input.getAttribute('aria-label'),
    input.getAttribute('autocomplete'),
    labelledByText,
    nearbyTitle,
  ]
    .filter(Boolean)
    .join(' ')

  for (const k of KEYWORDS) {
    if (k.patterns.some((re) => re.test(attrs))) return k.key
  }
  const guess = guessKeyFromLabelText(attrs)
  if (guess) return guess
  // semantic types
  switch (input.type) {
    case 'email':
      return 'email'
    case 'tel':
      return 'phone'
    case 'url':
      return 'website'
    default:
      return null
  }
}

export function findFillableInputs(root = document) {
  const candidates = Array.from(
    root.querySelectorAll(
      'input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"]:not([aria-disabled="true"])'
    )
  )

  const map = {}

  // Google Forms: map question containers to their textbox using the question title
  try {
    const questionRoots = root.querySelectorAll('.freebirdFormviewerComponentsQuestionBaseRoot, [role="listitem"].Qr7Oae')
    questionRoots.forEach((q) => {
      const title = q.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle, [role="heading"], .M7eMe')?.textContent?.trim()
      const textbox = q.querySelector('[role="textbox"], [contenteditable]:not([contenteditable="false"])')
      const key = guessKeyFromLabelText(title)
      if (title && textbox && key && !map[key]) {
        map[key] = textbox
      }
    })
  } catch {}

  // Fallback: scan all textboxes and attempt to resolve a title per field
  try {
    const textboxes = root.querySelectorAll('[role="textbox"], [contenteditable]:not([contenteditable="false"])')
    textboxes.forEach((tb) => {
      const title = tb.closest('[role="listitem"], .freebirdFormviewerComponentsQuestionBaseRoot, .m2, .o3Dpx')?.querySelector('[role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle, .M7eMe, label')?.textContent?.trim()
      const key = guessKeyFromLabelText(title) || matchKeyForContentEditable(tb)
      if (key && !map[key]) map[key] = tb
    })
  } catch {}

  for (const el of candidates) {
    const key = el.isContentEditable ? matchKeyForContentEditable(el) : matchKey(el)
    if (key && !map[key]) map[key] = el
  }

  try {
    const keys = Object.keys(map)
    if (keys.length) console.debug('[SmartFill] Detected fields:', keys)
    const counts = {
      inputs: root.querySelectorAll('input:not([type=hidden]):not([disabled])').length,
      textareas: root.querySelectorAll('textarea:not([disabled])').length,
      selects: root.querySelectorAll('select:not([disabled])').length,
      textboxes: root.querySelectorAll('[role="textbox"], [contenteditable]:not([contenteditable="false"])').length,
    }
    console.debug('[SmartFill] Page controls:', counts)
  } catch {}

  return map
}

function setNativeValue(el, value) {
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype
  const desc = Object.getOwnPropertyDescriptor(proto, 'value')
  desc?.set?.call(el, value)
}

function dispatchAll(el) {
  try {
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: String(el.value ?? ''), inputType: 'insertText' }))
  } catch {}
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

function matchKeyForContentEditable(node) {
  // Walk up to find an associated label via aria-label or nearest labelled element
  const aria = node.getAttribute('aria-label') || node.closest('[aria-label]')?.getAttribute('aria-label') || ''
  const labelledByText = textFromAriaLabelledBy(node)
  const nearbyTitle = node.closest('[role="listitem"], .freebirdFormviewerComponentsQuestionBaseRoot, .m2, .o3Dpx')?.querySelector('[role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle, label')?.textContent || ''

  const labelText = [aria, labelledByText, nearbyTitle].filter(Boolean).join(' ')
  for (const k of KEYWORDS) {
    if (k.patterns.some((re) => re.test(labelText))) return k.key
  }
  return guessKeyFromLabelText(labelText)
}

export function fillFields(fieldMap, profile) {
  if (!profile) return { filled: 0 }
  let count = 0
  for (const [key, el] of Object.entries(fieldMap)) {
    const value = profile[key]
    if (value == null) continue
    // Ensure target gets focus (many frameworks attach listeners on focus)
    try { el.focus({ preventScroll: true }) } catch {}
    if (el.tagName === 'SELECT') {
      const option = Array.from(el.options).find(
        (o) => o.value?.toLowerCase() === String(value).toLowerCase() ||
               o.text?.toLowerCase() === String(value).toLowerCase()
      )
      if (option) {
        el.value = option.value
        dispatchAll(el)
        count++
      }
    } else if (el.isContentEditable) {
      // Google Forms-friendly fill sequence
      try {
        // Focus + click to ensure caret and listeners
        try { el.click() } catch {}
        try { el.focus({ preventScroll: true }) } catch {}

        // Select all existing content
        const sel = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(el)
        sel.removeAllRanges()
        sel.addRange(range)

        // Fire beforeinput (insertFromPaste) so frameworks prepare state
        try {
          el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertFromPaste', data: String(value) }))
        } catch {}

        // Replace content via execCommand, widely supported on Forms
        document.execCommand('selectAll', false, undefined)
        const ok = document.execCommand('insertText', false, String(value))
        if (!ok) {
          // Fallback
          el.textContent = String(value)
        }

        // Key events can wake some listeners
        try {
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
          el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
        } catch {}
      } catch {
        el.textContent = String(value)
      }
      // Finalize with input/change
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      count++
    } else {
      try {
        setNativeValue(el, value)
      } catch (e) {
        el.value = value
      }
      dispatchAll(el)
      count++
    }
    try { console.debug('[SmartFill] Filled', key) } catch {}
  }
  try { console.debug('[SmartFill] Total filled:', count) } catch {}
  return { filled: count }
}
