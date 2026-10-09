// Applies design tokens and the user's theme preference (system / light / dark) to a page.
import { themeCss } from './tokens'

export const THEMES = ['system', 'light', 'dark']
const STYLE_ID = 'sf-theme-tokens'

function injectTokens() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = themeCss('page')
  document.head.prepend(style)
}

export function applyTheme(pref) {
  const root = document.documentElement
  if (pref === 'light' || pref === 'dark') root.dataset.theme = pref
  else delete root.dataset.theme
}

// Call once at the top of each extension page, before rendering.
export function initTheme() {
  injectTokens()
  document.documentElement.dataset.sfUi = ''
  try {
    chrome.storage.local.get(['theme']).then(({ theme }) => applyTheme(theme))
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.theme) applyTheme(changes.theme.newValue)
    })
  } catch {
    // Outside the extension (tests): system theme only.
  }
}

export async function setThemePreference(pref) {
  applyTheme(pref)
  await chrome.storage.local.set({ theme: THEMES.includes(pref) ? pref : 'system' })
}
