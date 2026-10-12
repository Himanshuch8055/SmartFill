import React from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import { Check, Puzzle, Pin } from 'lucide-react'
import { initTheme, Button, Field, Input, Kbd, Logo, cn } from '../ui'
import { findFillableInputs, fillFields, snapshot, restore, deriveProfile } from '../lib/detectFields'
import { PROFILE_FIELDS } from '../lib/profileFields'
import { showPreview } from '../content/preview'
import { PRIVACY_URL } from '../lib/links'
import { t, tn, mark, initLanguage } from '../lib/i18n'

initTheme()

const send = (msg) => chrome.runtime.sendMessage(msg)
const isFirefox = /firefox/i.test(navigator.userAgent)
const LABELS = Object.fromEntries(PROFILE_FIELDS.map((f) => [f.name, f.label]))

const DETAILS = [
  { name: 'fullName', label: mark('Full name'), placeholder: 'Asha Verma', autoComplete: 'name' },
  { name: 'email', label: mark('Email'), placeholder: 'asha@example.com', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: mark('Phone'), placeholder: '+91 98765 43210', type: 'tel', autoComplete: 'tel' },
  { name: 'city', label: mark('City'), placeholder: 'Pune', autoComplete: 'address-level2' },
]

// ---------- step shell ----------

function Step({ index, title, summary, state, onEdit, children }) {
  const done = state === 'done'
  const open = state === 'open'
  return (
    <li className="relative pl-12 pb-8 last:pb-0">
      {/* connector line between step markers */}
      <span aria-hidden className="absolute left-[15px] top-8 bottom-0 w-px bg-line [li:last-child>&]:hidden" />
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-0 h-8 w-8 rounded-full grid place-items-center text-[13px] font-semibold',
          done && 'bg-accent text-accent-fg',
          open && 'bg-surface text-accent-text ring-2 ring-accent',
          !done && !open && 'bg-surface-2 text-fg-subtle'
        )}
      >
        {done ? <Check size={16} strokeWidth={3} /> : index}
      </span>
      <div className="flex items-baseline justify-between gap-4 min-h-8 pt-1">
        <h2 className={cn('text-[15px] font-semibold', !done && !open && 'text-fg-subtle')}>
          <span className="sr-only">{t('Step {index}: ', { index })}</span>
          {title}
        </h2>
        {done && onEdit && (
          <button type="button" onClick={onEdit} className="text-[13px] text-fg-muted hover:text-fg hover:underline underline-offset-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-focus/60">
            {t('Edit')}
          </button>
        )}
      </div>
      {done && summary && <p className="text-[13px] text-fg-muted mt-0.5">{summary}</p>}
      {open && <div className="mt-4">{children}</div>}
    </li>
  )
}

// ---------- step 1: details ----------

