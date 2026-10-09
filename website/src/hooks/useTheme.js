import { useEffect, useState, useCallback } from 'react'

// Theme preference: 'system' (default, follows the OS), 'light' or 'dark'.
// ?theme=light|dark in the URL previews a theme without saving it.
const STORAGE_KEY = 'smartfill-theme'
const valid = (v) => v === 'light' || v === 'dark'

function readPref() {
  try {
    const fromUrl = new URLSearchParams(location.search).get('theme')
    if (valid(fromUrl)) return fromUrl
    const saved = localStorage.getItem(STORAGE_KEY)
    if (valid(saved)) return saved
  } catch {}
  return 'system'
}

const systemIsDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches

export default function useTheme() {
  const [pref, setPref] = useState(readPref)

  useEffect(() => {
    const root = document.documentElement
    if (pref === 'system') root.removeAttribute('data-theme')
    else root.dataset.theme = pref
  }, [pref])

  const isDark = pref === 'dark' || (pref === 'system' && systemIsDark())

  // Toggling switches to the opposite of what's shown, and remembers the choice.
  const toggle = useCallback(() => {
    const next = isDark ? 'light' : 'dark'
    setPref(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}
  }, [isDark])

  return { isDark, toggle }
}
