import React from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'
import '../styles.css'

function App() {
  const [status, setStatus] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const autofillNow = async () => {
    setBusy(true)
    setStatus('Autofilling...')
    try {
      const res = await chrome.runtime.sendMessage({ type: 'AUTOFILL_ACTIVE' })
      if (res?.ok) setStatus(`Filled ${res?.filled ?? 0} field(s)`) 
      else setStatus(`Error: ${res?.error || 'unknown'}`)
    } catch (e) {
      setStatus(`Error: ${e?.message}`)
    } finally {
      setBusy(false)
    }
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="w-[22rem] max-w-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-blue-600 text-white grid place-items-center text-sm font-semibold">SF</div>
            <div>
              <h1 className="text-base font-semibold leading-tight">SmartFill</h1>
              <p className="text-[11px] text-gray-500 -mt-0.5">Quickly autofill forms</p>
            </div>
          </div>
          <button onClick={openOptions} className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50">Options</button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {status && (
          <div className={`text-xs px-3 py-2 rounded-md border ${status.startsWith('Error') ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
            {status}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          <button onClick={autofillNow} disabled={busy} className={`btn px-4 py-2 rounded-md text-white text-sm ${busy ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {busy ? 'Autofilling…' : 'Autofill Now'}
          </button>
          <button onClick={openOptions} className="btn px-4 py-2 rounded-md text-sm border border-gray-200 hover:bg-gray-50">
            Open Options
          </button>
        </div>

        <div className="text-[11px] text-gray-500 pt-1">
          Tip: Keep the form page focused for best results.
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