function DetailsStep({ data, setData, onDone }) {
  const [saving, setSaving] = React.useState(false)
  const filled = DETAILS.filter((f) => (data[f.name] || '').trim()).length
  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    await send({ type: 'SAVE_PROFILE', profile: Object.fromEntries(DETAILS.map((f) => [f.name, (data[f.name] || '').trim()])) })
    setSaving(false)
    onDone()
  }
  return (
    <form onSubmit={save}>
      <p className="text-[13px] text-fg-muted mb-4">{t('The basics most forms ask for. You can add work, address and more later.')}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {DETAILS.map((f) => (
          <Field key={f.name} label={t(f.label)}>
            <Input
              type={f.type || 'text'}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              value={data[f.name] || ''}
              onChange={(e) => setData((d) => ({ ...d, [f.name]: e.target.value }))}
            />
          </Field>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" variant="primary" loading={saving} disabled={!filled}>{t('Save and continue')}</Button>
        <span className="text-[12px] text-fg-subtle">{t('Saved only in this browser.')}</span>
      </div>
    </form>
  )
}

// ---------- step 2: pin ----------

function PinIllustration() {
  return (
    <div aria-hidden className="rounded-lg border border-line bg-surface-2 p-3">
      <div className="flex items-center justify-end gap-2 rounded-md bg-surface border border-line px-3 h-9">
        <span className="h-2 w-24 rounded-full bg-line mr-auto" />
        <span className="h-6 w-6 rounded-md grid place-items-center text-fg-muted ring-2 ring-accent">
          <Puzzle size={14} />
        </span>
        <span className="h-5 w-5 rounded-full bg-line" />
      </div>
      <div className="ml-auto mt-1.5 w-56 rounded-md bg-surface border border-line shadow-sf-md p-1.5">
        <p className="px-1.5 pb-1 text-[11px] text-fg-subtle">{t('Extensions')}</p>
        <div className="flex items-center gap-2 rounded px-1.5 h-8 bg-surface-2">
          <Logo size={16} />
          <span className="text-[12px] flex-1">SmartFill</span>
          <span className="h-6 w-6 rounded grid place-items-center text-accent-text ring-2 ring-accent">
            <Pin size={13} />
          </span>
        </div>
      </div>
    </div>
  )
}

function PinStep({ onDone }) {
  return (
    <div>
      {isFirefox ? (
        <p className="text-[13px] text-fg-muted mb-4">
          {t('Click the {extensions} button (puzzle piece) in the toolbar, then the gear next to SmartFill and choose {pin}.', { extensions: '\u0001', pin: '\u0002' }).split(/(\u0001|\u0002)/).map((part, i) =>
            part === '\u0001' ? <b key={i} className="text-fg">{t('Extensions')}</b> : part === '\u0002' ? <b key={i} className="text-fg">{t('Pin to Toolbar')}</b> : part
          )}
        </p>
      ) : (
        <p className="text-[13px] text-fg-muted mb-4">
          {t('Click the {extensions} button (puzzle piece) in the toolbar, then the {pin} next to SmartFill.', { extensions: '\u0001', pin: '\u0002' }).split(/(\u0001|\u0002)/).map((part, i) =>
            part === '\u0001' ? <b key={i} className="text-fg">{t('Extensions')}</b> : part === '\u0002' ? <b key={i} className="text-fg">{t('pin')}</b> : part
          )}
        </p>
      )}
      <PinIllustration />
      <div className="mt-5 flex items-center gap-3">
        <Button variant="primary" onClick={onDone}>{t('Done')}</Button>
        <button type="button" onClick={onDone} className="text-[13px] text-fg-muted hover:text-fg hover:underline underline-offset-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-focus/60">
          {t('Skip')}
        </button>
      </div>
    </div>
  )
}

// ---------- step 3: try it ----------

const demoInput =
  'block w-full mt-1 h-9 px-2.5 rounded-[3px] border border-[#c9c4bb] bg-white text-[14px] text-[#222] outline-none focus:border-[#1f3a2e]'

function TryStep({ onDone }) {
  const formRef = React.useRef(null)
  const snap = React.useRef(null)
  const [result, setResult] = React.useState(null) // null | { filled } | 'empty' | 'undone'

  const tryIt = async () => {
    const res = await send({ type: 'GET_PROFILE' })
    const profile = deriveProfile(res?.profile || {})
    const map = findFillableInputs(formRef.current)
    const entries = []
    for (const [key, targets] of Object.entries(map)) {
      for (const t of targets) {
        const value = profile[key]
        if (value) entries.push({ key, target: t, el: Array.isArray(t) ? t[0] : t, label: LABELS[key] || key, value })
      }
    }
    if (!entries.length) return setResult('empty')
    // The same preview people see on websites: highlight, click a label to skip, then confirm.
    showPreview(entries, {
      onConfirm: (skipped) => {
        const chosen = {}
        entries.forEach((e, i) => { if (!skipped.has(i)) (chosen[e.key] ||= []).push(e.target) })
        snap.current = snapshot(chosen)
        const { filled } = fillFields(chosen, profile)
        setResult({ filled })
      },
    })
  }

  const undo = () => {
    if (snap.current) restore(snap.current)
    snap.current = null
    setResult('undone')
  }

  return (
    <div>
      <p className="text-[13px] text-fg-muted mb-4">
        {t("Here's a sample form. SmartFill highlights what it will fill so you can check it first. Click a highlighted label to skip that field.")}
      </p>

      {/* Looks like an ordinary website form, not like SmartFill's own UI */}
      <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="rounded-lg border border-line bg-[#f6f3ee] p-1">
        <div className="rounded-md bg-white px-5 py-4 text-[#222]" style={{ fontFamily: 'system-ui, sans-serif' }}>
          <p className="text-[15px] font-semibold mb-3" style={{ fontFamily: 'Georgia, serif' }}>Create your account</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            <label>First name<input name="first_name" className={demoInput} /></label>
            <label>Last name<input name="last_name" className={demoInput} /></label>
            <label>Email address<input name="email" type="email" className={demoInput} /></label>
            <label>Mobile number<input name="mobile" type="tel" className={demoInput} /></label>
            <label className="col-span-2">City<input name="city" className={demoInput} /></label>
          </div>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-3 min-h-9">
        <Button variant="primary" onClick={tryIt}>{t('Fill with SmartFill')}</Button>
        <p aria-live="polite" className="text-[13px]">
          {result === 'empty' && <span className="text-fg-muted">{t('Add your details in step 1 first.')}</span>}
          {result === 'undone' && <span className="text-fg-muted">{t('Form cleared.')}</span>}
          {result?.filled != null && (
            <span className="text-success">
              {tn(result.filled, 'Filled {n} field.', 'Filled {n} fields.')}{' '}
              <button type="button" onClick={undo} className="text-accent-text font-medium hover:underline underline-offset-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-focus/60">
                {t('Undo')}
              </button>
            </span>
          )}
        </p>
      </div>
      {result?.filled != null && (
        <div className="mt-5">
          <Button onClick={onDone}>{t('Finish')}</Button>
        </div>
      )}
    </div>
  )
}

// ---------- page ----------

function AllSet() {
  return (
    <section className="mt-10 rounded-xl border border-line bg-surface p-5">
      <h2 className="text-[15px] font-semibold">{t("You're all set")}</h2>
      <p className="text-[13px] text-fg-muted mt-1">{t('On any form, click SmartFill in the toolbar or the button at the edge of the page.')}</p>
      <dl className="mt-4 grid gap-2 text-[13px]">
        {[
          [['Alt', 'Shift', 'F'], t('Fill the form')],
          [['Alt', 'Shift', 'Z'], t('Undo the last fill')],
          [['Alt', 'Shift', 'P'], t('Switch profile')],
        ].map(([keys, label]) => (
          <div key={label} className="flex items-center gap-3">
            <dt className="w-32"><Kbd keys={keys} /></dt>
            <dd className="text-fg-muted">{label}</dd>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <dt className="w-32 text-fg-muted">{t('Right-click')}</dt>
          <dd className="text-fg-muted">{t('Fill a single field')}</dd>
        </div>
      </dl>
      <div className="mt-5 flex gap-2">
        <Button variant="primary" onClick={() => chrome.runtime.openOptionsPage()}>{t('Add more details')}</Button>
        <Button onClick={() => window.close()}>{t('Close')}</Button>
      </div>
    </section>
  )
}

function Welcome() {
  const [step, setStep] = React.useState(1) // 1..3, 4 = finished
  const [data, setData] = React.useState({})

  React.useEffect(() => {
    send({ type: 'GET_PROFILE' }).then((res) => {
      const p = res?.profile || {}
      setData(p)
      // Returning users with details already saved start at step 2.
      if (DETAILS.some((f) => (p[f.name] || '').trim())) setStep((s) => (s === 1 ? 2 : s))
    })
  }, [])

  const state = (n) => (step === n ? 'open' : step > n ? 'done' : 'todo')
  const detailsSummary = [data.fullName, data.email].filter(Boolean).join(' · ')

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-xl mx-auto px-5 py-12 sm:py-16">
        <header className="mb-10">
          <Logo size={40} />
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">{t('Welcome to SmartFill')}</h1>
          <p className="mt-1.5 text-[14px] text-fg-muted">{t("Three quick steps and you're ready to fill forms in one click.")}</p>
        </header>

        <ol>
          <Step index={1} title={t('Add your details')} state={state(1)} summary={detailsSummary} onEdit={() => setStep(1)}>
            <DetailsStep data={data} setData={setData} onDone={() => setStep(2)} />
          </Step>
          <Step index={2} title={t('Pin SmartFill to your toolbar')} state={state(2)} summary={t('Pinned, or skipped for now.')} onEdit={() => setStep(2)}>
            <PinStep onDone={() => setStep(3)} />
          </Step>
          <Step index={3} title={t('Try it on a sample form')} state={state(3)} summary={t('Done.')} onEdit={() => setStep(3)}>
            <TryStep onDone={() => setStep(4)} />
          </Step>
        </ol>

        {step === 4 && <AllSet />}

        <footer className="mt-12 text-[12px] text-fg-subtle">
          {t('Your details never leave this browser.')}{' '}
          <a className="underline underline-offset-2 hover:text-fg-muted" href={PRIVACY_URL} target="_blank" rel="noreferrer">{t('Privacy policy')}</a>
        </footer>
      </div>
    </main>
  )
}

try {
  chrome.storage.onChanged.addListener((c, area) => {
    if (area === 'local' && 'language' in c) location.reload()
  })
} catch {}

initLanguage().then(() =>
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Welcome />
    </React.StrictMode>
  )
)
