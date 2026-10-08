import React from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import { findFillableInputs, fillFields, snapshot, restore } from '../lib/detectFields'
import { PRIVACY_URL } from '../lib/links'

const QUICK_FIELDS = [
  { name: 'fullName', label: 'Full name', placeholder: 'John Doe', autoComplete: 'name' },
  { name: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone', placeholder: '+1 555-1234', type: 'tel', autoComplete: 'tel' },
  { name: 'city', label: 'City', placeholder: 'San Francisco', autoComplete: 'address-level2' },
]

const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
const card = 'bg-white rounded-2xl border border-gray-200 shadow-sm p-6'

function Step({ n, title, done, children }) {
  return (
    <section className={card}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`h-7 w-7 rounded-full grid place-items-center text-sm font-semibold ${done ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
          {done ? '✓' : n}
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function QuickProfile({ onSaved }) {
  const [data, setData] = React.useState({})
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PROFILE' }).then((res) => setData(res?.profile || {}))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    const patch = Object.fromEntries(QUICK_FIELDS.map((f) => [f.name, data[f.name] || '']))
    await chrome.runtime.sendMessage({ type: 'SAVE_PROFILE', profile: patch })
    setSaved(true)
    onSaved()
  }

  return (
    <Step n={1} title="Add your details" done={saved}>
      <p className="text-sm text-gray-600 mb-4">
        Start with the basics. You can add work, address and job-application details later in settings.
      </p>
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_FIELDS.map((f) => (
          <label key={f.name} className="block">
            <span className="block text-sm font-medium mb-1">{f.label}</span>
            <input
              className={input}
              type={f.type || 'text'}
              placeholder={f.placeholder}
              autoComplete="off"
              value={data[f.name] || ''}
              onChange={(e) => {
                setSaved(false)
                setData((d) => ({ ...d, [f.name]: e.target.value }))
              }}
            />
          </label>
        ))}
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Save</button>
          <button type="button" onClick={() => chrome.runtime.openOptionsPage()} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
            Open full settings
          </button>
          {saved && <span className="text-sm text-green-700">Saved to your profile.</span>}
        </div>
      </form>
    </Step>
  )
}

function PinStep() {
  return (
    <Step n={2} title="Pin SmartFill to your toolbar">
      <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
        <li>Click the puzzle-piece <b>Extensions</b> icon at the top right of your browser.</li>
        <li>Find <b>SmartFill</b> and click the pin icon next to it.</li>
        <li>The SmartFill icon shows how many fillable fields each page has.</li>
      </ol>
      <div className="mt-4 text-sm text-gray-600">
        Shortcuts: <b>Alt+Shift+F</b> fill · <b>Alt+Shift+Z</b> undo · <b>Alt+Shift+P</b> switch profile. You can also right-click any field.
      </div>
    </Step>
  )
}

// Content scripts can't run on extension pages, so the demo fills this form directly with the same engine.
function DemoForm({ version }) {
  const formRef = React.useRef(null)
  const snapRef = React.useRef(null)
  const [msg, setMsg] = React.useState('')

  const fill = async () => {
    const res = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' })
    const map = findFillableInputs(formRef.current)
    snapRef.current = snapshot(map)
    const { filled } = fillFields(map, res?.profile || {})
    setMsg(filled ? `Filled ${filled} fields. Notice first and last name were split from your full name.` : 'Add your details in step 1 first.')
  }
  const undo = () => {
    if (snapRef.current) restore(snapRef.current)
    snapRef.current = null
    setMsg('Restored the form.')
  }

  React.useEffect(() => setMsg(''), [version])

  return (
    <Step n={3} title="Try it on a sample form">
      <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-dashed border-gray-300 rounded-xl p-4">
        <label className="block"><span className="block text-sm mb-1">First name</span><input name="first_name" className={input} /></label>
        <label className="block"><span className="block text-sm mb-1">Last name</span><input name="last_name" className={input} /></label>
        <label className="block"><span className="block text-sm mb-1">Email address</span><input name="email" type="email" className={input} /></label>
        <label className="block"><span className="block text-sm mb-1">Mobile number</span><input name="mobile" className={input} /></label>
        <label className="block sm:col-span-2"><span className="block text-sm mb-1">City</span><input name="city" className={input} /></label>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={fill} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Fill with SmartFill</button>
        <button onClick={undo} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">Undo</button>
        {msg && <span className="text-sm text-gray-700">{msg}</span>}
      </div>
    </Step>
  )
}

function Welcome() {
  const [version, setVersion] = React.useState(0)
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <header className="text-center mb-8">
        <img src="/icons/icon128.png" alt="" className="h-16 w-16 mx-auto mb-4" />
        <h1 className="text-3xl font-bold">Welcome to SmartFill</h1>
        <p className="text-gray-600 mt-2">Fill forms in one click. Three quick steps and you're set.</p>
      </header>
      <QuickProfile onSaved={() => setVersion((v) => v + 1)} />
      <PinStep />
      <DemoForm version={version} />
      <footer className="text-center text-xs text-gray-500 pt-4">
        Your data is stored only in this browser and never sent anywhere. <a className="underline" href={PRIVACY_URL} target="_blank" rel="noreferrer">Privacy policy</a>
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Welcome />
  </React.StrictMode>
)
