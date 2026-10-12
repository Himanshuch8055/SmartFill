// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { makeTestProfile, seededRandom } from '../src/lib/testData.js'
import { DEFAULT_PROFILE_DATA } from '../src/lib/storage.js'
import { findFillableInputs, fillFields } from '../src/lib/detectFields.js'

describe('test data', () => {
  it('has every profile field and only safe values', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const p = makeTestProfile(seededRandom(seed))
      expect(Object.keys(p).sort()).toEqual(Object.keys(DEFAULT_PROFILE_DATA).sort())
      expect(p.email).toMatch(/^[a-z]+\.[a-z']+\+\d{4}@example\.com$/)
      expect(p.fullName).toBe(`${p.firstName} ${p.lastName}`)
      expect(p.dob).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(p.phone).toMatch(/^\+\d/)
    }
  })

  it('is repeatable with a seed and different without one', () => {
    expect(makeTestProfile(seededRandom(7))).toEqual(makeTestProfile(seededRandom(7)))
    const emails = new Set(Array.from({ length: 20 }, () => makeTestProfile().email))
    expect(emails.size).toBeGreaterThan(15)
  })

  it('fills a sign-up form', () => {
    document.body.innerHTML = `
      <label for="f">First name</label><input id="f">
      <label for="e">Email</label><input id="e" type="email">
      <label for="c">Country</label><select id="c"><option value="">-</option><option>India</option><option>United States</option><option>United Kingdom</option><option>Canada</option></select>`
    const p = makeTestProfile(seededRandom(3))
    fillFields(findFillableInputs(document), p)
    expect(document.getElementById('f').value).toBe(p.firstName)
    expect(document.getElementById('e').value).toBe(p.email)
    expect(document.getElementById('c').value).toBe(p.country)
  })
})
