// Build a CSS selector that finds the same field again after a reload.
// Prefers stable attributes (id, name) and falls back to a short nth-of-type path.

// Ids/names that look generated (react-select-3-input, :r1:, field_8f3a9c2e) change between loads.
const UNSTABLE = /^:|\d{3,}|[0-9a-f]{8,}|^(mui|react|ember|ext|j_?id|uid|rc)[-_]?\d|^\d/i

function cssEscape(value) {
  if (globalThis.CSS?.escape) return CSS.escape(value)
  return String(value).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c)
}

function attrValue(value) {
  return '"' + String(value).replace(/["\\]/g, '\\$&') + '"'
}

function isUnique(doc, selector, el) {
  try {
    const found = doc.querySelectorAll(selector)
    return found.length === 1 && found[0] === el
  } catch {
    return false
  }
}

export function buildSelector(el) {
  const doc = el.ownerDocument
  const tag = el.tagName.toLowerCase()

  if (el.id && !UNSTABLE.test(el.id)) {
    const sel = `#${cssEscape(el.id)}`
    if (isUnique(doc, sel, el)) return sel
  }

  const name = el.getAttribute('name')
  if (name && !UNSTABLE.test(name)) {
    const sel = `${tag}[name=${attrValue(name)}]`
    if (isUnique(doc, sel, el)) return sel
  }

  for (const attr of ['aria-label', 'placeholder', 'data-testid', 'autocomplete']) {
    const v = el.getAttribute(attr)
    if (v && v.length < 80) {
      const sel = `${tag}[${attr}=${attrValue(v)}]`
      if (isUnique(doc, sel, el)) return sel
    }
  }

  // nth-of-type path, anchored at the nearest ancestor with a stable id
  const parts = []
  let node = el
  while (node && node.nodeType === 1 && node !== doc.documentElement) {
    if (node !== el && node.id && !UNSTABLE.test(node.id)) {
      parts.unshift(`#${cssEscape(node.id)}`)
      break
    }
    const t = node.tagName.toLowerCase()
    const siblings = node.parentElement ? Array.from(node.parentElement.children).filter((c) => c.tagName === node.tagName) : []
    parts.unshift(siblings.length > 1 ? `${t}:nth-of-type(${siblings.indexOf(node) + 1})` : t)
    node = node.parentElement
  }
  return parts.join(' > ')
}
