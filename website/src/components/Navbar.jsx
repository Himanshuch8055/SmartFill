import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 dark:border-white/10 backdrop-blur supports-backdrop-blur:bg-white/60 dark:supports-backdrop-blur:bg-[#0b1220]/60">
      <div className="container-app h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="SmartFill logo" className="h-7 w-7 rounded" />
          <span className="font-bold tracking-tight">SmartFill</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link to="/features" className="hover:text-slate-900 dark:hover:text-white text-slate-600 dark:text-slate-300">Features</Link>
          <Link to="/how" className="hover:text-slate-900 dark:hover:text-white text-slate-600 dark:text-slate-300">How it works</Link>
          <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white text-slate-600 dark:text-slate-300">Privacy</Link>
          <Link to="/faq" className="hover:text-slate-900 dark:hover:text-white text-slate-600 dark:text-slate-300">FAQ</Link>
          <ThemeToggle />
          <Link to="/install" className="btn btn-primary">Get the Extension</Link>
        </nav>

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-[#20304d] hover:bg-slate-100 dark:hover:bg-[#131c31]"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              // Close icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.18 12 2.89 5.71 4.3 4.29l6.29 6.3 6.3-6.3z" />
              </svg>
            ) : (
              // Menu icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-200 dark:border-white/10">
          <nav className="container-app py-3 flex flex-col gap-2 text-sm">
            <Link onClick={() => setOpen(false)} to="/features" className="py-2 text-slate-700 dark:text-slate-300">Features</Link>
            <Link onClick={() => setOpen(false)} to="/how" className="py-2 text-slate-700 dark:text-slate-300">How it works</Link>
            <Link onClick={() => setOpen(false)} to="/privacy" className="py-2 text-slate-700 dark:text-slate-300">Privacy</Link>
            <Link onClick={() => setOpen(false)} to="/faq" className="py-2 text-slate-700 dark:text-slate-300">FAQ</Link>
            <Link onClick={() => setOpen(false)} to="/install" className="btn btn-primary mt-1">Get the Extension</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
