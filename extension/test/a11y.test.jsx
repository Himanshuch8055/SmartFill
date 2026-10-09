// @vitest-environment jsdom
// Accessibility checks: render each real extension page (with chrome.* mocked like the dev preview)
// and run axe-core. Colour contrast is covered separately by tokens.test.js because jsdom can't
// compute rendered colours.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import axe from 'axe-core'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function mountPage(modulePath, hash = '') {
  vi.resetModules()
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.head.innerHTML = '<title>SmartFill</title>'
  document.body.innerHTML = '<div id="root"></div>'
  document.documentElement.lang = 'en'
  window.location.hash = hash
  await import('../src/dev/chromeMock.js')
  await import(/* @vite-ignore */ modulePath)
  await wait(400) // let data load and effects settle
}

async function violations() {
  const result = await axe.run(document, {
    rules: { 'color-contrast': { enabled: false } },
    resultTypes: ['violations'],
  })
  return result.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
}

beforeEach(() => {
  window.open = vi.fn()
})

describe('accessibility (axe-core)', () => {
  it('popup', async () => {
    await mountPage('../src/popup/main.jsx')
    expect(document.body.textContent).toContain('Fill')
    expect(await violations()).toEqual([])
  })

  for (const page of ['', '#/sites', '#/settings', '#/backup', '#/about']) {
    it(`settings page ${page || '(profile)'}`, async () => {
      await mountPage('../src/options/main.jsx', page)
      expect(document.querySelector('nav')).not.toBeNull()
      expect(await violations()).toEqual([])
    })
  }

  it('welcome page', async () => {
    await mountPage('../src/welcome/main.jsx')
    expect(document.body.textContent).toContain('Welcome to SmartFill')
    expect(await violations()).toEqual([])
  })
})
