import { describe, it, expect } from 'vitest'
import { COLORS, themeCss } from '../src/ui/tokens.js'

// WCAG 2.x relative luminance and contrast ratio.
function luminance(triplet) {
  const [r, g, b] = triplet.split(' ').map((v) => {
    const c = Number(v) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// [foreground, background, minimum ratio]: 4.5 for body text, 3 for large text / UI parts.
const PAIRS = [
  ['fg', 'surface', 4.5],
  ['fg', 'bg', 4.5],
  ['fg-muted', 'surface', 4.5],
  ['fg-muted', 'bg', 4.5],
  ['fg-subtle', 'surface', 3],
  ['accent-fg', 'accent', 4.5],
  ['accent-text', 'surface', 4.5],
  ['accent-text', 'accent-subtle', 4.5],
  ['danger', 'surface', 4.5],
  ['success', 'surface', 3],
  ['warning', 'surface', 3],
]

describe('design tokens', () => {
  it('light and dark define the same tokens', () => {
    expect(Object.keys(COLORS.dark).sort()).toEqual(Object.keys(COLORS.light).sort())
  })

  for (const mode of ['light', 'dark']) {
    it.each(PAIRS)(`${mode}: %s on %s meets %d:1`, (fg, bg, min) => {
      expect(contrast(COLORS[mode][fg], COLORS[mode][bg])).toBeGreaterThanOrEqual(min)
    })
    it(`${mode}: white text on solid danger buttons meets 4.5:1`, () => {
      expect(contrast('255 255 255', COLORS[mode]['danger-solid'])).toBeGreaterThanOrEqual(4.5)
    })
  }

  it('generates page and shadow-DOM CSS with dark overrides', () => {
    const page = themeCss('page')
    expect(page).toContain(':root{')
    expect(page).toContain(':root[data-theme="dark"]')
    expect(page).toContain('--sf-accent:79 70 229')
    const shadow = themeCss('shadow')
    expect(shadow).toContain(':host{')
    expect(shadow).toContain(':host([data-theme="dark"])')
  })
})
