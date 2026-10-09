// SmartFill design tokens: the single source for colors, shadows and radii.
// Colors are "R G B" triplets so Tailwind can apply opacity: rgb(var(--sf-accent) / 0.5).
// Used by extension pages (via Tailwind) and by on-page shadow-DOM UI (via themeCss).

export const COLORS = {
  light: {
    bg: '248 248 250', // page background
    surface: '255 255 255', // cards, popovers
    'surface-2': '244 244 246', // subtle fills, hover
    line: '228 228 231', // default borders
    'line-strong': '212 212 216',
    fg: '24 24 27', // primary text
    'fg-muted': '82 82 91', // secondary text (AA on surface and bg)
    'fg-subtle': '113 113 122', // hints, placeholders
    accent: '79 70 229', // indigo-600
    'accent-hover': '67 56 202',
    'accent-fg': '255 255 255',
    'accent-subtle': '238 242 255',
    'accent-text': '67 56 202',
    success: '21 128 61',
    'success-subtle': '240 253 244',
    warning: '180 83 9',
    'warning-subtle': '255 251 235',
    danger: '220 38 38',
    'danger-hover': '185 28 28',
    'danger-solid': '220 38 38', // filled danger buttons (white text)
    'danger-subtle': '254 242 242',
    ring: '99 102 241',
  },
  dark: {
    bg: '12 12 15',
    surface: '24 24 28',
    'surface-2': '34 34 40',
    line: '44 44 52',
    'line-strong': '63 63 72',
    fg: '244 244 245',
    'fg-muted': '186 186 194',
    'fg-subtle': '139 139 150',
    accent: '94 96 236', // indigo, tuned for 4.5:1 with white text
    'accent-hover': '84 86 226',
    'accent-fg': '255 255 255',
    'accent-subtle': '35 33 80',
    'accent-text': '165 180 252',
    success: '74 222 128',
    'success-subtle': '18 44 28',
    warning: '251 191 36',
    'warning-subtle': '52 38 10',
    danger: '248 113 113',
    'danger-hover': '252 165 165',
    'danger-solid': '200 30 30',
    'danger-subtle': '58 20 22',
    ring: '129 140 248',
  },
}

export const SHADOWS = {
  light: {
    sm: '0 1px 2px rgb(16 16 24 / 0.06)',
    md: '0 4px 12px rgb(16 16 24 / 0.08), 0 1px 3px rgb(16 16 24 / 0.06)',
    lg: '0 16px 40px rgb(16 16 24 / 0.14), 0 2px 6px rgb(16 16 24 / 0.08)',
  },
  dark: {
    sm: '0 1px 2px rgb(0 0 0 / 0.4)',
    md: '0 4px 12px rgb(0 0 0 / 0.45)',
    lg: '0 16px 40px rgb(0 0 0 / 0.55)',
  },
}

export const FONT_SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

function declarations(mode) {
  const c = Object.entries(COLORS[mode]).map(([k, v]) => `--sf-${k}:${v};`)
  const s = Object.entries(SHADOWS[mode]).map(([k, v]) => `--sf-shadow-${k}:${v};`)
  return c.join('') + s.join('') + `color-scheme:${mode};`
}

// CSS that defines the tokens and switches them for dark mode.
// target 'page': variables on :root, theme forced with <html data-theme="light|dark">.
// target 'shadow': variables on :host, theme forced with data-theme on the shadow host.
export function themeCss(target = 'page') {
  const light = declarations('light')
  const dark = declarations('dark')
  const font = `--sf-font-sans:${FONT_SANS};`
  if (target === 'shadow') {
    return (
      `:host{${font}${light}}` +
      `@media (prefers-color-scheme: dark){:host(:not([data-theme="light"])){${dark}}}` +
      `:host([data-theme="dark"]){${dark}}`
    )
  }
  return (
    `:root{${font}${light}}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}` +
    `:root[data-theme="dark"]{${dark}}`
  )
}
