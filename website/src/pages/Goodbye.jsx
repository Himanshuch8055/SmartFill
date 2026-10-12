import React from 'react'
import { Link } from 'react-router-dom'
import InstallButtons from '../components/InstallButtons'
import { GITHUB_URL, ISSUES_URL, REPORT_SITE_URL, CONTACT_EMAIL } from '../utils/links'

// Opened by the browser after SmartFill is uninstalled. Nothing is collected here: each reason
// shows a possible fix, and people can choose to report a problem on GitHub or by email.
const REASONS = [
  {
    id: 'wrong-field',
    label: 'It filled the wrong field',
    fix: (
      <>
        Correct the field after a fill and choose <strong>Remember</strong>. SmartFill will use your correction on that site from then on.
        You can also <a className="link" href={REPORT_SITE_URL} target="_blank" rel="noreferrer">report the site</a> so detection improves for everyone.
      </>
    ),
  },
  {
    id: 'site',
    label: 'It didn’t work on a site I use',
    fix: (
      <>
        Some sites build forms in unusual ways. Please <a className="link" href={REPORT_SITE_URL} target="_blank" rel="noreferrer">tell us which site</a>;
        site reports are the fastest way we fix detection.
      </>
    ),
  },
  {
    id: 'button',
    label: 'The button on pages got in the way',
    fix: <>You can turn the page button off in <strong>Settings → Show button on pages</strong> and still fill from the toolbar or with Alt+Shift+F.</>,
  },
  {
    id: 'privacy',
    label: 'I had a privacy concern',
    fix: (
      <>
        SmartFill keeps everything in your browser and never sends data anywhere. Read the <Link className="link" to="/privacy">privacy policy</Link> or check
        the <a className="link" href={GITHUB_URL} target="_blank" rel="noreferrer">source code</a>.
      </>
    ),
  },
  {
    id: 'other',
    label: 'Something else',
    fix: (
      <>
        We’d love to hear it. <a className="link" href={ISSUES_URL} target="_blank" rel="noreferrer">Open an issue</a> or email{' '}
        <a className="link" href={`mailto:${CONTACT_EMAIL}?subject=SmartFill%20feedback`}>{CONTACT_EMAIL}</a>.
      </>
    ),
  },
]

export default function Goodbye() {
  const [open, setOpen] = React.useState(null)
  React.useEffect(() => {
    document.title = 'Sorry to see you go · SmartFill'
  }, [])
  return (
    <section className="container-site max-w-2xl pt-16 pb-8">
      <p className="eyebrow">SmartFill was removed</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">Sorry to see you go</h1>
      <p className="mt-4 lead">
        Your saved details were deleted with the extension. If something went wrong, there may be a quick fix.
      </p>

      <div className="mt-10 rounded-2xl border border-line bg-surface divide-y divide-line">
        {REASONS.map((r) => (
          <div key={r.id}>
            <button
              type="button"
              aria-expanded={open === r.id}
              onClick={() => setOpen(open === r.id ? null : r.id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-medium rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-focus/60"
            >
              {r.label}
              <span aria-hidden className={`text-fg-subtle transition-transform ${open === r.id ? 'rotate-45' : ''}`}>+</span>
            </button>
            {open === r.id && <p className="px-5 pb-5 -mt-1 text-fg-muted leading-relaxed">{r.fix}</p>}
          </div>
        ))}
      </div>

      <div className="mt-12">
        <p className="font-medium">Changed your mind?</p>
        <InstallButtons className="mt-4" />
      </div>
      <p className="mt-10 text-sm text-fg-subtle">This page doesn’t collect or send anything.</p>
    </section>
  )
}
