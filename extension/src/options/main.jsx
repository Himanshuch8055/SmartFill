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
  const [profile, setProfile] = React.useState({})
  const [status, setStatus] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('profile') // profile | custom
  const [saving, setSaving] = React.useState(false)
  // customFields are stored inside profile.customFields: [{ name, value }]

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' })
        setProfile(res?.profile || {})
      } catch (e) {
        setStatus(`Load error: ${e?.message}`)
      }
    })()
  }, [])

  const onFieldChange = (key, val) => {
    setProfile((p) => ({ ...p, [key]: val }))
  }

  const save = async () => {
    setStatus('Saving...')
    setSaving(true)
    try {
      const res = await chrome.runtime.sendMessage({ type: 'SAVE_PROFILE', profile })
      if (res?.ok) setStatus('Saved!')
      else setStatus(`Save error: ${res?.error || 'unknown'}`)
    } catch (e) {
      setStatus(`Save error: ${e?.message}`)
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-blue-600 text-white grid place-items-center font-semibold shadow">SF</div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">SmartFill</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Autofill profile & custom inputs</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <button onClick={() => setActiveTab('profile')} className={`px-3 py-2 rounded-md border ${activeTab==='profile' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'}`}>Profile</button>
            <button onClick={() => setActiveTab('custom')} className={`px-3 py-2 rounded-md border ${activeTab==='custom' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'}`}>Custom Inputs</button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-semibold mb-4">Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Full Name" name="fullName" placeholder="John Doe" value={profile?.fullName} onChange={onFieldChange} />
                  <Field label="Email" name="email" placeholder="john@example.com" value={profile?.email} onChange={onFieldChange} />
                  <Field label="Phone" name="phone" placeholder="+1 555-1234" value={profile?.phone} onChange={onFieldChange} />
                </div>
                <h2 className="text-base font-semibold mt-6 mb-4">Work</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Company" name="company" placeholder="Acme Inc." value={profile?.company} onChange={onFieldChange} />
                  <Field label="Job Title" name="jobTitle" placeholder="Software Engineer" value={profile?.jobTitle} onChange={onFieldChange} />
                  <Field label="Website" name="website" placeholder="https://example.com" value={profile?.website} onChange={onFieldChange} />
                  <Field label="LinkedIn" name="linkedin" placeholder="https://linkedin.com/in/john" value={profile?.linkedin} onChange={onFieldChange} />
                </div>
                <h2 className="text-base font-semibold mt-6 mb-4">Address</h2>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Custom Inputs</h2>
                <button onClick={addCustom} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">Add Custom Input</button>
              </div>
              <p className="text-sm text-gray-600 mb-4">We match by visible label/title/placeholder on the page. Example name: "Middle Name"</p>
              <div className="space-y-3">
                {(profile.customFields || []).map((cf, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2 items-start">
                    <input
                      type="text"
                      value={cf.name || ''}
                      onChange={(e) => updateCustom(i, 'name', e.target.value)}
                      placeholder="Field name (e.g., Middle Name)"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                      type="text"
                      value={cf.value || ''}
                      onChange={(e) => updateCustom(i, 'value', e.target.value)}
                      placeholder="Value"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <button onClick={() => removeCustom(i)} className="h-10 px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">Remove</button>
                  </div>
                ))}
                {!(profile.customFields || []).length && (
                  <div className="text-sm text-gray-500">No custom inputs yet.</div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Sticky Save Bar */}
      <div className="sticky bottom-0 z-10 border-t bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-sm text-gray-600">{status || 'Make changes and click Save'}</span>
          <button onClick={save} disabled={saving} className={`px-4 py-2 rounded-md text-white ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <Options />
)
