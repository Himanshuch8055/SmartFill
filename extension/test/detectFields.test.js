// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { findFillableInputs, fillFields, deriveProfile, toIsoDate, pickOption } from '../src/lib/detectFields.js'

function mount(html) {
  document.body.innerHTML = html
}

function keysOf(map) {
  const out = {}
  for (const [k, list] of Object.entries(map)) out[k] = list.map((t) => (Array.isArray(t) ? t[0].name : t.name || t.id))
  return out
}

const profile = {
  fullName: 'Asha Verma',
  email: 'asha@example.com',
  phone: '+91 98765 43210',
  company: 'Acme',
  jobTitle: 'Engineer',
  address1: '12 MG Road',
  city: 'Pune',
  state: 'Maharashtra',
  zip: '411001',
  country: 'India',
  gender: 'Female',
  dob: '05/09/1995',
}

beforeEach(() => mount(''))

describe('detection', () => {
  it('maps first/last/user/company names correctly (not to fullName)', () => {
    mount(`
      <input name="first_name"><input name="last_name">
      <input name="username"><input name="company_name"><input name="full_name">`)
    expect(keysOf(findFillableInputs(document))).toEqual({
      firstName: ['first_name'],
      lastName: ['last_name'],
      username: ['username'],
      company: ['company_name'],
      fullName: ['full_name'],
    })
  })

  it('avoids common false positives', () => {
    mount(`
      <input name="hotel"><input name="statement"><input name="page_title">
      <input name="ethnicity"><input name="fileName">`)
    expect(findFillableInputs(document)).toEqual({})
  })

  it('prefers autocomplete over misleading names', () => {
    mount(`<input name="field7" autocomplete="family-name">`)
    expect(Object.keys(findFillableInputs(document))).toEqual(['lastName'])
  })

  it('uses <label for> and wrapping labels', () => {
    mount(`
      <label for="a">Given name</label><input id="a">
      <label>Mobile number <input id="b"></label>`)
    expect(keysOf(findFillableInputs(document))).toEqual({ firstName: ['a'], phone: ['b'] })
  })

  it('never touches sensitive fields', () => {
    mount(`
      <input type="password" name="password">
      <input name="cardNumber" autocomplete="cc-number">
      <input name="otp" autocomplete="one-time-code">
      <input name="captcha"><input type="hidden" name="email">`)
    expect(findFillableInputs(document)).toEqual({})
  })

  it('returns every matching element (billing + shipping)', () => {
    mount(`<input name="billing_city"><input name="shipping_city">`)
    expect(keysOf(findFillableInputs(document))).toEqual({ city: ['billing_city', 'shipping_city'] })
  })

  it('does not treat "confirm email" or "country code" as primary fields', () => {
    mount(`<input name="email"><input name="confirm_email"><select name="country_code"></select>`)
    expect(keysOf(findFillableInputs(document))).toEqual({ email: ['email'] })
  })
})

describe('filling', () => {
  it('fills inputs, selects, radios and dates', () => {
    mount(`
      <input name="first_name"><input name="last_name">
      <select name="country"><option value="">--</option><option value="IN">India</option></select>
      <fieldset><legend>Gender</legend>
        <label><input type="radio" name="g" value="m">Male</label>
        <label><input type="radio" name="g" value="f">Female</label>
      </fieldset>
      <input type="date" name="dob">
      <input name="phone" maxlength="10">`)
    const { filled } = fillFields(findFillableInputs(document), profile)
    const q = (s) => document.querySelector(s)
    expect(q('[name=first_name]').value).toBe('Asha')
    expect(q('[name=last_name]').value).toBe('Verma')
    expect(q('[name=country]').value).toBe('IN')
    expect(q('[value=f]').checked).toBe(true)
    expect(q('[name=dob]').value).toBe('1995-09-05')
    expect(q('[name=phone]').value).toBe('9876543210')
    expect(filled).toBe(6)
  })

  it('fires input/change events', () => {
    mount(`<input name="email">`)
    const events = []
    const el = document.querySelector('input')
    el.addEventListener('input', () => events.push('input'))
    el.addEventListener('change', () => events.push('change'))
    fillFields(findFillableInputs(document), profile)
    expect(events).toContain('input')
    expect(events).toContain('change')
  })

  it('accepts single-element maps (rules)', () => {
    mount(`<input id="x">`)
    fillFields({ email: document.getElementById('x') }, profile)
    expect(document.getElementById('x').value).toBe('asha@example.com')
  })
})

describe('adapters', () => {
  it('derives names both ways', () => {
    expect(deriveProfile({ firstName: 'A', lastName: 'B' }).fullName).toBe('A B')
    expect(deriveProfile({ fullName: 'A X B' })).toMatchObject({ firstName: 'A', lastName: 'B' })
  })
  it('converts dates', () => {
    expect(toIsoDate('1995-09-05')).toBe('1995-09-05')
    expect(toIsoDate('5/9/1995')).toBe('1995-09-05')
  })
  it('matches options by alias', () => {
    const opts = [{ value: 'US', text: 'United States' }, { value: 'GB', text: 'United Kingdom' }]
    expect(pickOption(opts, 'UK').value).toBe('GB')
    expect(pickOption(opts, 'usa').value).toBe('US')
  })
})
