// Dev preview hub: every extension screen in one place, with theme and scenario controls.
import React from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import { initTheme, applyTheme, SegmentedControl, Button, Field, Input, Logo } from '../ui'
import { Sun, Moon, Monitor, RotateCcw, Component } from 'lucide-react'

initTheme()

const SCREENS = [
  { id: 'popup', label: 'Popup', src: '/popup.html', width: 360, height: 600 },
  { id: 'options', label: 'Options', src: '/options.html', width: 1180, height: 760 },
  { id: 'welcome', label: 'Welcome', src: '/welcome.html', width: 960, height: 760 },
]

function Hub() {
  const [theme, setTheme] = React.useState('system')
  const [site, setSite] = React.useState('https://www.example.com/signup')
  const [fields, setFields] = React.useState('12')
  const [nonce, setNonce] = React.useState(0)
  const frames = React.useRef({})

  const query = `?site=${encodeURIComponent(site)}&fields=${encodeURIComponent(fields)}`

  // Theme is applied straight to each same-origin frame so all screens switch together.
  const syncTheme = React.useCallback(() => {
    applyTheme(theme)
    Object.values(frames.current).forEach((f) => setFrameTheme(f, theme))
  }, [theme])
  React.useEffect(syncTheme, [syncTheme])

  const reset = () => {
    localStorage.removeItem('sf-dev-storage')
    setNonce((n) => n + 1)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur px-6 py-3 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 mr-4 self-center">
          <Logo size={24} />
          <span className="font-semibold">SmartFill UI preview</span>
        </div>
        <SegmentedControl
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: 'System', icon: Monitor },
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
          ]}
        />
        <Field label="Active tab URL" className="w-72">
          <Input value={site} onChange={(e) => setSite(e.target.value)} />
        </Field>
        <Field label="Fields on page" hint="Number or 'unknown'" className="w-32">
          <Input value={fields} onChange={(e) => setFields(e.target.value)} />
        </Field>
        <div className="flex gap-2 ml-auto">
          <Button icon={RotateCcw} onClick={reset}>Reset sample data</Button>
          <Button icon={Component} onClick={() => window.open('/dev/gallery.html', '_blank')}>UI kit</Button>
        </div>
      </header>

      <main className="p-6 flex flex-wrap gap-8 items-start">
        {SCREENS.map((s) => (
          <section key={s.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg-muted">{s.label}</h2>
              <a className="text-xs text-accent-text hover:underline" href={s.src + query} target="_blank" rel="noreferrer">Open alone ↗</a>
            </div>
            <iframe
              key={s.id + nonce + query}
              ref={(el) => (frames.current[s.id] = el)}
              onLoad={(e) => setFrameTheme(e.currentTarget, theme)}
              title={s.label}
              src={s.src + query}
              width={s.width}
              height={s.height}
              className="rounded-xl border border-line bg-bg shadow-sf-md"
            />
          </section>
        ))}
      </main>
    </div>
  )
}

function setFrameTheme(frame, theme) {
  try {
    const root = frame.contentDocument?.documentElement
    if (!root) return
    if (theme === 'light' || theme === 'dark') root.dataset.theme = theme
    else delete root.dataset.theme
  } catch {}
}

createRoot(document.getElementById('root')).render(<Hub />)
