import { useEffect, useState, useCallback } from 'react'

// Light by default. The toggle switches to dark and remembers it.
// ?theme=light|dark in the URL previews a theme without saving it.
const STORAGE_KEY = 'smartfill-theme'

function readTheme() {
  try {
    const fromUrl = new URLSearchParams(location.search).get('theme')
    if (fromUrl === 'light' || fromUrl === 'dark') return fromUrl
    if (localStorage.getItem(STORAGE_KEY) === 'dark') return 'dark'
  } catch {}
  return 'light'
}

export default function useTheme() {
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.dataset.theme = 'dark'
    else root.removeAttribute('data-theme')
  }, [theme])

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      if (next === 'dark') localStorage.setItem(STORAGE_KEY, 'dark')
      else localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [theme])

  return { isDark: theme === 'dark', toggle }
}
