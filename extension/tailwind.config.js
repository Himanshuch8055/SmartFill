/** @type {import('tailwindcss').Config} */
// Colors map to the design tokens in src/ui/tokens.js (CSS variables), so light/dark
// switching happens in CSS and components never need dark: variants.
const token = (name) => `rgb(var(--sf-${name}) / <alpha-value>)`

export default {
  content: ['./*.html', './src/**/*.{html,js,jsx,ts,tsx}'],
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
        success: { DEFAULT: token('success'), subtle: token('success-subtle') },
        warning: { DEFAULT: token('warning'), subtle: token('warning-subtle') },
        danger: { DEFAULT: token('danger'), hover: token('danger-hover'), solid: token('danger-solid'), subtle: token('danger-subtle') },
        focus: token('ring'),
      },
      fontFamily: {
        // Fallback keeps pages that don't load the tokens (legacy pages, tests) on the system font.
        sans: 'var(--sf-font-sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif)',
      },
      boxShadow: {
        'sf-sm': 'var(--sf-shadow-sm)',
        'sf-md': 'var(--sf-shadow-md)',
        'sf-lg': 'var(--sf-shadow-lg)',
      },
      keyframes: {
        'sf-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'sf-scale-in': { from: { opacity: '0', transform: 'scale(.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'sf-slide-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'sf-fade-in': 'sf-fade-in 150ms ease-out',
        'sf-scale-in': 'sf-scale-in 150ms ease-out',
        'sf-slide-up': 'sf-slide-up 180ms ease-out',
      },
    },
  },
  plugins: [],
}
