import React from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'
import '../styles.css'
import { reviewUrl } from '../lib/links'

const RATING_PROMPT_AFTER = 20

// One-time "rate us" banner after the user has had real value from the extension.
function RatingPrompt() {
  const [show, setShow] = React.useState(false)
  React.useEffect(() => {
    chrome.storage.local.get(['fillCount', 'ratingPromptDone']).then(({ fillCount = 0, ratingPromptDone }) => {
      setShow(!ratingPromptDone && fillCount >= RATING_PROMPT_AFTER)
    })
  }, [])
  if (!show) return null
  const done = (rate) => {
    chrome.storage.local.set({ ratingPromptDone: true })
    setShow(false)
    if (rate) chrome.tabs.create({ url: reviewUrl() })
  }
  return (
    <div className="text-xs rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
      <div className="text-blue-900">Enjoying SmartFill? A quick rating helps others find it.</div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => done(true)} className="px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">Rate SmartFill</button>
        <button onClick={() => done(false)} className="px-2.5 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">No thanks</button>
      </div>
    </div>
  )
}

function App() {
  const [status, setStatus] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [profiles, setProfiles] = React.useState([])
  const [activeId, setActiveId] = React.useState('')
  const [loadingProfiles, setLoadingProfiles] = React.useState(true)
  const [popupProfileIds, setPopupProfileIds] = React.useState([])
  const [widgetEnabled, setWidgetEnabled] = React.useState(true)
  // Per-site state for the current tab
  const [host, setHost] = React.useState('')
  const [siteBlocked, setSiteBlocked] = React.useState(false)
  const [siteProfileId, setSiteProfileId] = React.useState('')

  React.useEffect(() => {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const h = /^https?:/.test(tab?.url || '') ? new URL(tab.url).host : ''
        setHost(h)
        if (!h) return
        const res = await chrome.runtime.sendMessage({ type: 'GET_SITE_STATE', host: h })
        if (res?.ok) {
          setSiteBlocked(!!res.blocked)
          setSiteProfileId(res.siteProfileId || '')
        }
      } catch {}
    })()
  }, [])

  const toggleSiteBlocked = async (blocked) => {
    setSiteBlocked(blocked)
    await chrome.runtime.sendMessage({ type: 'SET_SITE_BLOCKED', host, blocked })
    setStatus(blocked ? `SmartFill turned off on ${host}` : `SmartFill turned on for ${host}`)
  }

  const toggleSiteProfile = async (pin) => {
    const id = pin ? activeId : ''
    setSiteProfileId(id)
    await chrome.runtime.sendMessage({ type: 'SET_SITE_PROFILE', host, profileId: id })
    const name = profiles.find((p) => p.id === activeId)?.name || 'this profile'
    setStatus(pin ? `${name} will always be used on ${host}` : `${host} uses the active profile`)
  }

  const autofillNow = async () => {
    setBusy(true)
    setStatus('Autofilling...')
    try {
      const res = await chrome.runtime.sendMessage({ type: 'AUTOFILL_ACTIVE' })
      if (res?.ok && res.preview) {
        // Preview is shown on the page; close so the page gets focus (Enter / Esc work there)
        setStatus(`Review ${res.count} field(s) on the page`)
        setTimeout(() => window.close(), 400)
      } else if (res?.ok) setStatus(`Filled ${res?.filled ?? 0} field(s)`)
      else setStatus(`Error: ${res?.error || 'unknown'}`)
    } catch (e) {
      setStatus(`Error: ${e?.message}`)
    } finally {
      setBusy(false)
    }
  }

  const undoNow = async () => {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'UNDO_ACTIVE' })
      if (res?.ok) setStatus(res.restored ? `Restored ${res.restored} field(s)` : 'Nothing to undo')
      else setStatus(`Error: ${res?.error || 'unknown'}`)
    } catch (e) {
      setStatus(`Error: ${e?.message}`)
    }
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  // Keyboard shortcuts: Enter to Autofill, Escape to close popup
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (!busy) autofillNow()
      }
      if (e.key === 'Escape') {
        window.close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy])

  // Load profiles for quick switcher
  React.useEffect(() => {
    (async () => {
      try {
        setLoadingProfiles(true)
        const res = await chrome.runtime.sendMessage({ type: 'GET_PROFILES' })
        if (res?.ok) {
          setProfiles(res.profiles || [])
          setActiveId(res.activeProfileId || '')
          const { popupProfileIds: savedIds } = await chrome.storage.local.get(['popupProfileIds'])
          if (Array.isArray(savedIds)) setPopupProfileIds(savedIds)
          const { widgetEnabled: w } = await chrome.storage.local.get(['widgetEnabled'])
          setWidgetEnabled(w !== false)
        }
      } finally {
        setLoadingProfiles(false)
      }
    })()
  }, [])

  const onSwitchProfile = async (id) => {
    if (!id) return
    try {
      await chrome.runtime.sendMessage({ type: 'SET_ACTIVE_PROFILE', id })
      setActiveId(id)
      const p = (profiles || []).find(x => x.id === id)
      setStatus(`Active: ${p?.name || 'Profile'}`)
      // Give subtle confirmation, then clear after a moment
      setTimeout(() => setStatus(''), 1500)
    } catch (e) {
      setStatus(`Error switching: ${e?.message}`)
    }
  }

  return (
    <div className="w-[22rem] max-w-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md bg-blue-600 grid place-items-center" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">
                <path fill="#ffffff" d="M13.5 2.5l-8 10.2c-.2.3 0 .8.4.8h6.2l-1.2 7.4c-.1.6.7.9 1.1.4l8-10.2c.2-.3 0-.8-.4-.8h-6.2l1.2-7.4c.1-.6-.7-.9-1.1-.4z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">SmartFill</h1>
              <p className="text-[11px] text-gray-500 -mt-0.5">Quickly autofill forms</p>
            </div>
          </div>
          <button onClick={openOptions} className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1" aria-label="Open options">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.08a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.08a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.08a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.25 1 1.51H21a2 2 0 1 1 0 4h-.08a1.65 1.65 0 0 0-1.51 1Z"/>
            </svg>
            <span>Options</span>
          </button>
        </div>

        {/* Quick Profile Switcher */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <div className="block text-[11px] text-gray-600">Active profile</div>
            {loadingProfiles && <div className="text-[11px] text-gray-400">Loading…</div>}
          </div>
          <div className="max-h-48 overflow-y-auto pr-1 custom-scroll">
            <div role="radiogroup" aria-label="Profiles" className="grid grid-cols-2 gap-2">
              {(() => {
                const list = (Array.isArray(popupProfileIds) && popupProfileIds.length)
                  ? (profiles || []).filter(p => popupProfileIds.includes(p.id))
                  : (profiles || [])
                if (list.length === 0) {
                  return (
                    <div className="col-span-2 text-[11px] text-gray-500">{loadingProfiles ? 'Loading profiles…' : 'No profiles found'}</div>
                  )
                }
                return list.map(p => {
                  const isActive = p.id === activeId
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => onSwitchProfile(p.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-md border text-xs inline-flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
                        ${isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
                    >
                      <span className={`inline-grid place-items-center rounded-md ${isActive ? 'bg-blue-600' : 'bg-gray-200'} w-5 h-5`} aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10">
                          <path fill={isActive ? '#ffffff' : '#111827'} d="M13.5 2.5l-8 10.2c-.2.3 0 .8.4.8h6.2l-1.2 7.4c-.1.6.7.9 1.1.4l8-10.2c.2-.3 0-.8-.4-.8h-6.2l1.2-7.4c.1-.6-.7-.9-1.1-.4z"/>
                        </svg>
                      </span>
                      <span className="truncate">{p.name || 'Profile'}</span>
                    </button>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <RatingPrompt />

        <div className="grid grid-cols-[1fr,auto] gap-2">
          <button onClick={autofillNow} disabled={busy} className={`btn px-4 py-2 rounded-md text-white text-sm inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${busy ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} aria-label="Autofill now">
            {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M6 12h12"/>
              <path d="M12 6v12"/>
            </svg> */}
            {busy ? 'Autofilling…' : 'Autofill Now'}
          </button>
          <button onClick={undoNow} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50" aria-label="Undo last fill" title="Undo last fill (Alt+Shift+Z)">
            Undo
          </button>
        </div>

        {/* This site */}
        {host && (
          <div className="pt-2 border-t space-y-2 text-xs">
            <div className="font-medium text-gray-700 truncate" title={host}>On {host}</div>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-3.5 w-3.5" checked={siteBlocked} onChange={(e) => toggleSiteBlocked(e.target.checked)} />
              <span>Turn off SmartFill on this site</span>
            </label>
            {!siteBlocked && profiles.length > 1 && (
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={!!siteProfileId}
                  onChange={(e) => toggleSiteProfile(e.target.checked)}
                />
                <span className="truncate">
                  {siteProfileId
                    ? `Always use "${profiles.find((p) => p.id === siteProfileId)?.name || 'Profile'}" here`
                    : `Always use "${profiles.find((p) => p.id === activeId)?.name || 'Profile'}" here`}
                </span>
              </label>
            )}
          </div>
        )}

        {/* Widget toggle */}
        <div className="mt-1 pt-2 border-t">
          <label className="flex items-center gap-3 text-xs">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={!!widgetEnabled}
              onChange={async (e) => {
                const val = !!e.target.checked
                setWidgetEnabled(val)
                await chrome.storage.local.set({ widgetEnabled: val })
                setStatus(`Widget ${val ? 'enabled' : 'disabled'}`)
                setTimeout(() => setStatus(''), 1200)
              }}
            />
            <span>Enable SmartFill widget</span>
          </label>
        </div>

        <div className="text-[11px] text-gray-500 pt-1">
          Shortcuts: <b>Alt+Shift+F</b> fill · <b>Alt+Shift+Z</b> undo · <b>Alt+Shift+P</b> next profile. Right-click any field to fill it.
        </div>
        
        {status && (
          <div className={`text-xs px-3 py-2 mx-0 rounded-md border ${status.startsWith('Error') ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`} role="status" aria-live="polite">
            {status}
          </div>
        )}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
