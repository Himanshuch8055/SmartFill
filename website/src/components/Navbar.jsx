import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Github } from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import InstallButtons from './InstallButtons'
import { GITHUB_URL } from '../utils/links'

const SECTIONS = [
  { href: '#demo', label: 'Demo' },
  { href: '#features', label: 'Features' },
  { href: '#compare', label: 'Compare' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="container-site h-16 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-focus/60" aria-label="SmartFill home">
          <Logo size={28} />
          <span className="text-[17px] font-semibold tracking-[-0.01em]">SmartFill</span>
        </Link>

        <nav aria-label="Sections" className="hidden md:flex items-center gap-1 text-sm">
          {SECTIONS.map((s) => (
            <a
              key={s.href}
              href={onHome ? s.href : `/${s.href}`}
              className="px-3 py-2 rounded-lg text-fg-muted hover:text-fg outline-none focus-visible:ring-2 focus-visible:ring-focus/60"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="SmartFill on GitHub"
            title="SmartFill on GitHub"
            className="h-9 w-9 grid place-items-center rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 outline-none focus-visible:ring-2 focus-visible:ring-focus/60"
          >
            <Github size={18} aria-hidden />
          </a>
          <ThemeToggle />
          <InstallButtons size="sm" className="ml-2 hidden sm:flex" />
        </div>
      </div>
    </header>
  )
}
