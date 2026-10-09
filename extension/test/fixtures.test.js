// @vitest-environment jsdom
// Data-driven detection tests: each fixture marks every field with data-expect="<key>" or "none".
// To cover a new site, add an HTML file to test/fixtures/.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { findFillableInputs } from '../src/lib/detectFields.js'

const dir = path.join(__dirname, 'fixtures')
const fixtures = fs.readdirSync(dir).filter((f) => f.endsWith('.html'))

function describeEl(el) {
  return el.outerHTML.replace(/\s*data-expect="[^"]*"/, '').slice(0, 120)
}

describe.each(fixtures)('%s', (file) => {
  it('maps every field to the expected key', () => {
    document.body.innerHTML = fs.readFileSync(path.join(dir, file), 'utf8')
    const map = findFillableInputs(document)
    const actual = new Map()
    for (const [key, targets] of Object.entries(map)) {
      for (const t of targets) for (const el of Array.isArray(t) ? t : [t]) actual.set(el, key)
    }
    const mismatches = []
    for (const el of document.querySelectorAll('[data-expect]')) {
      const want = el.getAttribute('data-expect')
      const got = actual.get(el) || 'none'
      if (got !== want) mismatches.push(`expected ${want}, got ${got}: ${describeEl(el)}`)
    }
    expect(mismatches).toEqual([])
  })
})
