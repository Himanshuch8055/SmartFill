// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { buildSelector } from '../src/lib/selector.js'

function mount(html) {
  document.body.innerHTML = html
}

function roundTrip(el) {
  const sel = buildSelector(el)
  expect(document.querySelector(sel)).toBe(el)
  return sel
}

describe('buildSelector', () => {
  it('uses a stable id', () => {
    mount(`<input id="email"><input id="phone">`)
    expect(roundTrip(document.getElementById('phone'))).toBe('#phone')
  })

  it('skips generated ids and uses name', () => {
    mount(`<input id=":r12:" name="mobile">`)
    expect(roundTrip(document.querySelector('input'))).toBe('input[name="mobile"]')
  })

  it('falls back to placeholder / aria-label', () => {
    mount(`<input id="react-select-123-input" placeholder="Your city">`)
    expect(roundTrip(document.querySelector('input'))).toBe('input[placeholder="Your city"]')
  })

  it('builds an nth-of-type path anchored at a stable ancestor id', () => {
    mount(`<form id="apply"><div><input><input></div></form>`)
    const sel = roundTrip(document.querySelectorAll('input')[1])
    expect(sel.startsWith('#apply')).toBe(true)
  })

  it('handles duplicate names by falling back', () => {
    mount(`<div><input name="q"></div><div><input name="q"></div>`)
    roundTrip(document.querySelectorAll('input')[1])
  })
})
