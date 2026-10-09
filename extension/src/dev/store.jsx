// Store art composer (dev only): /dev/store.html?shot=1..4 renders a 1280x800 store
// screenshot from the real extension screens; ?shot=tile renders the 440x280 promo tile.
// Captured by scripts/store-screenshots.mjs.
import React from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import { Logo, themeCss } from '../ui'

// Always light for store art. Layout uses inline styles so it doesn't depend on Tailwind
// having compiled this dev-only file.
const tokens = document.createElement('style')
tokens.textContent = themeCss('page')
document.head.appendChild(tokens)
document.documentElement.dataset.theme = 'light'
document.documentElement.dataset.sfUi = ''
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'

const shot = new URLSearchParams(location.search).get('shot') || '1'

const SHOTS = {
  1: { title: 'Fill any form in one click', text: 'SmartFill finds the fields and shows you exactly what it will fill. Skip anything, then confirm.', scene: 'preview' },
  2: { title: 'Your details, one click away', text: 'Pick a profile, check how many fields were found, and fill. Undo is always one click.', scene: 'popup' },
  3: { title: 'Profiles for every part of life', text: 'Work, personal, job applications. Edit any profile; changes save automatically.', scene: 'settings' },
  4: { title: 'Private by design', text: 'No account, no server, no tracking. Everything stays in your browser, and passwords and cards are never touched.', scene: 'about' },
}

// A same-origin frame of a dev page, forced to the light theme, with an optional script once loaded.
function Frame({ src, width, height, onReady, className, style }) {
  return (
    <iframe
      title={src}
      src={src}
      width={width}
      height={height}
      className={className}
      style={{ border: 0, display: 'block', ...style }}
      onLoad={(e) => {
        const win = e.currentTarget.contentWindow
        win.document.documentElement.dataset.theme = 'light'
        if (onReady) setTimeout(() => onReady(win), 900)
      }}
    />
  )
}

function BrowserWindow({ url, children, width = 780, height = 600 }) {
  const dot = (c) => <span style={{ width: 12, height: 12, borderRadius: 6, background: c, display: 'inline-block' }} />
  return (
    <div style={{ width, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 80px rgb(30 27 75 / .28), 0 4px 14px rgb(30 27 75 / .12), 0 0 0 1px rgb(0 0 0 / .05)' }}>
      <div style={{ height: 40, background: '#f1f3f4', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid rgb(0 0 0 / .06)' }}>
        {dot('#ff5f57')}{dot('#febc2e')}{dot('#28c840')}
        <span style={{ marginLeft: 16, flex: 1, height: 24, borderRadius: 6, background: '#fff', color: '#5f6368', font: `12px ${FONT}`, display: 'flex', alignItems: 'center', padding: '0 12px' }}>{url}</span>
        <Logo size={18} />
      </div>
      <div style={{ position: 'relative', height }}>{children}</div>
    </div>
  )
}

function Scene({ name }) {
  if (name === 'preview') {
    return (
      <BrowserWindow url="careers.acme.com/apply">
        <Frame
          src="/dev/form.html?reset=1"
          width={780}
          height={600}
          onReady={(win) => win.chrome.runtime.sendMessage({ type: 'AUTOFILL_ACTIVE' })}
        />
      </BrowserWindow>
    )
  }
  if (name === 'popup') {
    return (
      <div style={{ position: 'relative' }}>
        <BrowserWindow url="careers.acme.com/apply">
          <Frame src="/dev/form.html?reset=1" width={780} height={600} />
        </BrowserWindow>
        <div style={{ position: 'absolute', right: 24, top: 46, borderRadius: 12, overflow: 'hidden', boxShadow: '0 18px 50px rgb(30 27 75 / .3), 0 0 0 1px rgb(0 0 0 / .08)' }}>
          <Frame src="/popup.html?reset=1&site=https://careers.acme.com/apply&fields=11" width={340} height={300} />
        </div>
      </div>
    )
  }
  if (name === 'settings' || name === 'about') {
    return (
      // Render at a real desktop width, then scale down to fit the window frame.
      <BrowserWindow url="SmartFill settings" width={800} height={600}>
        <Frame
          src={`/options.html?reset=1${name === 'about' ? '#/about' : ''}`}
          width={1120}
          height={840}
          style={{ transform: `scale(${800 / 1120})`, transformOrigin: 'top left' }}
        />
      </BrowserWindow>
    )
  }
  return null
}

function Screenshot({ title, text, scene }) {
  return (
    <div style={{ width: 1280, height: 800, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 56, padding: '0 64px', boxSizing: 'border-box', background: 'linear-gradient(135deg, #f5f5ff 0%, #e6e5ff 100%)', fontFamily: FONT }}>
      <div style={{ width: 340, flexShrink: 0, color: '#1e1b4b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={34} />
          <span style={{ fontSize: 19, fontWeight: 600 }}>SmartFill</span>
        </div>
        <h1 style={{ margin: '32px 0 0', fontSize: 40, lineHeight: 1.1, fontWeight: 650, letterSpacing: '-0.025em' }}>{title}</h1>
        <p style={{ margin: '20px 0 0', fontSize: 18, lineHeight: 1.55, color: '#4a4870' }}>{text}</p>
      </div>
      <Scene name={scene} />
    </div>
  )
}

function PromoTile() {
  return (
    <div style={{ width: 440, height: 280, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', boxSizing: 'border-box', background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: '#fff', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="44" height="44" viewBox="0 0 32 32" aria-hidden>
          <path d="M9.5 0h13C29 0 32 3 32 9.5v13C32 29 29 32 22.5 32h-13C3 32 0 29 0 22.5v-13C0 3 3 0 9.5 0Z" fill="white" />
          <path d="M9 10.5h14M9 16h10M9 21.5h7" stroke="#4f46e5" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="21.6" cy="21.5" r="2.3" fill="#4f46e5" />
        </svg>
        <span style={{ fontSize: 28, fontWeight: 650, letterSpacing: '-0.02em' }}>SmartFill</span>
      </div>
      <p style={{ margin: '20px 0 0', fontSize: 21, lineHeight: 1.3, fontWeight: 500 }}>Fill any form in one click.</p>
      <p style={{ margin: '4px 0 0', fontSize: 15, color: 'rgb(255 255 255 / .8)' }}>Private. Accurate. Free and open source.</p>
    </div>
  )
}

createRoot(document.getElementById('root')).render(shot === 'tile' ? <PromoTile /> : <Screenshot {...SHOTS[shot]} />)
