// Shared shadow-DOM layer for everything SmartFill draws on web pages (widget, preview,
// toasts, prompts). Isolated from page styles, themed with the same design tokens as the
// extension pages, and following the user's theme preference.
import { themeCss } from '../ui/tokens'

export const BASE_CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .sf {
    font-family: var(--sf-font-sans); font-size: 13px; line-height: 1.4; color: rgb(var(--sf-fg));
    -webkit-font-smoothing: antialiased;
  }
  .sf-btn {
    all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    gap: 6px; height: 32px; padding: 0 12px; border-radius: 8px; font: 500 13px/1 var(--sf-font-sans); white-space: nowrap;
    transition: background-color .15s, color .15s;
  }
  .sf-btn:focus-visible, .sf-link:focus-visible, .sf-icon-btn:focus-visible { outline: 2px solid rgb(var(--sf-ring) / .6); outline-offset: 2px; }
  .sf-primary { background: rgb(var(--sf-accent)); color: rgb(var(--sf-accent-fg)); }
  .sf-primary:hover { background: rgb(var(--sf-accent-hover)); }
  .sf-primary:disabled { background: rgb(var(--sf-surface-2)); color: rgb(var(--sf-fg-subtle)); cursor: default; }
  .sf-secondary { background: rgb(var(--sf-surface)); color: rgb(var(--sf-fg)); box-shadow: inset 0 0 0 1px rgb(var(--sf-line)); }
  .sf-secondary:hover { background: rgb(var(--sf-surface-2)); }
  .sf-link {
    all: unset; cursor: pointer; font: 13px/1.4 var(--sf-font-sans); color: rgb(var(--sf-fg-muted)); border-radius: 4px;
  }
  .sf-link:hover { color: rgb(var(--sf-fg)); text-decoration: underline; text-underline-offset: 2px; }
  .sf-link.accent { color: rgb(var(--sf-accent-text)); font-weight: 500; }
  .sf-icon-btn {
    all: unset; cursor: pointer; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px;
    color: rgb(var(--sf-fg-subtle));
  }
  .sf-icon-btn:hover { background: rgb(var(--sf-surface-2)); color: rgb(var(--sf-fg)); }
  .sf-card {
    background: rgb(var(--sf-surface)); border: 1px solid rgb(var(--sf-line)); border-radius: 12px;
    box-shadow: var(--sf-shadow-lg);
  }
  @keyframes sf-in { from { opacity: 0; transform: translateY(4px) scale(.98); } to { opacity: 1; transform: none; } }
  .sf-enter { animation: sf-in .16s ease-out; }
  @media (prefers-reduced-motion: reduce) { .sf-enter { animation: none; } }
`

// Logo mark as an SVG string (same artwork as icons/icon.svg and the Logo component).
export const LOGO_SVG = `<svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="sf-logo-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#4338ca"/></linearGradient></defs><path d="M9.5 0h13C29 0 32 3 32 9.5v13C32 29 29 32 22.5 32h-13C3 32 0 29 0 22.5v-13C0 3 3 0 9.5 0Z" fill="url(#sf-logo-g)"/><path d="M9 10.5h14M9 16h10M9 21.5h7" stroke="white" stroke-width="2.6" stroke-linecap="round"/><circle cx="21.6" cy="21.5" r="2.3" fill="white"/></svg>`

const hosts = new Set()
let themePref = 'system'

function applyTheme(host) {
  if (themePref === 'light' || themePref === 'dark') host.setAttribute('data-theme', themePref)
  else host.removeAttribute('data-theme')
}

try {
  chrome.storage.local.get(['theme']).then(({ theme }) => {
    themePref = theme || 'system'
    hosts.forEach(applyTheme)
  })
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.theme) {
      themePref = changes.theme.newValue || 'system'
      hosts.forEach(applyTheme)
    }
  })
} catch {}

// Create (or reuse) a fixed, full-viewport, click-through layer with its own shadow root.
export function createLayer(id, extraCss = '') {
  const existing = document.getElementById(id)
  if (existing?.__sfLayer) return existing.__sfLayer
  const host = document.createElement('div')
  host.id = id
  Object.assign(host.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2147483647' })
  document.documentElement.appendChild(host)
  // Closed so pages can't reach in; the dev preview opens it for testing.
  const root = host.attachShadow({ mode: globalThis.__SF_DEV_OPEN_SHADOW__ ? 'open' : 'closed' })
  const style = document.createElement('style')
  style.textContent = themeCss('shadow') + BASE_CSS + extraCss
  root.appendChild(style)
  hosts.add(host)
  applyTheme(host)
  const layer = {
    host,
    root,
    remove() {
      hosts.delete(host)
      host.remove()
    },
  }
  host.__sfLayer = layer
  return layer
}

export function el(tag, className, text) {
  const n = document.createElement(tag)
  if (className) n.className = className
  if (text != null) n.textContent = text
  return n
}
