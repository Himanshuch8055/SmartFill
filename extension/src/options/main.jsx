import React from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'

function Field({ label, name, placeholder, value, onChange }) {
  const [val, setVal] = React.useState(value ?? '')

  // keep local state in sync if parent value changes (e.g., after load)
  React.useEffect(() => {
    setVal(value ?? '')
  }, [value])

  const handleChange = (e) => {
    const next = e.target.value
    setVal(next)
    onChange(name, next)
  }

  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-800 mb-1">{label}</span>
      <input
        type="text"
        value={val}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
      />
    </label>
  )
}

function Options() {
  // active profile data
  const [profile, setProfile] = React.useState({})
  const [profileName, setProfileName] = React.useState('')
  // profiles list state
  const [profiles, setProfiles] = React.useState([])
  const [activeId, setActiveId] = React.useState('')
  // ui state
  const [status, setStatus] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('profile') // profile | custom | settings
  const [saving, setSaving] = React.useState(false)
  const [saveState, setSaveState] = React.useState('idle') // idle | saving | saved | error
  const [toast, setToast] = React.useState({ show: false, text: '', kind: 'info' })
  // which profiles should show in popup
  const [popupProfileIds, setPopupProfileIds] = React.useState([])
  // widget enable/disable
  const [widgetEnabled, setWidgetEnabled] = React.useState(true)
  // filter profiles in sidebar
  const [profileQuery, setProfileQuery] = React.useState('')
  // filter in popup profiles chooser
  const [popupListQuery, setPopupListQuery] = React.useState('')
  // modal state
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [newProfileName, setNewProfileName] = React.useState('New Profile')
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [deleteTargetId, setDeleteTargetId] = React.useState('')
  // responsive state
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false)
  // customFields are stored inside profile.customFields: [{ name, value }]

  const loadAll = React.useCallback(async () => {
    try {
      const listRes = await chrome.runtime.sendMessage({ type: 'GET_PROFILES' })
      if (listRes?.ok) {
        setProfiles(listRes.profiles || [])
        setActiveId(listRes.activeProfileId || '')
        const active = (listRes.profiles || []).find(p => p.id === listRes.activeProfileId) || (listRes.profiles || [])[0]
        if (active) {
          setProfile(active.data || {})
          setProfileName(active.name || 'Profile')
        } else {
          const res = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' })
          setProfile(res?.profile || {})
        }
        // load popup visibility selection
        const { popupProfileIds: savedIds } = await chrome.storage.local.get(['popupProfileIds'])
        if (Array.isArray(savedIds)) setPopupProfileIds(savedIds)
        const { widgetEnabled: w } = await chrome.storage.local.get(['widgetEnabled'])
        setWidgetEnabled(w !== false)
      }
    } catch (e) {
      setStatus(`Load error: ${e?.message}`)
    }
  }, [])

  React.useEffect(() => {
    loadAll()
  }, [loadAll])

  const filteredProfiles = React.useMemo(() => {
    const q = (profileQuery || '').trim().toLowerCase()
    if (!q) return profiles
    return profiles.filter((p) => (p.name || 'Profile').toLowerCase().includes(q))
  }, [profiles, profileQuery])

  const onFieldChange = (key, val) => {
    setProfile((p) => ({ ...p, [key]: val }))
  }

  // Helpers for Profile tab UI
  const countFilled = React.useCallback((keys) => {
    return keys.reduce((n, k) => n + ((profile?.[k] ?? '').toString().trim() ? 1 : 0), 0)
  }, [profile])

  const clearSection = (keys) => {
    setProfile((p) => {
      const next = { ...p }
      keys.forEach((k) => { delete next[k] })
      return next
    })
  }

  const save = async () => {
    setStatus('Saving...')
    setSaving(true)
    setSaveState('saving')
    try {
      const res = await chrome.runtime.sendMessage({ type: 'SAVE_PROFILE', profile })
      if (res?.ok) {
        setStatus('Saved!')
        setSaveState('saved')
        setToast({ show: true, text: 'Profile saved', kind: 'success' })
        setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000)
        setTimeout(() => setSaveState('idle'), 2000)
      } else {
        setStatus(`Save error: ${res?.error || 'unknown'}`)
        setSaveState('error')
        setToast({ show: true, text: 'Save failed', kind: 'error' })
        setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500)
      }
    } catch (e) {
      setStatus(`Save error: ${e?.message}`)
      setSaveState('error')
      setToast({ show: true, text: 'Save failed', kind: 'error' })
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500)
    } finally {
      setSaving(false)
    }
  }

  const addCustom = () => {
    setProfile((p) => ({ ...p, customFields: [...(p.customFields || []), { name: '', value: '' }] }))
  }

  const updateCustom = (idx, key, val) => {
    setProfile((p) => {
      const list = [...(p.customFields || [])]
      list[idx] = { ...list[idx], [key]: val }
      return { ...p, customFields: list }
    })
  }

  const removeCustom = (idx) => {
    setProfile((p) => {
      const list = [...(p.customFields || [])]
      list.splice(idx, 1)
      return { ...p, customFields: list }
    })
  }

  const moveCustom = (from, to) => {
    setProfile((p) => {
      const list = [...(p.customFields || [])]
      if (from < 0 || from >= list.length || to < 0 || to >= list.length) return p
      const [item] = list.splice(from, 1)
      list.splice(to, 0, item)
      return { ...p, customFields: list }
    })
  }

  const duplicateCustom = (idx) => {
    setProfile((p) => {
      const list = [...(p.customFields || [])]
      const item = list[idx] || { name: '', value: '' }
      list.splice(idx + 1, 0, { ...item })
      return { ...p, customFields: list }
    })
  }

  const clearAllCustom = () => {
    setProfile((p) => ({ ...p, customFields: [] }))
  }

  const removeEmptyCustom = () => {
    setProfile((p) => ({
      ...p,
      customFields: (p.customFields || []).filter((x) => (x.name || '').trim() || (x.value || '').trim())
    }))
  }

  const onCustomKeyDown = (e, idx) => {
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      moveCustom(idx, e.key === 'ArrowUp' ? idx - 1 : idx + 1)
    }
  }

  // Global keyboard shortcuts: Save (Cmd/Ctrl+S) and Escape to close UI overlays
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 's' || e.key === 'S') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (!saving) save()
      }
      if (e.key === 'Escape') {
        setShowCreateModal(false)
        setShowDeleteModal(false)
        setShowMobileSidebar(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saving, profile])

  // Profiles toolbar actions
  const onSelectProfile = async (id) => {
    setStatus('Switching profile...')
    await chrome.runtime.sendMessage({ type: 'SET_ACTIVE_PROFILE', id })
    await loadAll()
    setStatus('')
    const p = profiles.find(x => x.id === id)
    setToast({ show: true, text: `Switched to ${p?.name || 'profile'}`, kind: 'info' })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 1500)
  }

  const onCreateProfile = () => {
    setNewProfileName('New Profile')
    setShowCreateModal(true)
  }

  const confirmCreateProfile = async () => {
    const name = (newProfileName || 'New Profile').trim() || 'New Profile'
    const res = await chrome.runtime.sendMessage({ type: 'CREATE_PROFILE', name, data: profile })
    if (res?.ok) {
      await loadAll()
      setToast({ show: true, text: 'Profile created', kind: 'success' })
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 1500)
    } else {
      setToast({ show: true, text: 'Create failed', kind: 'error' })
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000)
    }
    setShowCreateModal(false)
  }

  const onDuplicateProfile = async (idArg) => {
    const id = idArg || activeId
    if (!id) return
    const res = await chrome.runtime.sendMessage({ type: 'DUPLICATE_PROFILE', id })
    if (res?.ok) {
      await loadAll()
      setToast({ show: true, text: 'Profile duplicated', kind: 'success' })
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 1500)
    } else {
      setToast({ show: true, text: 'Duplicate failed', kind: 'error' })
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000)
    }
  }

  const onDeleteProfile = (idArg) => {
    const id = idArg || activeId
    if (!id) return
    setDeleteTargetId(id)
    setShowDeleteModal(true)
  }

  const confirmDeleteProfile = async () => {
    if (!deleteTargetId) return
    const res = await chrome.runtime.sendMessage({ type: 'DELETE_PROFILE', id: deleteTargetId })
    if (res?.ok) {
      await loadAll()
      setToast({ show: true, text: 'Profile deleted', kind: 'success' })
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 1500)
    } else {
      setToast({ show: true, text: 'Delete failed', kind: 'error' })
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000)
    }
    setShowDeleteModal(false)
    setDeleteTargetId('')
  }

  const onRenameBlur = async () => {
    if (!activeId) return
    const next = (profileName || '').trim() || 'Profile'
    const active = profiles.find(p => p.id === activeId)
    if (active && active.name === next) return
    await chrome.runtime.sendMessage({ type: 'RENAME_PROFILE', id: activeId, name: next })
    setProfileName(next)
    await loadAll()
    setToast({ show: true, text: 'Profile renamed', kind: 'success' })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 1200)
  }

  // Import/Export
  const onExport = async () => {
    const res = await chrome.runtime.sendMessage({ type: 'EXPORT_PROFILES' })
    if (!res?.ok) return
    const blob = new Blob([JSON.stringify(res.payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'smartfill-profiles.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setToast({ show: true, text: 'Exported profiles', kind: 'success' })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 1200)
  }

  const onImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const payload = JSON.parse(text)
        const res = await chrome.runtime.sendMessage({ type: 'IMPORT_PROFILES', payload })
        if (res?.ok) {
          await loadAll()
          setToast({ show: true, text: 'Imported profiles', kind: 'success' })
          setTimeout(() => setToast((t) => ({ ...t, show: false })), 1500)
        } else {
          setToast({ show: true, text: 'Import failed', kind: 'error' })
          setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000)
        }
      } catch (err) {
        setToast({ show: true, text: 'Invalid JSON file', kind: 'error' })
        setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000)
      }
    }
    input.click()
  }

  // Drag & drop import support (Settings tab)
  const onDropImport = async (e) => {
    e.preventDefault()
    try {
      const file = e.dataTransfer?.files?.[0]
      if (!file) return
      const text = await file.text()
      const payload = JSON.parse(text)
      const res = await chrome.runtime.sendMessage({ type: 'IMPORT_PROFILES', payload })
      if (res?.ok) {
        await loadAll()
        setToast({ show: true, text: 'Imported profiles', kind: 'success' })
        setTimeout(() => setToast((t) => ({ ...t, show: false })), 1500)
      } else {
        setToast({ show: true, text: 'Import failed', kind: 'error' })
        setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000)
      }
    } catch (err) {
      setToast({ show: true, text: 'Invalid JSON file', kind: 'error' })
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000)
    }
  }

  const onDragOverImport = (e) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-[auto,1fr,auto] items-center">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile sidebar toggle */}
            <button
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-300 hover:bg-gray-50"
              aria-label="Toggle profiles sidebar"
              onClick={() => setShowMobileSidebar(true)}
            >
              <span className="sr-only">Open sidebar</span>
              ☰
            </button>
            <img src="/icons/icon512.png" alt="SmartFill" className="h-8 w-8" />
            {/* <div className="w-10 h-10 rounded-md bg-blue-600 grid place-items-center" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">
                <path fill="#ffffff" d="M13.5 2.5l-8 10.2c-.2.3 0 .8.4.8h6.2l-1.2 7.4c-.1.6.7.9 1.1.4l8-10.2c.2-.3 0-.8-.4-.8h-6.2l1.2-7.4c.1-.6-.7-.9-1.1-.4z"/>
              </svg>
            </div> */}
            <span className="text-sm font-semibold text-gray-800 shrink-0">SmartFill</span>
            <span className="text-gray-300">/</span>
            <input
              type="text"
              value={profileName}
              onChange={(e)=> setProfileName(e.target.value)}
              onBlur={onRenameBlur}
              placeholder="Profile name"
              className="rounded-md border border-gray-300 px-2 py-1 text-sm max-w-xs"
            />
            {/* Header tabs moved to center */}
          </div>
          {/* Centered tabs */}
          <nav className="hidden sm:flex items-center justify-center gap-1" role="tablist" aria-label="Sections">
            <button role="tab" aria-selected={activeTab==='profile'} onClick={() => setActiveTab('profile')} className={`px-2 py-1 rounded-md text-sm border ${activeTab==='profile' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'}`}>Profile</button>
            <button role="tab" aria-selected={activeTab==='custom'} onClick={() => setActiveTab('custom')} className={`px-2 py-1 rounded-md text-sm border ${activeTab==='custom' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'}`}>Custom</button>
            <button role="tab" aria-selected={activeTab==='settings'} onClick={() => setActiveTab('settings')} className={`px-2 py-1 rounded-md text-sm border ${activeTab==='settings' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'}`}>Settings</button>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className={`px-3 py-2 rounded-md text-white ${
                saving
                  ? 'bg-blue-400 cursor-not-allowed'
                  : saveState === 'saved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : saveState === 'error'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              aria-live="polite"
              aria-label="Save profile"
            >
              {saving ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Retry Save' : 'Save'}
            </button>
            <button onClick={onExport} className="hidden sm:inline-flex px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" aria-label="Export profiles">Export JSON</button>
            <button onClick={onImport} className="hidden sm:inline-flex px-3 py-2 rounded-md text-white bg-gray-800 hover:bg-gray-900" aria-label="Import profiles">Import JSON</button>
          </div>
        </div>
      </header>

      {/* Body with Sidebar + Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 border-r bg-gray-50 flex-col">
          <div className="p-3 flex items-center justify-between border-b bg-white">
            <span className="text-sm font-semibold">Profiles</span>
            <button onClick={onCreateProfile} className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm" aria-label="Create new profile">New</button>
          </div>
          <div className="p-3 border-b bg-gray-50">
            <label className="block text-xs text-gray-600 mb-1" htmlFor="profileSearch">Search</label>
            <input id="profileSearch" type="text" value={profileQuery} onChange={(e)=> setProfileQuery(e.target.value)} placeholder="Search profiles" className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </div>
          <ul className="flex-1 overflow-auto" role="list" aria-label="Profiles">
            {filteredProfiles.length === 0 && (
              <li className="px-3 py-3 text-sm text-gray-500">No profiles yet. Click New to create one.</li>
            )}
            {filteredProfiles.map((p) => (
              <li key={p.id} className="group">
                <div className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${p.id===activeId ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                  onClick={()=> onSelectProfile(p.id)}
                  >
                  <div className={`h-2 w-2 rounded-full ${p.id===activeId ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  <span className="text-sm truncate flex-1">{p.name || 'Profile'}</span>
                  <div className="flex items-center gap-1">
                    <button aria-label={`Duplicate ${p.name || 'profile'}`} title="Duplicate" onClick={(e)=> { e.stopPropagation(); onDuplicateProfile(p.id) }} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-gray-700">
                        <rect x="9" y="9" width="10" height="10" rx="2"/>
                        <rect x="5" y="5" width="10" height="10" rx="2"/>
                      </svg>
                    </button>
                    <button aria-label={`Delete ${p.name || 'profile'}`} title="Delete" onClick={(e)=> { e.stopPropagation(); onDeleteProfile(p.id) }} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M3 6h18"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {showMobileSidebar && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div className="w-64 bg-white border-r h-full flex flex-col">
              <div className="p-3 flex items-center justify-between border-b bg-white">
                <span className="text-sm font-semibold">Profiles</span>
                <button onClick={() => setShowMobileSidebar(false)} className="h-8 w-8 rounded-md border border-gray-300 hover:bg-gray-50" aria-label="Close sidebar">×</button>
              </div>
              <div className="p-3">
                <button onClick={onCreateProfile} className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm" aria-label="Create new profile">New Profile</button>
              </div>
              <div className="px-3 pb-2">
                <input type="text" value={profileQuery} onChange={(e)=> setProfileQuery(e.target.value)} placeholder="Search profiles" className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </div>
              <ul className="flex-1 overflow-auto" role="list" aria-label="Profiles">
                {filteredProfiles.length === 0 && (
                  <li className="px-3 py-3 text-sm text-gray-500">No profiles yet.</li>
                )}
                {filteredProfiles.map((p) => (
                  <li key={p.id} className="group">
                    <div className={`flex items-center gap-2 px-3 py-2 ${p.id===activeId ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                      onClick={()=> { onSelectProfile(p.id); setShowMobileSidebar(false) }}
                    >
                      <div className={`h-2 w-2 rounded-full ${p.id===activeId ? 'bg-blue-600' : 'bg-gray-300'}`} />
                      <span className="text-sm truncate flex-1">{p.name || 'Profile'}</span>
                      <div className="flex items-center gap-1">
                        <button aria-label={`Duplicate ${p.name || 'profile'}`} onClick={(e)=> { e.stopPropagation(); onDuplicateProfile(p.id) }} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-gray-700">
                            <rect x="9" y="9" width="10" height="10" rx="2"/>
                            <rect x="5" y="5" width="10" height="10" rx="2"/>
                          </svg>
                        </button>
                        <button aria-label={`Delete ${p.name || 'profile'}`} onClick={(e)=> { e.stopPropagation(); onDeleteProfile(p.id) }} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                            <path d="M3 6h18"/>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setShowMobileSidebar(false)} />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-semibold">Profile</h2>
                {/* Contact */}
                <div className="flex items-center justify-between mt-2 mb-3">
                  <h3 className="text-sm font-semibold">Contact</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>{countFilled(['fullName','email','phone'])}/3 filled</span>
                    <button onClick={() => clearSection(['fullName','email','phone'])} className="px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Full Name" name="fullName" placeholder="John Doe" value={profile?.fullName} onChange={onFieldChange} />
                  <Field label="Email" name="email" placeholder="john@example.com" value={profile?.email} onChange={onFieldChange} />
                  <Field label="Phone" name="phone" placeholder="+1 555-1234" value={profile?.phone} onChange={onFieldChange} />
                </div>
                {/* Work */}
                <div className="flex items-center justify-between mt-6 mb-3">
                  <h3 className="text-sm font-semibold">Work</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>{countFilled(['company','jobTitle','website','linkedin'])}/4 filled</span>
                    <button onClick={() => clearSection(['company','jobTitle','website','linkedin'])} className="px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Company" name="company" placeholder="Acme Inc." value={profile?.company} onChange={onFieldChange} />
                  <Field label="Job Title" name="jobTitle" placeholder="Software Engineer" value={profile?.jobTitle} onChange={onFieldChange} />
                  <Field label="Website" name="website" placeholder="https://example.com" value={profile?.website} onChange={onFieldChange} />
                  <Field label="LinkedIn" name="linkedin" placeholder="https://linkedin.com/in/john" value={profile?.linkedin} onChange={onFieldChange} />
                </div>
                {/* Address */}
                <div className="flex items-center justify-between mt-6 mb-3">
                  <h3 className="text-sm font-semibold">Address</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>{countFilled(['address1','address2','city','state','zip','country'])}/6 filled</span>
                    <button onClick={() => clearSection(['address1','address2','city','state','zip','country'])} className="px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Address Line 1" name="address1" placeholder="123 Main St" value={profile?.address1} onChange={onFieldChange} />
                  <Field label="Address Line 2" name="address2" placeholder="Apt 4B" value={profile?.address2} onChange={onFieldChange} />
                  <Field label="City" name="city" placeholder="San Francisco" value={profile?.city} onChange={onFieldChange} />
                  <Field label="State/Province" name="state" placeholder="CA" value={profile?.state} onChange={onFieldChange} />
                  <Field label="ZIP/Postal" name="zip" placeholder="94105" value={profile?.zip} onChange={onFieldChange} />
                  <Field label="Country" name="country" placeholder="USA" value={profile?.country} onChange={onFieldChange} />
                </div>
              </section>

              <aside className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-base font-semibold">Tips</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5">
                    <li>Use realistic info to improve matching.</li>
                    <li>Keep the page focused when using Autofill.</li>
                    <li>You can add extra fields under Custom Inputs.</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
                  <h3 className="text-base font-semibold text-blue-900">Need a new field?</h3>
                  <p className="text-sm text-blue-900/80 mt-1">Add it by label name and we’ll try to find and fill it automatically.</p>
                  <button onClick={() => setActiveTab('custom')} className="mt-3 inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">Go to Custom Inputs</button>
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'custom' && (
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold">Custom Inputs</h2>
                  <p className="text-sm text-gray-600">Match by visible label/title/placeholder. Example: Middle Name</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={removeEmptyCustom} className="hidden sm:inline-flex px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">Remove empty</button>
                  <button onClick={clearAllCustom} className="hidden sm:inline-flex px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-sm">Clear all</button>
                  <button onClick={addCustom} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">Add Custom Input</button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{profile.customFields?.length || 0} item(s)</span>
                <span>Tip: Use Alt+↑/↓ to reorder</span>
              </div>
              <div className="space-y-3">
                {(profile.customFields || []).map((cf, i) => {
                  const nameEmpty = !(cf.name || '').trim()
                  return (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto,auto,auto] gap-2 items-start">
                      <input
                        type="text"
                        value={cf.name || ''}
                        onChange={(e) => updateCustom(i, 'name', e.target.value)}
                        onKeyDown={(e) => onCustomKeyDown(e, i)}
                        placeholder="Field name (e.g., Middle Name)"
                        aria-invalid={nameEmpty}
                        className={`w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100 border ${nameEmpty ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                      />
                      <input
                        type="text"
                        value={cf.value || ''}
                        onChange={(e) => updateCustom(i, 'value', e.target.value)}
                        onKeyDown={(e) => onCustomKeyDown(e, i)}
                        placeholder="Value"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => moveCustom(i, i-1)} disabled={i===0} title="Move up" className={`h-10 px-3 rounded-lg border text-sm ${i===0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>↑</button>
                        <button onClick={() => moveCustom(i, i+1)} disabled={i===(profile.customFields?.length-1)} title="Move down" className={`h-10 px-3 rounded-lg border text-sm ${i===(profile.customFields?.length-1) ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>↓</button>
                      </div>
                      <button onClick={() => duplicateCustom(i)} className="h-10 px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm" title="Duplicate">Duplicate</button>
                      <button onClick={() => removeCustom(i)} className="h-10 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm">Remove</button>
                    </div>
                  )
                })}
                {!(profile.customFields || []).length && (
                  <div className="text-sm text-gray-500">No custom inputs yet. Click "Add Custom Input" to create one.</div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="space-y-6">
              {/* Popup Profiles first */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Popup Profiles</h2>
                  <div className="text-xs text-gray-500">{popupProfileIds?.length || 0}/{profiles.length} selected</div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Choose which profiles appear in the popup quick selector.</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={popupListQuery}
                    onChange={(e)=> setPopupListQuery(e.target.value)}
                    placeholder="Search profiles"
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    aria-label="Search popup profiles"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="px-2 py-1 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
                      onClick={async () => {
                        const all = profiles.map(p => p.id)
                        setPopupProfileIds(all)
                        await chrome.storage.local.set({ popupProfileIds: all })
                        setToast({ show: true, text: 'All profiles selected', kind: 'info' })
                        setTimeout(() => setToast((t) => ({ ...t, show: false })), 1000)
                      }}
                    >Select all</button>
                    <button
                      className="px-2 py-1 rounded-md border border-gray-300 text-xs hover:bg-gray-50"
                      onClick={async () => {
                        setPopupProfileIds([])
                        await chrome.storage.local.set({ popupProfileIds: [] })
                        setToast({ show: true, text: 'Selection cleared', kind: 'info' })
                        setTimeout(() => setToast((t) => ({ ...t, show: false })), 1000)
                      }}
                    >Clear</button>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {profiles.length === 0 && (
                    <div className="text-sm text-gray-500">No profiles yet.</div>
                  )}
                  {profiles
                    .filter((p) => (popupListQuery ? (p.name || 'Profile').toLowerCase().includes(popupListQuery.toLowerCase()) : true))
                    .map((p) => {
                      const checked = popupProfileIds?.includes(p.id)
                      return (
                        <label key={p.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!checked}
                            onChange={async (e) => {
                              const next = e.target.checked
                                ? Array.from(new Set([...(popupProfileIds || []), p.id]))
                                : (popupProfileIds || []).filter(x => x !== p.id)
                              setPopupProfileIds(next)
                              await chrome.storage.local.set({ popupProfileIds: next })
                              setToast({ show: true, text: 'Popup profiles updated', kind: 'info' })
                              setTimeout(() => setToast((t) => ({ ...t, show: false })), 1000)
                            }}
                          />
                          <span className="truncate">{p.name || 'Profile'}</span>
                        </label>
                      )
                    })}
                </div>
                <div className="text-[11px] text-gray-500 mt-2">If none are selected, all profiles will be shown.</div>
              </div>

              {/* Widget second */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-semibold">Widget</h2>
                <label className="mt-2 flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4"
                    checked={!!widgetEnabled}
                    onChange={async (e) => {
                      const val = !!e.target.checked
                      setWidgetEnabled(val)
                      await chrome.storage.local.set({ widgetEnabled: val })
                      setToast({ show: true, text: `Widget ${val ? 'enabled' : 'disabled'}` , kind: 'info' })
                      setTimeout(() => setToast((t) => ({ ...t, show: false })), 1200)
                    }}
                  />
                  <div>
                    <div className="font-medium">Enable SmartFill floating widget on pages</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">Toggles the on-page button to quickly autofill forms. Changes take effect immediately on open pages.</div>
                  </div>
                </label>
              </div>

              {/* Data management third (no drag & drop) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-semibold">Data management</h2>
                <p className="text-sm text-gray-600 mt-1">Export a backup of your profiles or import from a JSON file.</p>
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={onExport} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" aria-label="Export profiles">Export JSON</button>
                  <button onClick={onImport} className="px-3 py-2 rounded-md text-white bg-gray-800 hover:bg-gray-900" aria-label="Import profiles">Import JSON</button>
                </div>
              </div>

              {/* Reset last */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-semibold">Reset</h2>
                <p className="text-sm text-gray-600 mt-1">Reset non-destructive settings (widget toggle and popup selection). Your profiles remain intact.</p>
                <button
                  className="mt-3 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                  onClick={async () => {
                    setWidgetEnabled(true)
                    setPopupProfileIds([])
                    await chrome.storage.local.set({ widgetEnabled: true, popupProfileIds: [] })
                    setToast({ show: true, text: 'Settings reset', kind: 'success' })
                    setTimeout(() => setToast((t) => ({ ...t, show: false })), 1200)
                  }}
                >Reset settings</button>
              </div>
            </section>
          )}
        </main>

      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-16 right-6 z-20 px-4 py-2 rounded-md shadow-lg text-white ${
          toast.kind === 'success' ? 'bg-green-600' : toast.kind === 'error' ? 'bg-red-600' : 'bg-gray-800'
        }`}
          role="status" aria-live="polite">
          {toast.text}
        </div>
      )}

      {/* Create Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="createProfileTitle">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <h3 id="createProfileTitle" className="text-lg font-semibold mb-3">Create new profile</h3>
            <label className="block text-sm text-gray-700 mb-2">Profile name</label>
            <input
              autoFocus
              type="text"
              value={newProfileName}
              onChange={(e)=> setNewProfileName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="New Profile"
              onKeyDown={(e)=> { if (e.key==='Enter') confirmCreateProfile(); if (e.key==='Escape') setShowCreateModal(false) }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded-md border border-gray-300" onClick={()=> setShowCreateModal(false)}>Cancel</button>
              <button className="px-3 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700" onClick={confirmCreateProfile}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Profile Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="deleteProfileTitle">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <h3 id="deleteProfileTitle" className="text-lg font-semibold mb-2">Delete profile</h3>
            <p className="text-sm text-gray-700">Are you sure you want to delete <span className="font-medium">{profileName || 'this profile'}</span>? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded-md border border-gray-300" onClick={()=> setShowDeleteModal(false)}>Cancel</button>
              <button className="px-3 py-2 rounded-md text-white bg-red-600 hover:bg-red-700" onClick={confirmDeleteProfile}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <Options />
)
