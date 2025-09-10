import React from 'react'
import useTheme from '../hooks/useTheme'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`btn px-2 py-2 border-none bg-transparent hover:bg-slate-100 dark:hover:bg-[#131c31] ${className}`}
    >
      {isDark ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-yellow-400">
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Zm0-18a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Zm10 7h-1a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2ZM3 11H2a1 1 0 0 1 0-2h1a1 1 0 1 1 0 2Zm14.95 7.536-0.707-0.707a1 1 0 1 1 1.414-1.414l0.707 0.707a1 1 0 1 1-1.414 1.414ZM5.343 6.343 4.636 5.636A1 1 0 1 1 6.05 4.222l0.707 0.707A1 1 0 1 1 5.343 6.343Zm12.02-2.121 0.707-0.707a1 1 0 1 1 1.414 1.414l-0.707 0.707A1 1 0 0 1 17.364 4.222ZM4.222 17.95l-0.707 0.707A1 1 0 1 1 2.101 17.243l0.707-0.707A1 1 0 0 1 4.222 17.95Z"/>
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-slate-700">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z"/>
        </svg>
      )}
    </button>
  )
}
