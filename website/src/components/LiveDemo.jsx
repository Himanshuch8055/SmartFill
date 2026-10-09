import React from 'react'
import Logo from './Logo'

// Interactive demo of SmartFill on a sample form: preview (click a label to skip), fill, undo.
// Mirrors the extension's real on-page UI. Nothing here leaves the page.

const PROFILE = {
  firstName: 'Asha',
  lastName: 'Verma',
  email: 'asha@example.com',
  phone: '+91 98765 43210',
  company: 'Acme Labs',
  linkedin: 'linkedin.com/in/asha',
}

const FIELDS = [
  { id: 'firstName', label: 'First name', tag: 'First Name', half: true },
  { id: 'lastName', label: 'Last name', tag: 'Last Name', half: true },
  { id: 'email', label: 'Email address', tag: 'Email' },
  { id: 'phone', label: 'Mobile number', tag: 'Phone', half: true },
  { id: 'company', label: 'Current company', tag: 'Company', half: true },
  { id: 'linkedin', label: 'LinkedIn profile', tag: 'LinkedIn' },
  { id: 'source', label: 'How did you hear about us?', tag: null }, // not in the profile: left alone
]
const FILLABLE = FIELDS.filter((f) => f.tag)

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export default function LiveDemo() {
  const [stage, setStage] = React.useState('idle') // idle | preview | filling | done
  const [values, setValues] = React.useState({})
  const [skipped, setSkipped] = React.useState(() => new Set())
  const run = React.useRef(0)

  const toFill = FILLABLE.filter((f) => !skipped.has(f.id))

  const reset = () => {
    run.current++
    setStage('idle')
    setValues({})
    setSkipped(new Set())
  }

  const toggleSkip = (id) =>
    setSkipped((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const fill = async () => {
    const id = ++run.current
    setStage('filling')
    if (reducedMotion()) {
      setValues(Object.fromEntries(toFill.map((f) => [f.id, PROFILE[f.id]])))
      setStage('done')
      return
    }
    // Type each value quickly, field by field, like a real fill on a page.
    for (const f of toFill) {
      const text = PROFILE[f.id]
      for (let i = 1; i <= text.length; i += 2) {
        if (run.current !== id) return
        setValues((v) => ({ ...v, [f.id]: text.slice(0, i) }))
        await wait(12)
      }
      setValues((v) => ({ ...v, [f.id]: text }))
      await wait(60)
    }
    if (run.current === id) setStage('done')
  }

  const undo = () => {
    run.current++
    setValues({})
    setStage('idle')
  }

  const previewing = stage === 'preview'

  return (
    <div className="relative">
      {/* Browser window */}
      <div className="rounded-xl overflow-hidden border border-line bg-white shadow-sf-lg">
        <div className="h-10 flex items-center gap-2 px-4 bg-[#f1f3f4] border-b border-black/5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 flex-1 h-6 rounded-md bg-white text-[12px] text-[#5f6368] flex items-center px-3">careers.acme.com/apply</span>
        </div>

        {/* A third-party website, deliberately not in SmartFill's style */}
        <div className="relative bg-[#f6f3ee]" style={{ fontFamily: 'system-ui, sans-serif' }}>
          <div className="h-12 bg-[#1f3a2e] text-white px-5 sm:px-7 flex items-center text-[15px] font-semibold">Acme Careers</div>
          {/* SmartFill preview bar */}
          {previewing && (
            <div className="absolute left-1/2 top-1.5 -translate-x-1/2 z-10 flex items-center gap-2 rounded-xl border border-line bg-surface pl-3.5 pr-2 py-2 shadow-sf-lg whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
              <span className="hidden sm:inline text-[12px] text-fg-muted mr-1">Click a label to skip it</span>
              <button type="button" onClick={() => setStage('idle')} className="h-8 px-3 rounded-lg text-[13px] font-medium text-fg border border-line hover:bg-surface-2">Cancel</button>
              <button type="button" onClick={fill} disabled={!toFill.length} className="h-8 px-3 rounded-lg text-[13px] font-medium bg-accent text-accent-fg hover:bg-accent-hover disabled:opacity-50">
                {skipped.size ? `Fill ${toFill.length} of ${FILLABLE.length}` : `Fill ${FILLABLE.length} fields`}
              </button>
            </div>
          )}

          <div className="m-4 sm:m-6 rounded-md bg-white px-5 py-5 sm:px-7 text-[#222]">
            <p className="text-[18px] font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Senior Frontend Engineer</p>
            <p className="text-[13px] text-[#666] mt-0.5">Pune, India · Full-time</p>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {FIELDS.map((f) => {
                const highlighted = previewing && f.tag
                const isSkipped = skipped.has(f.id)
                return (
                  <label key={f.id} className={`block text-[13px] ${f.half ? '' : 'col-span-2'}`}>
                    {f.label}
                    <span className="relative block mt-1">
                      <input
                        readOnly
                        tabIndex={-1}
                        value={values[f.id] || ''}
                        className="block w-full h-9 px-2.5 rounded-[3px] border border-[#c9c4bb] bg-white text-[14px] text-[#222] outline-none"
                      />
                      {highlighted && (
                        <span
                          className={`absolute -inset-[3px] rounded-[6px] border-2 pointer-events-none ${
                            isSkipped ? 'border-dashed border-fg-subtle' : 'border-accent bg-accent/[0.06]'
                          }`}
                        />
                      )}
                      {highlighted && (
                        <button
                          type="button"
                          onClick={() => toggleSkip(f.id)}
                          title={isSkipped ? 'Click to fill this field' : 'Click to skip this field'}
                          className={`absolute right-1.5 top-1/2 -translate-y-1/2 max-w-[calc(100%-12px)] truncate rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold ${
                            isSkipped ? 'bg-white text-[#888] ring-1 ring-[#ddd] line-through' : 'bg-accent text-accent-fg'
                          }`}
                        >
                          {f.tag} <span className="font-normal opacity-90">{PROFILE[f.id]}</span>
                        </button>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* SmartFill's page button, docked to the edge */}
          <span aria-hidden className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-9 rounded-l-[20px] bg-white shadow-sf-lg ring-1 ring-black/5 grid place-items-center">
            <Logo size={18} />
          </span>
        </div>
      </div>

      {/* Controls under the demo */}
      <div className="mt-5 flex flex-wrap items-center gap-3 min-h-11" aria-live="polite">
        {stage === 'idle' && (
          <>
            <button type="button" onClick={() => setStage('preview')} className="btn btn-primary">Fill with SmartFill</button>
            <span className="text-sm text-fg-subtle">A sample profile is used. Nothing leaves this page.</span>
          </>
        )}
        {previewing && <span className="text-sm text-fg-muted">Each field shows what it will get. Click a label to skip it, then press Fill.</span>}
        {stage === 'filling' && <span className="text-sm text-fg-muted">Filling…</span>}
        {stage === 'done' && (
          <>
            <span className="text-sm text-success font-medium">Filled {toFill.length} field{toFill.length === 1 ? '' : 's'}.</span>
            <button type="button" onClick={undo} className="link text-sm font-medium">Undo</button>
            <span className="text-sm text-fg-subtle">“How did you hear about us?” isn’t in the profile, so it was left alone.</span>
            <button type="button" onClick={reset} className="btn btn-secondary btn-sm ml-auto">Try again</button>
          </>
        )}
      </div>
    </div>
  )
}
