/** @type {import('tailwindcss').Config} */
// Colors map to the design tokens in src/tokens.css (shared values with the extension).
const token = (name) => `rgb(var(--sf-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: { DEFAULT: token('surface'), 2: token('surface-2') },
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        fg: { DEFAULT: token('fg'), muted: token('fg-muted'), subtle: token('fg-subtle') },
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          fg: token('accent-fg'),
          subtle: token('accent-subtle'),
          text: token('accent-text'),
        },
        success: token('success'),
        focus: token('ring'),
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'sf-sm': 'var(--sf-shadow-sm)',
        'sf-lg': 'var(--sf-shadow-lg)',
      },
    },
  },
  plugins: [],
}
